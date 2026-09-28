export interface loginUser {
  userId: number;
  username: string;
  password: string;
  role: string;
}

export interface payloadUser {
  username: string;
  role: string;
}

export interface SaveUserDTO {
  username: string;
  password: string;
  email: string;
  typeId: number;
}

export interface UserItemDTO {
  userId: number;
  username: string;
  email: string;
  userTypeId: number;
  userType?: {
    userTypeId: number;
    name: string;
    permissionLevel: number;
  };
}

export interface UpdateUserDTO {
  username?: string;
  password?: string;
  email?: string;
  typeId?: number;
}

export interface SaveUserTypeDTO {
  name: string;
  permissionLevel: number;
}

export interface UserTypeItemDTO {
  userTypeId: number;
  name: string;
  permissionLevel: number;
}

export interface UpdateUserTypeDTO {
  name?: string;
  permissionLevel?: number;
}

export interface UserResponseDTO {
  userId: number;
  username: string;
  userTypeId: number;
  email: string;
  active: boolean;
  userType?: {
    userTypeId: number;
    name: string;
  };
}
