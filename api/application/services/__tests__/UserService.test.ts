import { Repository } from "typeorm";
import { UserService } from "../UserService";
import { User } from "../../../core/entities/User";
import { SaveUserDTO } from "../../DTOs/UserDTO";
import * as bcrypt from "bcrypt";

// Mock de bcrypt
jest.mock("bcrypt", () => ({
  hash: jest.fn(),
}));

describe("UserService", () => {
  let userService: UserService;
  let mockRepository: jest.Mocked<Repository<User>>;
  let mockBcryptHash: jest.MockedFunction<typeof bcrypt.hash>;

  beforeEach(() => {
    // Setup bcrypt mock
    mockBcryptHash = bcrypt.hash as jest.MockedFunction<typeof bcrypt.hash>;
    
    // Crear mock del repositorio
    mockRepository = {
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    } as any;

    // Crear instancia del servicio con el repositorio mock
    userService = new UserService(mockRepository);

    // Limpiar console.log
    jest.spyOn(console, "log").mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("save", () => {
    it("debería guardar un usuario con contraseña encriptada", async () => {
      const userData: SaveUserDTO = {
        username: "johndoe",
        password: "MyPassword123!",
        typeId: 1,
        email: "john.doe@example.com",
      };

      const hashedPassword = "hashed_password_123";
      const savedUser = {
        userId: 1,
        username: "johndoe",
        password: hashedPassword,
        userTypeId: 1,
        email: "john.doe@example.com",
        active: true,
      } as User;

      mockBcryptHash.mockResolvedValue(hashedPassword as never);
      mockRepository.save.mockResolvedValue(savedUser);

      const result = await userService.save(userData);

      expect(mockBcryptHash).toHaveBeenCalledWith("MyPassword123!", 10);
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          username: "johndoe",
          password: hashedPassword,
          userTypeId: 1,
          email: "john.doe@example.com",
        })
      );
      expect(result).toEqual(savedUser);
      expect(console.log).toHaveBeenCalledWith("Guardando usuario...");
    });

    it("debería manejar errores durante la encriptación", async () => {
      const userData: SaveUserDTO = {
        username: "johndoe",
        password: "MyPassword123!",
        typeId: 1,
        email: "john.doe@example.com",
      };

      const encryptionError = new Error("Error de encriptación");
      mockBcryptHash.mockRejectedValue(encryptionError as never);

      await expect(userService.save(userData)).rejects.toThrow("Error de encriptación");
      expect(mockBcryptHash).toHaveBeenCalledWith("MyPassword123!", 10);
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it("debería manejar errores del repositorio", async () => {
      const userData: SaveUserDTO = {
        username: "johndoe",
        password: "MyPassword123!",
        typeId: 1,
        email: "john.doe@example.com",
      };

      const hashedPassword = "hashed_password_123";
      const repositoryError = new Error("Error de base de datos");

      mockBcryptHash.mockResolvedValue(hashedPassword as never);
      mockRepository.save.mockRejectedValue(repositoryError);

      await expect(userService.save(userData)).rejects.toThrow("Error de base de datos");
      expect(mockBcryptHash).toHaveBeenCalledWith("MyPassword123!", 10);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it("debería usar el número correcto de salt rounds", async () => {
      const userData: SaveUserDTO = {
        username: "testuser",
        password: "TestPass123!",
        typeId: 2,
        email: "test@example.com",
      };

      mockBcryptHash.mockResolvedValue("hashed_password" as never);
      mockRepository.save.mockResolvedValue({} as User);

      await userService.save(userData);

      expect(mockBcryptHash).toHaveBeenCalledWith("TestPass123!", 10);
    });

    it("debería crear una entidad User con los datos correctos", async () => {
      const userData: SaveUserDTO = {
        username: "janedoe",
        password: "SecurePass456!",
        typeId: 3,
        email: "jane@example.com",
      };

      const hashedPassword = "super_secure_hash";
      mockBcryptHash.mockResolvedValue(hashedPassword as never);
      mockRepository.save.mockResolvedValue({} as User);

      await userService.save(userData);

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          username: "janedoe",
          password: hashedPassword,
          userTypeId: 3,
          email: "jane@example.com",
        })
      );
    });

    it("debería manejar contraseñas con caracteres especiales", async () => {
      const userData: SaveUserDTO = {
        username: "specialuser",
        password: "P@$$w0rd!#$%^&*()",
        typeId: 1,
        email: "special@example.com",
      };

      const hashedPassword = "hashed_special_password";
      mockBcryptHash.mockResolvedValue(hashedPassword as never);
      mockRepository.save.mockResolvedValue({} as User);

      await userService.save(userData);

      expect(mockBcryptHash).toHaveBeenCalledWith("P@$$w0rd!#$%^&*()", 10);
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          password: hashedPassword,
        })
      );
    });
  });

  describe("getAll", () => {
    it("debería obtener todos los usuarios con relaciones", async () => {
      const mockUsers = [
        {
          userId: 1,
          username: "johndoe",
          email: "john@example.com",
          password: "hashed",
          userTypeId: 1,
          active: true,
        },
        {
          userId: 2,
          username: "janedoe",
          email: "jane@example.com",
          password: "hashed",
          userTypeId: 2,
          active: true,
        },
      ] as User[];

      mockRepository.find.mockResolvedValue(mockUsers);

      const result = await userService.getAll();

      expect(mockRepository.find).toHaveBeenCalledWith({
        relations: ["userType"],
        order: { username: "ASC" }
      });
      expect(result).toEqual(mockUsers);
      expect(console.log).toHaveBeenCalledWith("Obteniendo usuarios...");
    });

    it("debería retornar array vacío cuando no hay usuarios", async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await userService.getAll();

      expect(mockRepository.find).toHaveBeenCalledWith({
        relations: ["userType"],
        order: { username: "ASC" }
      });
      expect(result).toEqual([]);
      expect(console.log).toHaveBeenCalledWith("Obteniendo usuarios...");
    });

    it("debería manejar errores del repositorio", async () => {
      const repositoryError = new Error("Error de conexión a la base de datos");
      mockRepository.find.mockRejectedValue(repositoryError);

      await expect(userService.getAll()).rejects.toThrow("Error de conexión a la base de datos");
      expect(mockRepository.find).toHaveBeenCalledWith({
        relations: ["userType"],
        order: { username: "ASC" }
      });
    });
  });

  describe("saveAll", () => {
    it("debería guardar múltiples usuarios con contraseñas encriptadas", async () => {
      const usersData: SaveUserDTO[] = [
        {
          username: "user1",
          password: "Pass1!",
          typeId: 1,
          email: "user1@example.com",
        },
        {
          username: "user2",
          password: "Pass2!",
          typeId: 2,
          email: "user2@example.com",
        },
      ];

      const hashedPasswords = ["hashed_pass1", "hashed_pass2"];
      const savedUsers = usersData.map((userData, index) => ({
        userId: index + 1,
        username: userData.username,
        password: hashedPasswords[index],
        userTypeId: userData.typeId,
        email: userData.email,
        active: true,
      })) as User[];

      mockBcryptHash
        .mockResolvedValueOnce(hashedPasswords[0] as never)
        .mockResolvedValueOnce(hashedPasswords[1] as never);
      mockRepository.save.mockResolvedValue(savedUsers as any);

      const result = await userService.saveAll(usersData);

      expect(mockBcryptHash).toHaveBeenCalledTimes(2);
      expect(mockBcryptHash).toHaveBeenNthCalledWith(1, "Pass1!", 10);
      expect(mockBcryptHash).toHaveBeenNthCalledWith(2, "Pass2!", 10);
      expect(mockRepository.save).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({
          username: "user1",
          password: "hashed_pass1",
          userTypeId: 1,
          email: "user1@example.com",
        }),
        expect.objectContaining({
          username: "user2",
          password: "hashed_pass2",
          userTypeId: 2,
          email: "user2@example.com",
        }),
      ]));
      expect(result).toEqual(savedUsers);
    });

    it("debería manejar array vacío", async () => {
      mockRepository.save.mockResolvedValue([] as any);

      const result = await userService.saveAll([]);

      expect(mockRepository.save).toHaveBeenCalledWith([]);
      expect(result).toEqual([]);
      expect(mockBcryptHash).not.toHaveBeenCalled();
    });

    it("debería manejar errores durante la encriptación", async () => {
      const usersData: SaveUserDTO[] = [
        {
          username: "user1",
          password: "Pass1!",
          typeId: 1,
          email: "user1@example.com",
        },
      ];

      const encryptionError = new Error("Error de encriptación");
      mockBcryptHash.mockRejectedValue(encryptionError as never);

      await expect(userService.saveAll(usersData)).rejects.toThrow("Error de encriptación");
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe("getById", () => {
    it("debería obtener un usuario por ID con relaciones", async () => {
      const userId = 1;
      const mockUser = {
        userId: 1,
        username: "johndoe",
        email: "john@example.com",
        password: "hashed",
        userTypeId: 1,
        active: true,
        userType: {
          userTypeId: 1,
          name: "Admin",
          permissionLevel: 10,
        },
      } as User;

      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await userService.getById(userId);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { userId: 1 },
        relations: ["userType"],
      });
      expect(result).toEqual(mockUser);
    });

    it("debería lanzar error cuando el usuario no existe", async () => {
      const userId = 999;
      mockRepository.findOne.mockResolvedValue(null);

      await expect(userService.getById(userId)).rejects.toThrow(
        "Usuario con ID 999 no encontrado"
      );
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { userId: 999 },
        relations: ["userType"],
      });
    });

    it("debería manejar errores del repositorio", async () => {
      const userId = 1;
      const repositoryError = new Error("Error de consulta");
      mockRepository.findOne.mockRejectedValue(repositoryError);

      await expect(userService.getById(userId)).rejects.toThrow("Error de consulta");
    });
  });

  describe("update", () => {
    it("debería actualizar un usuario exitosamente", async () => {
      const updateData = {
        userId: 1,
        username: "johnupdated",
        email: "johnupdated@example.com",
      };

      const existingUser = {
        userId: 1,
        username: "johndoe",
        password: "old_hashed_password",
        userTypeId: 1,
        email: "john@example.com",
        active: true,
      } as User;

      const updatedUser = {
        ...existingUser,
        username: "johnupdated",
        email: "johnupdated@example.com",
      } as User;

      mockRepository.findOne.mockResolvedValue(existingUser);
      mockRepository.save.mockResolvedValue(updatedUser);

      const result = await userService.update(updateData);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { userId: 1 },
      });
      expect(mockRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        userId: 1,
        username: "johnupdated",
        email: "johnupdated@example.com",
      }));
      expect(result).toEqual(updatedUser);
    });

    it("debería encriptar nueva contraseña al actualizar", async () => {
      const updateData = {
        userId: 1,
        password: "NewPassword123!",
      };

      const existingUser = {
        userId: 1,
        username: "johndoe",
        password: "old_hashed_password",
        userTypeId: 1,
        email: "john@example.com",
        active: true,
      } as User;

      const newHashedPassword = "new_hashed_password";
      mockBcryptHash.mockResolvedValue(newHashedPassword as never);
      mockRepository.findOne.mockResolvedValue(existingUser);
      mockRepository.save.mockResolvedValue(existingUser);

      await userService.update(updateData);

      expect(mockBcryptHash).toHaveBeenCalledWith("NewPassword123!", 10);
      expect(mockRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        password: newHashedPassword,
      }));
    });

    it("debería lanzar error cuando userId no se proporciona", async () => {
      const updateData = {
        username: "updated",
      };

      await expect(userService.update(updateData)).rejects.toThrow(
        "userId es requerido para actualizar"
      );
      expect(mockRepository.findOne).not.toHaveBeenCalled();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it("debería lanzar error cuando el usuario no existe", async () => {
      const updateData = {
        userId: 999,
        username: "updated",
      };

      mockRepository.findOne.mockResolvedValue(null);

      await expect(userService.update(updateData)).rejects.toThrow(
        "Usuario con ID 999 no encontrado"
      );
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { userId: 999 },
      });
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe("delete", () => {
    it("debería desactivar un usuario exitosamente (soft delete)", async () => {
      const userId = 1;
      const existingUser = {
        userId: 1,
        username: "johndoe",
        password: "hashed_password",
        userTypeId: 1,
        email: "john@example.com",
        active: true,
      } as User;

      const deactivatedUser = { ...existingUser, active: false };

      // Mock getById call within delete method
      mockRepository.findOne.mockResolvedValue(existingUser);
      mockRepository.save.mockResolvedValue(deactivatedUser);

      const result = await userService.delete(userId);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { userId },
        relations: ["userType"],
      });
      expect(mockRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        active: false,
      }));
      expect(result).toEqual({
        message: "Usuario desactivado correctamente",
        id: userId,
      });
    });

    it("debería lanzar error cuando el usuario no existe", async () => {
      const userId = 999;
      mockRepository.findOne.mockResolvedValue(null);

      await expect(userService.delete(userId)).rejects.toThrow(
        "Usuario con ID 999 no encontrado"
      );
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe("getUsersByType", () => {
    it("debería obtener usuarios por tipo", async () => {
      const typeId = 1;
      const mockUsers = [
        {
          userId: 1,
          username: "admin1",
          userTypeId: 1,
          email: "admin1@example.com",
          active: true,
        },
        {
          userId: 2,
          username: "admin2",
          userTypeId: 1,
          email: "admin2@example.com",
          active: true,
        },
      ] as User[];

      mockRepository.find.mockResolvedValue(mockUsers);

      const result = await userService.getUsersByType(typeId);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { userTypeId: typeId },
        relations: ["userType"],
        order: { username: "ASC" },
      });
      expect(result).toEqual(mockUsers);
    });

    it("debería retornar array vacío cuando no hay usuarios del tipo especificado", async () => {
      const typeId = 999;
      mockRepository.find.mockResolvedValue([]);

      const result = await userService.getUsersByType(typeId);

      expect(result).toEqual([]);
    });
  });

  describe("getUserByUsername", () => {
    it("debería obtener un usuario por username", async () => {
      const username = "johndoe";
      const mockUser = {
        userId: 1,
        username: "johndoe",
        email: "john@example.com",
        userTypeId: 1,
        active: true,
      } as User;

      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await userService.getUserByUsername(username);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { username },
        relations: ["userType"],
      });
      expect(result).toEqual(mockUser);
    });

    it("debería retornar null cuando el usuario no existe", async () => {
      const username = "nonexistent";
      mockRepository.findOne.mockResolvedValue(null);

      const result = await userService.getUserByUsername(username);

      expect(result).toBeNull();
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { username },
        relations: ["userType"],
      });
    });
  });

 

  describe("encryptPassword (método privado)", () => {
    it("debería usar bcrypt con la configuración correcta", async () => {
      const userData: SaveUserDTO = {
        username: "testuser",
        password: "TestPassword123!",
        typeId: 1,
        email: "test@example.com",
      };

      const hashedPassword = "hashed_test_password";
      mockBcryptHash.mockResolvedValue(hashedPassword as never);
      mockRepository.save.mockResolvedValue({} as User);

      await userService.save(userData);

      expect(mockBcryptHash).toHaveBeenCalledWith("TestPassword123!", 10);
      expect(mockBcryptHash).toHaveBeenCalledTimes(1);
    });
  });

  describe("Casos de integración", () => {
    it("debería procesar múltiples operaciones de guardado secuenciales", async () => {
      const users: SaveUserDTO[] = [
        {
          username: "user1",
          password: "Pass1!",
          typeId: 1,
          email: "user1@example.com",
        },
        {
          username: "user2",
          password: "Pass2!",
          typeId: 2,
          email: "user2@example.com",
        },
      ];

      mockBcryptHash
        .mockResolvedValueOnce("hash1" as never)
        .mockResolvedValueOnce("hash2" as never);
      
      mockRepository.save
        .mockResolvedValueOnce({ userId: 1 } as User)
        .mockResolvedValueOnce({ userId: 2 } as User);

      const results = await Promise.all(users.map(user => userService.save(user)));

      expect(results).toHaveLength(2);
      expect(mockBcryptHash).toHaveBeenCalledTimes(2);
      expect(mockRepository.save).toHaveBeenCalledTimes(2);
    });

    it("debería manejar correctamente la creación de entidades User", async () => {
      const userData: SaveUserDTO = {
        username: "testuser",
        password: "TestPass123!",
        typeId: 1,
        email: "test@example.com",
      };

      mockBcryptHash.mockResolvedValue("hashed_password" as never);
      
      let savedUserEntity: any;
      mockRepository.save.mockImplementation((user) => {
        savedUserEntity = user;
        return Promise.resolve({ userId: 1, ...user } as User);
      });

      await userService.save(userData);

      expect(savedUserEntity).toBeInstanceOf(User);
      expect(savedUserEntity.username).toBe("testuser");
      expect(savedUserEntity.password).toBe("hashed_password");
      expect(savedUserEntity.userTypeId).toBe(1);
      expect(savedUserEntity.email).toBe("test@example.com");
    });
  });

  describe("Validaciones de tipos", () => {
    it("debería manejar diferentes tipos de typeId", async () => {
      const userData: SaveUserDTO = {
        username: "testuser",
        password: "TestPass123!",
        typeId: 999,
        email: "test@example.com",
      };

      mockBcryptHash.mockResolvedValue("hashed_password" as never);
      mockRepository.save.mockResolvedValue({} as User);

      await userService.save(userData);

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userTypeId: 999,
        })
      );
    });

    it("debería preservar emails con diferentes formatos válidos", async () => {
      const emails = [
        "simple@example.com",
        "test.email+tag@domain.co.uk", 
        "user123@subdomain.example.org",
      ];

      for (const email of emails) {
        const userData: SaveUserDTO = {
          username: `user_${email.split('@')[0]}`,
          password: "TestPass123!",
          typeId: 1,
          email: email,
        };

        mockBcryptHash.mockResolvedValue("hashed_password" as never);
        mockRepository.save.mockResolvedValue({} as User);

        await userService.save(userData);

        expect(mockRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            email: email,
          })
        );
      }
    });
  });
});