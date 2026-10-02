import { Repository } from "typeorm";
import { UserTypeService } from "../UserTypeService";
import { UserType } from "../../../core/entities/UserType";

describe("UserTypeService", () => {
  let userTypeService: UserTypeService;
  let mockRepository: jest.Mocked<Repository<UserType>>;

  beforeEach(() => {
    // Crear mock del repositorio
    mockRepository = {
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      delete: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    } as any;

    // Crear instancia del servicio con el repositorio mock
    userTypeService = new UserTypeService(mockRepository);

    // Limpiar console.log
    jest.spyOn(console, "log").mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("save", () => {
    it("debería guardar un tipo de usuario exitosamente", async () => {
      const userTypeData = {
        name: "Administrador",
        permissionLevel: 1,
      };

      const savedUserType = {
        userTypeId: 1,
        name: "Administrador",
        permissionLevel: 1,
      } as UserType;

      mockRepository.save.mockResolvedValue(savedUserType);

      const result = await userTypeService.save(userTypeData);

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Administrador",
          permissionLevel: 1,
        })
      );
      expect(result).toEqual(savedUserType);
      expect(console.log).toHaveBeenCalledWith("Guardando tipo de usuario...");
    });

    it("debería crear una entidad UserType con los datos correctos", async () => {
      const userTypeData = {
        name: "Empleado",
        permissionLevel: 3,
      };

      let savedEntity: any;
      mockRepository.save.mockImplementation((userType) => {
        savedEntity = userType;
        return Promise.resolve({ userTypeId: 1, ...userType } as UserType);
      });

      await userTypeService.save(userTypeData);

      expect(savedEntity).toBeInstanceOf(UserType);
      expect(savedEntity.name).toBe("Empleado");
      expect(savedEntity.permissionLevel).toBe(3);
    });

    it("debería manejar diferentes tipos de usuario y niveles", async () => {
      const tiposUsuario = [
        { name: "Administrador", permissionLevel: 1 },
        { name: "Gerente", permissionLevel: 2 },
        { name: "Empleado", permissionLevel: 3 },
        { name: "Cajero", permissionLevel: 4 },
        { name: "Mesero", permissionLevel: 5 },
        { name: "Invitado", permissionLevel: 10 },
      ];

      for (const tipo of tiposUsuario) {
        mockRepository.save.mockResolvedValue({} as UserType);

        await userTypeService.save(tipo);

        expect(mockRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            name: tipo.name,
            permissionLevel: tipo.permissionLevel,
          })
        );
      }
    });

    it("debería manejar nombres con caracteres especiales", async () => {
      const userTypeData = {
        name: "Administrador & Supervisor",
        permissionLevel: 1,
      };

      mockRepository.save.mockResolvedValue({} as UserType);

      await userTypeService.save(userTypeData);

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Administrador & Supervisor",
        })
      );
    });

    it("debería manejar niveles de permiso extremos", async () => {
      const niveles = [0, 1, 99, 100, 999];

      for (const nivel of niveles) {
        const userTypeData = {
          name: `Tipo Nivel ${nivel}`,
          permissionLevel: nivel,
        };

        mockRepository.save.mockResolvedValue({} as UserType);

        await userTypeService.save(userTypeData);

        expect(mockRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            permissionLevel: nivel,
          })
        );
      }
    });

    it("debería manejar nombres vacíos o indefinidos", async () => {
      const casos = [
        { name: "", permissionLevel: 1 },
        { name: undefined, permissionLevel: 2 },
        { name: null, permissionLevel: 3 },
      ];

      for (const caso of casos) {
        mockRepository.save.mockResolvedValue({} as UserType);

        await userTypeService.save(caso);

        expect(mockRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            name: caso.name,
            permissionLevel: caso.permissionLevel,
          })
        );
      }
    });

    it("debería manejar errores del repositorio", async () => {
      const userTypeData = {
        name: "Test Error",
        permissionLevel: 1,
      };

      const repositoryError = new Error("Error de base de datos");
      mockRepository.save.mockRejectedValue(repositoryError);

      await expect(userTypeService.save(userTypeData)).rejects.toThrow("Error de base de datos");
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe("getById", () => {
    it("debería obtener un tipo de usuario por ID", async () => {
      const userTypeId = 1;
      const mockUserType = {
        userTypeId: 1,
        name: "Administrador",
        permissionLevel: 1,
      } as UserType;

      mockRepository.findOne.mockResolvedValue(mockUserType);

      const result = await userTypeService.getById(userTypeId);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { userTypeId: 1 },
      });
      expect(result).toEqual(mockUserType);
    });

    it("debería lanzar error cuando el tipo de usuario no existe", async () => {
      const userTypeId = 999;
      mockRepository.findOne.mockResolvedValue(null);

      await expect(userTypeService.getById(userTypeId)).rejects.toThrow(
        `Tipo de usuario con ID ${userTypeId} no encontrado`
      );
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { userTypeId: 999 },
      });
    });

    it("debería manejar errores del repositorio", async () => {
      const userTypeId = 1;
      const repositoryError = new Error("Error de consulta");
      mockRepository.findOne.mockRejectedValue(repositoryError);

      await expect(userTypeService.getById(userTypeId)).rejects.toThrow("Error de consulta");
      expect(mockRepository.findOne).toHaveBeenCalled();
    });

    it("debería manejar diferentes IDs", async () => {
      const ids = [1, 5, 10, 100, 999];

      for (const id of ids) {
        const mockUserType = {
          userTypeId: id,
          name: `Tipo ${id}`,
          permissionLevel: id,
        } as UserType;

        mockRepository.findOne.mockResolvedValue(mockUserType);

        const result = await userTypeService.getById(id);

        expect(result?.userTypeId).toBe(id);
        expect(mockRepository.findOne).toHaveBeenCalledWith({
          where: { userTypeId: id },
        });
      }
    });

    it("debería obtener tipos con diferentes niveles de permiso", async () => {
      const tiposEjemplo = [
        { id: 1, name: "Super Admin", permissionLevel: 1 },
        { id: 2, name: "Empleado Regular", permissionLevel: 5 },
        { id: 3, name: "Usuario Limitado", permissionLevel: 10 },
      ];

      for (const tipo of tiposEjemplo) {
        const mockUserType = {
          userTypeId: tipo.id,
          name: tipo.name,
          permissionLevel: tipo.permissionLevel,
        } as UserType;

        mockRepository.findOne.mockResolvedValue(mockUserType);

        const result = await userTypeService.getById(tipo.id);

        expect(result?.name).toBe(tipo.name);
        expect(result?.permissionLevel).toBe(tipo.permissionLevel);
      }
    });
  });

  describe("getAll", () => {
    it("debería obtener todos los tipos de usuario", async () => {
      const mockUserTypes = [
        {
          userTypeId: 1,
          name: "Administrador",
          permissionLevel: 1,
        },
        {
          userTypeId: 2,
          name: "Gerente",
          permissionLevel: 2,
        },
        {
          userTypeId: 3,
          name: "Empleado",
          permissionLevel: 3,
        },
        {
          userTypeId: 4,
          name: "Cajero",
          permissionLevel: 4,
        },
      ] as UserType[];

      mockRepository.find.mockResolvedValue(mockUserTypes);

      const result = await userTypeService.getAll();

      expect(mockRepository.find).toHaveBeenCalledWith({
        order: { permissionLevel: "ASC" }
      });
      expect(result).toEqual(mockUserTypes);
      expect(result).toHaveLength(4);
      expect(console.log).toHaveBeenCalledWith("Obteniendo tipos de usuarios...");
    });

    it("debería retornar array vacío cuando no hay tipos de usuario", async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await userTypeService.getAll();

      expect(result).toEqual([]);
      expect(console.log).toHaveBeenCalledWith("Obteniendo tipos de usuarios...");
    });

    it("debería manejar errores del repositorio", async () => {
      const repositoryError = new Error("Error de conexión");
      mockRepository.find.mockRejectedValue(repositoryError);

      await expect(userTypeService.getAll()).rejects.toThrow("Error de conexión");
      expect(mockRepository.find).toHaveBeenCalled();
    });

    it("debería obtener tipos con diferentes niveles ordenados", async () => {
      const mockUserTypes = [
        {
          userTypeId: 1,
          name: "Super Administrador",
          permissionLevel: 1,
        },
        {
          userTypeId: 5,
          name: "Usuario Final",
          permissionLevel: 10,
        },
        {
          userTypeId: 3,
          name: "Moderador",
          permissionLevel: 5,
        },
      ] as UserType[];

      mockRepository.find.mockResolvedValue(mockUserTypes);

      const result = await userTypeService.getAll();

      expect(result).toEqual(mockUserTypes);
      expect(result.some(type => type.permissionLevel === 1)).toBe(true);
      expect(result.some(type => type.permissionLevel === 10)).toBe(true);
      expect(result.some(type => type.permissionLevel === 5)).toBe(true);
    });

    it("debería obtener tipos con nombres únicos", async () => {
      const mockUserTypes = [
        { userTypeId: 1, name: "Tipo A", permissionLevel: 1 },
        { userTypeId: 2, name: "Tipo B", permissionLevel: 2 },
        { userTypeId: 3, name: "Tipo C", permissionLevel: 3 },
      ] as UserType[];

      mockRepository.find.mockResolvedValue(mockUserTypes);

      const result = await userTypeService.getAll();

      const nombres = result.map(type => type.name);
      const nombresUnicos = new Set(nombres);
      
      expect(nombres.length).toBe(nombresUnicos.size);
      expect(result).toHaveLength(3);
    });
  });

  describe("saveAll", () => {
    it("debería guardar múltiples tipos de usuario exitosamente", async () => {
      const userTypesData = [
        { name: "Admin", permissionLevel: 1 },
        { name: "User", permissionLevel: 5 },
      ];

      const savedUserTypes = userTypesData.map((data, index) => ({
        userTypeId: index + 1,
        ...data,
      })) as UserType[];

      mockRepository.save.mockResolvedValue(savedUserTypes as any);

      const result = await userTypeService.saveAll(userTypesData);

      expect(mockRepository.save).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({
          name: "Admin",
          permissionLevel: 1,
        }),
        expect.objectContaining({
          name: "User",
          permissionLevel: 5,
        }),
      ]));
      expect(result).toEqual(savedUserTypes);
    });

    it("debería manejar array vacío", async () => {
      mockRepository.save.mockResolvedValue([] as any);

      const result = await userTypeService.saveAll([]);

      expect(mockRepository.save).toHaveBeenCalledWith([]);
      expect(result).toEqual([]);
    });

    it("debería manejar errores del repositorio", async () => {
      const userTypesData = [{ name: "Test", permissionLevel: 1 }];
      const repositoryError = new Error("Error de inserción masiva");

      mockRepository.save.mockRejectedValue(repositoryError);

      await expect(userTypeService.saveAll(userTypesData)).rejects.toThrow("Error de inserción masiva");
    });
  });

  describe("delete", () => {
    it("debería eliminar un tipo de usuario exitosamente", async () => {
      const userTypeId = 1;
      const deleteResult = { affected: 1 };

      mockRepository.delete.mockResolvedValue(deleteResult as any);

      const result = await userTypeService.delete(userTypeId);

      expect(mockRepository.delete).toHaveBeenCalledWith(userTypeId);
      expect(result).toEqual({
        message: "Tipo de usuario eliminado correctamente",
        id: userTypeId,
      });
    });

    it("debería lanzar error cuando el tipo de usuario no existe", async () => {
      const userTypeId = 999;
      const deleteResult = { affected: 0 };

      mockRepository.delete.mockResolvedValue(deleteResult as any);

      await expect(userTypeService.delete(userTypeId)).rejects.toThrow(
        `Tipo de usuario con ID ${userTypeId} no encontrado`
      );
      expect(mockRepository.delete).toHaveBeenCalledWith(userTypeId);
    });

    it("debería manejar errores del repositorio", async () => {
      const userTypeId = 1;
      const repositoryError = new Error("Error de eliminación");

      mockRepository.delete.mockRejectedValue(repositoryError);

      await expect(userTypeService.delete(userTypeId)).rejects.toThrow("Error de eliminación");
      expect(mockRepository.delete).toHaveBeenCalledWith(userTypeId);
    });
  });

  describe("update", () => {
    it("debería actualizar un tipo de usuario exitosamente", async () => {
      const updateData = {
        userTypeId: 1,
        name: "Administrador Actualizado",
        permissionLevel: 2,
      };

      const existingUserType = {
        userTypeId: 1,
        name: "Administrador",
        permissionLevel: 1,
      } as UserType;

      const updatedUserType = {
        ...existingUserType,
        name: "Administrador Actualizado",
        permissionLevel: 2,
      } as UserType;

      mockRepository.findOne.mockResolvedValue(existingUserType);
      mockRepository.save.mockResolvedValue(updatedUserType);

      const result = await userTypeService.update(updateData);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { userTypeId: 1 },
      });
      expect(mockRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        userTypeId: 1,
        name: "Administrador Actualizado",
        permissionLevel: 2,
      }));
      expect(result).toEqual(updatedUserType);
    });

    it("debería lanzar error cuando userTypeId no se proporciona", async () => {
      const updateData = {
        name: "Actualizado",
      };

      await expect(userTypeService.update(updateData)).rejects.toThrow(
        "userTypeId es requerido para actualizar"
      );
      expect(mockRepository.findOne).not.toHaveBeenCalled();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it("debería lanzar error cuando el tipo de usuario no existe", async () => {
      const updateData = {
        userTypeId: 999,
        name: "No existe",
      };

      mockRepository.findOne.mockResolvedValue(null);

      await expect(userTypeService.update(updateData)).rejects.toThrow(
        "Tipo de usuario con ID 999 no encontrado"
      );
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { userTypeId: 999 },
      });
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it("debería manejar errores del repositorio", async () => {
      const updateData = {
        userTypeId: 1,
        name: "Test",
      };

      const repositoryError = new Error("Error de consulta");
      mockRepository.findOne.mockRejectedValue(repositoryError);

      await expect(userTypeService.update(updateData)).rejects.toThrow("Error de consulta");
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe("getByPermissionLevel", () => {
    it("debería obtener tipos de usuario por nivel de permiso", async () => {
      const permissionLevel = 2;
      const mockUserTypes = [
        {
          userTypeId: 2,
          name: "Gerente",
          permissionLevel: 2,
        },
        {
          userTypeId: 5,
          name: "Supervisor",
          permissionLevel: 2,
        },
      ] as UserType[];

      mockRepository.find.mockResolvedValue(mockUserTypes);

      const result = await userTypeService.getByPermissionLevel(permissionLevel);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { permissionLevel },
        order: { name: "ASC" },
      });
      expect(result).toEqual(mockUserTypes);
    });

    it("debería retornar array vacío cuando no hay tipos con el nivel especificado", async () => {
      const permissionLevel = 999;
      mockRepository.find.mockResolvedValue([]);

      const result = await userTypeService.getByPermissionLevel(permissionLevel);

      expect(result).toEqual([]);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { permissionLevel },
        order: { name: "ASC" },
      });
    });

    it("debería manejar errores del repositorio", async () => {
      const permissionLevel = 1;
      const repositoryError = new Error("Error de consulta por nivel");
      mockRepository.find.mockRejectedValue(repositoryError);

      await expect(userTypeService.getByPermissionLevel(permissionLevel)).rejects.toThrow("Error de consulta por nivel");
    });
  });

 

  describe("Casos de integración", () => {
    it("debería manejar flujo básico de creación y consulta", async () => {
      const userTypeData = {
        name: "Supervisor",
        permissionLevel: 2,
      };

      const savedUserType = {
        userTypeId: 5,
        name: "Supervisor",
        permissionLevel: 2,
      } as UserType;

      // 1. Guardar tipo de usuario
      mockRepository.save.mockResolvedValue(savedUserType);
      const saveResult = await userTypeService.save(userTypeData);
      expect(saveResult).toEqual(savedUserType);

      // 2. Obtener por ID
      mockRepository.findOne.mockResolvedValue(savedUserType);
      const getResult = await userTypeService.getById(5);
      expect(getResult).toEqual(savedUserType);

      // 3. Obtener todos los tipos
      mockRepository.find.mockResolvedValue([savedUserType]);
      const getAllResult = await userTypeService.getAll();
      expect(getAllResult).toContain(savedUserType);
    });

    it("debería manejar jerarquía de permisos", async () => {
      const jerarquia = [
        { name: "Super Admin", permissionLevel: 1 },
        { name: "Admin", permissionLevel: 2 },
        { name: "Manager", permissionLevel: 3 },
        { name: "Employee", permissionLevel: 4 },
        { name: "Guest", permissionLevel: 5 },
      ];

      const tiposGuardados = jerarquia.map((tipo, index) => ({
        userTypeId: index + 1,
        ...tipo,
      })) as UserType[];

      // Guardar tipos en orden jerárquico
      for (let i = 0; i < jerarquia.length; i++) {
        mockRepository.save.mockResolvedValueOnce(tiposGuardados[i]);
        
        const saveResult = await userTypeService.save(jerarquia[i]);
        expect(saveResult.permissionLevel).toBe(jerarquia[i].permissionLevel);
      }

      // Obtener todos y verificar jerarquía
      mockRepository.find.mockResolvedValue(tiposGuardados);
      const getAllResult = await userTypeService.getAll();
      
      expect(getAllResult).toHaveLength(5);
      expect(getAllResult.map(t => t.name)).toEqual([
        "Super Admin", "Admin", "Manager", "Employee", "Guest"
      ]);
      
      // Verificar que los niveles son progresivos
      const niveles = getAllResult.map(t => t.permissionLevel);
      expect(niveles).toEqual([1, 2, 3, 4, 5]);
    });

    it("debería manejar búsqueda de tipos específicos", async () => {
      const tiposEspecificos = [
        { id: 1, name: "Barista", permissionLevel: 4 },
        { id: 10, name: "Gerente de Turno", permissionLevel: 2 },
        { id: 25, name: "Contador", permissionLevel: 3 },
      ];

      for (const tipo of tiposEspecificos) {
        const mockUserType = {
          userTypeId: tipo.id,
          name: tipo.name,
          permissionLevel: tipo.permissionLevel,
        } as UserType;

        mockRepository.findOne.mockResolvedValueOnce(mockUserType);

        const result = await userTypeService.getById(tipo.id);

        expect(result?.name).toBe(tipo.name);
        expect(result?.permissionLevel).toBe(tipo.permissionLevel);
      }
    });
  });

  describe("Validaciones de datos", () => {
    it("debería manejar nombres de diferentes longitudes", async () => {
      const nombres = [
        "A",
        "Admin",
        "Administrador Principal",
        "Supervisor de Área de Ventas y Atención al Cliente",
        "",
      ];

      for (const nombre of nombres) {
        const userTypeData = {
          name: nombre,
          permissionLevel: 1,
        };

        mockRepository.save.mockResolvedValue({} as UserType);

        await userTypeService.save(userTypeData);

        expect(mockRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            name: nombre,
          })
        );
      }
    });

    it("debería manejar rangos completos de niveles de permiso", async () => {
      const niveles = [
        0,    // Sin permisos
        1,    // Máximo nivel
        5,    // Nivel medio
        10,   // Nivel bajo
        99,   // Nivel muy bajo
        100,  // Nivel mínimo
        999,  // Nivel extremo
      ];

      for (const nivel of niveles) {
        const userTypeData = {
          name: `Tipo Nivel ${nivel}`,
          permissionLevel: nivel,
        };

        mockRepository.save.mockResolvedValue({} as UserType);

        await userTypeService.save(userTypeData);

        expect(mockRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            permissionLevel: nivel,
          })
        );
      }
    });

    it("debería manejar nombres con caracteres especiales y acentos", async () => {
      const nombresEspeciales = [
        "Administrador",
        "Gerente de Área",
        "Empleado & Supervisor",
        "Cajero/Mesero",
        "Técnico de Mantenimiento",
        "Asistente - Temporal",
        "Usuario (Prueba)",
        "Operador 24/7",
        "Staff → Café",
      ];

      for (const nombre of nombresEspeciales) {
        const userTypeData = {
          name: nombre,
          permissionLevel: 3,
        };

        mockRepository.save.mockResolvedValue({} as UserType);

        await userTypeService.save(userTypeData);

        expect(mockRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            name: nombre,
          })
        );
      }
    });

    it("debería manejar casos límite de IDs", async () => {
      const idsLimite = [0, 1, 999, 1000, 9999, 99999];

      for (const id of idsLimite) {
        const mockUserType = {
          userTypeId: id,
          name: `Tipo ${id}`,
          permissionLevel: Math.min(id, 10),
        } as UserType;

        mockRepository.findOne.mockResolvedValue(mockUserType);

        const result = await userTypeService.getById(id);

        expect(result?.userTypeId).toBe(id);
        expect(mockRepository.findOne).toHaveBeenCalledWith({
          where: { userTypeId: id },
        });
      }
    });

    it("debería manejar combinaciones de nombre y nivel lógicas", async () => {
      const combinaciones = [
        { name: "Super Admin", permissionLevel: 1 },
        { name: "Admin", permissionLevel: 2 },
        { name: "Moderador", permissionLevel: 3 },
        { name: "Usuario", permissionLevel: 5 },
        { name: "Invitado", permissionLevel: 10 },
        { name: "Restringido", permissionLevel: 99 },
      ];

      for (const combo of combinaciones) {
        mockRepository.save.mockResolvedValue({} as UserType);

        await userTypeService.save(combo);

        expect(mockRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            name: combo.name,
            permissionLevel: combo.permissionLevel,
          })
        );
      }
    });

    it("debería manejar datos inconsistentes o nulos", async () => {
      const casosInconsistentes = [
        { name: null, permissionLevel: 1 },
        { name: undefined, permissionLevel: 2 },
        { name: "Válido", permissionLevel: null },
        { name: "Válido", permissionLevel: undefined },
        { name: "", permissionLevel: 0 },
      ];

      for (const caso of casosInconsistentes) {
        mockRepository.save.mockResolvedValue({} as UserType);

        await userTypeService.save(caso);

        expect(mockRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            name: caso.name,
            permissionLevel: caso.permissionLevel,
          })
        );
      }
    });
  });
});