import { DataSource } from "typeorm";
import { closeTestDatabase, resetTables, setupTestDatabase } from "./db";
import { UserService } from "../../application/services/UserService";
import { UserTypeService } from "../../application/services/UserTypeService";
import { User } from "../../core/entities/User";
import { UserType } from "../../core/entities/UserType";
import { Role } from "../../core/enums/Role";

let ds: DataSource;
let users: UserService;
let types: UserTypeService;
let adminType: UserType;
let waiterType: UserType;
let admin: { userId: number };

beforeAll(async () => {
  ds = await setupTestDatabase();
  users = new UserService(ds.getRepository(User));
  types = new UserTypeService(ds.getRepository(UserType));
});
afterAll(closeTestDatabase);

beforeEach(async () => {
  await resetTables();
  adminType = await types.save({ name: "Admin", permissionLevel: 10, role: Role.ADMIN });
  waiterType = await types.save({ name: "Mesero", permissionLevel: 3, role: Role.MESERO });
  admin = await users.save({
    username: "admin",
    password: "secreto",
    email: "a@test.com",
    typeId: adminType.userTypeId,
  });
});

describe("Usuarios y roles", () => {
  it("rechaza usuarios repetidos y roles inexistentes", async () => {
    await expect(
      users.save({ username: "admin", password: "secreto", email: "b@test.com", typeId: waiterType.userTypeId }),
    ).rejects.toMatchObject({ statusCode: 409 });
    await expect(
      users.save({ username: "nuevo", password: "secreto", email: "b@test.com", typeId: 999 }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("desactiva y reactiva a otro usuario", async () => {
    const waiter = await users.save({
      username: "mesero",
      password: "secreto",
      email: "m@test.com",
      typeId: waiterType.userTypeId,
    });

    await users.delete(waiter.userId, admin.userId);
    expect((await users.getById(waiter.userId)).active).toBe(false);

    await users.update({ userId: waiter.userId, active: true, actorId: admin.userId });
    expect((await users.getById(waiter.userId)).active).toBe(true);
  });

  it("un admin no puede desactivarse ni quitarse el rol", async () => {
    await expect(users.delete(admin.userId, admin.userId)).rejects.toMatchObject({
      statusCode: 409,
    });
    await expect(
      users.update({ userId: admin.userId, active: false, actorId: admin.userId }),
    ).rejects.toMatchObject({ statusCode: 409 });
    await expect(
      users.update({ userId: admin.userId, typeId: waiterType.userTypeId, actorId: admin.userId }),
    ).rejects.toMatchObject({ statusCode: 409 });
    await expect(
      types.update({ userTypeId: adminType.userTypeId, role: Role.MESERO, actorId: admin.userId }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it("no elimina un rol con usuarios", async () => {
    await expect(types.delete(adminType.userTypeId)).rejects.toMatchObject({ statusCode: 409 });
    await types.delete(waiterType.userTypeId);
    expect(await ds.getRepository(UserType).count()).toBe(1);
  });
});
