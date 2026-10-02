/** Rol de autorización asociado a cada tipo de usuario. */
export enum Role {
  ADMIN = "admin",
  MESERO = "mesero",
  CAJERO = "cajero",
}

export const ALL_ROLES = Object.values(Role);
