export const authorize = (allowedRoles: string[]) => {
  return (req: any, res: any, next: any) => {
    try {
      if (process.env.SECURITY_MODE === "develop") {
        next();
        return res.status(200);
      }
      const role = req.user.role;
      if (!req.user || !role) {
        return;
      }

      if (allowedRoles.includes("all")) {
        next();
      }

      if (!allowedRoles.includes(role)) {
        return res.status(401).send({
          status: "error",
          message:
            "Acceso denegado: No posee los permisos para acceder a esta función",
        });
      }
      next();
    } catch (error: any) {
      throw new Error(error.message);
    }
  };
};
