import { authorize } from "../rbacMiddleware";
import { initializeAuthMiddleware, verifyToken } from "../authMiddleware";
import { AppError } from "../../../application/errors/AppError";

const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

describe("authorize", () => {
  it("permite el rol incluido", () => {
    const next = jest.fn();
    authorize(["admin"])({ user: { role: "admin" } } as any, mockRes(), next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('"all" permite cualquier rol autenticado y llama next una sola vez', () => {
    const next = jest.fn();
    authorize(["all"])({ user: { role: "mesero" } } as any, mockRes(), next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("responde 403 si el rol no está permitido", () => {
    const next = jest.fn();
    const res = mockRes();
    authorize(["admin"])({ user: { role: "mesero" } } as any, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("responde 401 sin usuario", () => {
    const next = jest.fn();
    const res = mockRes();
    authorize(["all"])({} as any, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });
});

describe("verifyToken", () => {
  const tokenService = { generateToken: jest.fn(), verifyToken: jest.fn() };
  beforeAll(() => initializeAuthMiddleware(tokenService));

  it("responde 401 sin token", async () => {
    const res = mockRes();
    await verifyToken({ headers: {} } as any, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("acepta Bearer y expone req.user", async () => {
    const user = { userId: 1, username: "a", role: "admin" };
    tokenService.verifyToken.mockResolvedValue(user);
    const req: any = { headers: { authorization: "Bearer abc" } };
    const next = jest.fn();
    await verifyToken(req, mockRes(), next);
    expect(tokenService.verifyToken).toHaveBeenCalledWith("abc");
    expect(req.user).toEqual(user);
    expect(next).toHaveBeenCalled();
  });

  it("acepta la cookie auth_token", async () => {
    tokenService.verifyToken.mockResolvedValue({ userId: 1, role: "mesero" });
    const next = jest.fn();
    await verifyToken(
      { headers: {}, cookies: { auth_token: "cookie-token" } } as any,
      mockRes(),
      next,
    );
    expect(tokenService.verifyToken).toHaveBeenCalledWith("cookie-token");
    expect(next).toHaveBeenCalled();
  });

  it("responde 401 con token inválido", async () => {
    tokenService.verifyToken.mockRejectedValue(
      AppError.unauthorized("Token inválido"),
    );
    const res = mockRes();
    await verifyToken(
      { headers: { authorization: "Bearer x" } } as any,
      res,
      jest.fn(),
    );
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith({
      status: "error",
      message: "Token inválido",
    });
  });
});
