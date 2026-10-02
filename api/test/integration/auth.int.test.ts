import request from "supertest";
import * as bcrypt from "bcrypt";
import { DataSource } from "typeorm";
import { closeTestDatabase, resetTables, setupTestDatabase } from "./db";
import { app } from "../../main";
import { initializeDependencies } from "../../core/dependencyInjection";
import { User } from "../../core/entities/User";
import { UserType } from "../../core/entities/UserType";
import { Role } from "../../core/enums/Role";

const CSRF = { "X-Requested-With": "EstacionCafe" };
const PASSWORD = "Secreto123";

let ds: DataSource;
let ids: Record<"admin" | "ana" | "luis" | "caja", number>;

const cookieOf = (res: request.Response, name: string) =>
  ([] as string[])
    .concat(res.headers["set-cookie"] ?? [])
    .find((c) => c.startsWith(`${name}=`))
    ?.split(";")[0];

const loginAs = (username: string) =>
  request(app).post("/api/users/login").set(CSRF).send({ username, password: PASSWORD });

/** Admin con sesión que además autoriza el equipo; devuelve ambas cookies. */
const adminWithDevice = async () => {
  const admin = cookieOf(await loginAs("admin"), "auth_token")!;
  const res = await request(app)
    .post("/api/devices")
    .set(CSRF)
    .set("Cookie", admin)
    .send({ name: "Tablet barra" });
  expect(res.status).toBe(201);
  return { admin, device: cookieOf(res, "device_token")!, deviceId: res.body.data.deviceId };
};

const setPin = (admin: string, userId: number, pin?: string) =>
  request(app)
    .put(`/api/users/${userId}/pin`)
    .set(CSRF)
    .set("Cookie", admin)
    .send(pin ? { pin } : {});

const pinLogin = (pin: string, device?: string) => {
  const req = request(app).post("/api/auth/pin").set(CSRF);
  if (device) req.set("Cookie", device);
  return req.send({ pin });
};

beforeAll(async () => {
  ds = await setupTestDatabase();
  await initializeDependencies();
});
afterAll(closeTestDatabase);

beforeEach(async () => {
  await resetTables();
  const types = ds.getRepository(UserType);
  const [admin, mesero, cajero] = await types.save([
    { name: "Admin", permissionLevel: 10, role: Role.ADMIN },
    { name: "Mesero", permissionLevel: 3, role: Role.MESERO },
    { name: "Cajero", permissionLevel: 5, role: Role.CAJERO },
  ]);
  const password = await bcrypt.hash(PASSWORD, 4);
  const users = await ds.getRepository(User).save([
    { username: "admin", password, email: "a@t.sv", userTypeId: admin!.userTypeId, active: true },
    { username: "ana", password, email: "ana@t.sv", userTypeId: mesero!.userTypeId, active: true },
    { username: "luis", password, email: "luis@t.sv", userTypeId: mesero!.userTypeId, active: true },
    { username: "caja", password, email: "c@t.sv", userTypeId: cajero!.userTypeId, active: true },
  ]);
  ids = { admin: users[0]!.userId, ana: users[1]!.userId, luis: users[2]!.userId, caja: users[3]!.userId };
});

describe("Sesión por cookie", () => {
  it("el login deja una cookie httpOnly y no expone el token en el body", async () => {
    const res = await loginAs("ana");
    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeUndefined();
    expect(res.body.data.user).toMatchObject({ username: "ana", role: "mesero" });
    const raw = ([] as string[]).concat(res.headers["set-cookie"]).join(";");
    expect(raw).toMatch(/auth_token=.*HttpOnly/i);
    expect(raw).toMatch(/SameSite=Strict/i);

    const me = await request(app).get("/api/users/me").set("Cookie", cookieOf(res, "auth_token")!);
    expect(me.status).toBe(200);
    expect(me.body.data.username).toBe("ana");
  });

  it("los scripts pueden pedir el token para usarlo como Bearer", async () => {
    const res = await request(app)
      .post("/api/users/login")
      .set("X-Token-In-Body", "true")
      .set(CSRF)
      .send({ username: "admin", password: PASSWORD });
    const me = await request(app).get("/api/users/me").set("Authorization", `Bearer ${res.body.data.token}`);
    expect(me.status).toBe(200);
  });

  it("con cookie, las mutaciones exigen el header anti-CSRF", async () => {
    const admin = cookieOf(await loginAs("admin"), "auth_token")!;
    const blocked = await request(app).post("/api/tables").set("Cookie", admin).send({ tableId: "X1", zone: "Z" });
    expect(blocked.status).toBe(403);
    const ok = await request(app)
      .post("/api/tables")
      .set("Cookie", admin)
      .set(CSRF)
      .send({ tableId: "X1", zone: "Z" });
    expect(ok.status).toBe(201);
  });

  it("cerrar sesión revoca el token aunque no haya vencido", async () => {
    const cookie = cookieOf(await loginAs("ana"), "auth_token")!;
    await request(app).post("/api/users/logout").set(CSRF).set("Cookie", cookie).expect(200);
    const me = await request(app).get("/api/users/me").set("Cookie", cookie);
    expect(me.status).toBe(401);
  });

  it("desactivar a un usuario corta su sesión al instante", async () => {
    const admin = cookieOf(await loginAs("admin"), "auth_token")!;
    const ana = cookieOf(await loginAs("ana"), "auth_token")!;
    await request(app).delete(`/api/users/${ids.ana}`).set(CSRF).set("Cookie", admin).expect(200);
    expect((await request(app).get("/api/users/me").set("Cookie", ana)).status).toBe(401);
    expect((await loginAs("ana")).status).toBe(401);
  });

  it("cambiar el rol de un usuario lo obliga a entrar de nuevo", async () => {
    const admin = cookieOf(await loginAs("admin"), "auth_token")!;
    const ana = cookieOf(await loginAs("ana"), "auth_token")!;
    const cajeroType = (await ds.getRepository(UserType).findOneByOrFail({ role: Role.CAJERO })).userTypeId;
    await request(app)
      .put(`/api/users/${ids.ana}`)
      .set(CSRF)
      .set("Cookie", admin)
      .send({ typeId: cajeroType })
      .expect(200);
    expect((await request(app).get("/api/users/me").set("Cookie", ana)).status).toBe(401);
  });
});

describe("PIN en dispositivos autorizados", () => {
  it("el PIN solo funciona en un dispositivo autorizado", async () => {
    const { admin, device } = await adminWithDevice();
    const { body } = await setPin(admin, ids.ana, "4821");
    expect(body.data.pin).toBe("4821");

    expect((await pinLogin("4821")).status).toBe(403);
    const ok = await pinLogin("4821", device);
    expect(ok.status).toBe(200);
    expect(ok.body.data.user).toMatchObject({ username: "ana", role: "mesero" });

    const me = await request(app).get("/api/users/me").set("Cookie", cookieOf(ok, "auth_token")!);
    expect(me.body.data.username).toBe("ana");
  });

  it("el estado del dispositivo es público y no revela el token", async () => {
    const { device } = await adminWithDevice();
    const yes = await request(app).get("/api/auth/device").set("Cookie", device);
    expect(yes.body.data).toEqual({ authorized: true, name: "Tablet barra" });
    const no = await request(app).get("/api/auth/device");
    expect(no.body.data).toEqual({ authorized: false, name: null });
  });

  it("los PIN son únicos, generados o escritos, y solo para meseros y cajeros", async () => {
    const { admin } = await adminWithDevice();
    await setPin(admin, ids.ana, "1111").expect(200);
    expect((await setPin(admin, ids.luis, "1111")).status).toBe(409);
    const generated = await setPin(admin, ids.luis);
    expect(generated.body.data.pin).toMatch(/^\d{4}$/);
    expect(generated.body.data.pin).not.toBe("1111");
    expect((await setPin(admin, ids.admin, "2222")).status).toBe(400);
    expect((await setPin(admin, ids.caja, "3333")).status).toBe(200);
  });

  it("un PIN incorrecto nunca bloquea: tras una ráfaga de fallos el correcto entra", async () => {
    const { admin, device } = await adminWithDevice();
    await setPin(admin, ids.ana, "4821");
    for (let i = 0; i < 11; i++) expect((await pinLogin("0000", device)).status).toBe(401);

    const started = Date.now();
    const ok = await pinLogin("4821", device);
    expect(ok.status).toBe(200);
    // El acierto no se demora: el freno solo afecta a los fallos
    expect(Date.now() - started).toBeLessThan(800);
  }, 20_000);

  it("revocar el dispositivo corta sus sesiones y deja de aceptar PIN", async () => {
    const { admin, device, deviceId } = await adminWithDevice();
    await setPin(admin, ids.ana, "4821");
    const ana = cookieOf(await pinLogin("4821", device), "auth_token")!;

    await request(app).delete(`/api/devices/${deviceId}`).set(CSRF).set("Cookie", admin).expect(200);
    expect((await request(app).get("/api/users/me").set("Cookie", ana)).status).toBe(401);
    expect((await pinLogin("4821", device)).status).toBe(403);
  });

  it("cambiar el PIN cierra las sesiones del usuario", async () => {
    const { admin, device } = await adminWithDevice();
    await setPin(admin, ids.ana, "4821");
    const ana = cookieOf(await pinLogin("4821", device), "auth_token")!;
    await setPin(admin, ids.ana, "5555");
    expect((await request(app).get("/api/users/me").set("Cookie", ana)).status).toBe(401);
    expect((await pinLogin("4821", device)).status).toBe(401);
    expect((await pinLogin("5555", device)).status).toBe(200);
  });

  it("un mesero no puede administrar dispositivos ni PIN", async () => {
    const ana = cookieOf(await loginAs("ana"), "auth_token")!;
    expect((await request(app).get("/api/devices").set("Cookie", ana)).status).toBe(403);
    expect((await setPin(ana, ids.luis, "9999")).status).toBe(403);
  });
});
