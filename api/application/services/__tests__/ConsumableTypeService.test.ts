import { Repository } from "typeorm";
import { ConsumableTypeService } from "../ConsumableTypeService";
import { ConsumableType } from "../../../core/entities/ConsumableType";
import { SaveConsumableTypeDTO, UpdateConsumableTypeDTO } from "../../DTOs/ConsumableDTO";

describe("ConsumableTypeService", () => {
  let consumableTypeService: ConsumableTypeService;
  let mockRepository: jest.Mocked<Repository<ConsumableType>>;

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
    consumableTypeService = new ConsumableTypeService(mockRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("save", () => {
    it("debería guardar un tipo de consumible exitosamente", async () => {
      const consumableTypeData: SaveConsumableTypeDTO = {
        name: "Granos de Café",
      };

      const savedConsumableType = {
        consumableTypeId: 1,
        name: "Granos de Café",
        consumable: {} as any,
      } as ConsumableType;

      mockRepository.save.mockResolvedValue(savedConsumableType);

      const result = await consumableTypeService.save(consumableTypeData);

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Granos de Café",
        })
      );
      expect(result).toEqual(savedConsumableType);
    });

    it("debería crear una entidad ConsumableType con los datos correctos", async () => {
      const consumableTypeData: SaveConsumableTypeDTO = {
        name: "Lácteos",
      };

      let savedEntity: any;
      mockRepository.save.mockImplementation((consumableType) => {
        savedEntity = consumableType;
        return Promise.resolve({ consumableTypeId: 1, ...consumableType } as ConsumableType);
      });

      await consumableTypeService.save(consumableTypeData);

      expect(savedEntity).toBeInstanceOf(ConsumableType);
      expect(savedEntity.name).toBe("Lácteos");
    });

    it("debería manejar diferentes nombres de tipos", async () => {
      const tiposNombres = [
        "Granos de Café",
        "Lácteos",
        "Edulcorantes",
        "Especias",
        "Suministros de Limpieza",
        "Utensilios Desechables",
      ];

      for (const nombre of tiposNombres) {
        const consumableTypeData: SaveConsumableTypeDTO = {
          name: nombre,
        };

        mockRepository.save.mockResolvedValue({} as ConsumableType);

        await consumableTypeService.save(consumableTypeData);

        expect(mockRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            name: nombre,
          })
        );
      }
    });

    it("debería manejar errores del repositorio", async () => {
      const consumableTypeData: SaveConsumableTypeDTO = {
        name: "Test Error",
      };

      const repositoryError = new Error("Error de base de datos");
      mockRepository.save.mockRejectedValue(repositoryError);

      await expect(consumableTypeService.save(consumableTypeData)).rejects.toThrow("Error de base de datos");
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it("debería manejar nombres con caracteres especiales", async () => {
      const nombresEspeciales = [
        "Café 100% Arábica",
        "Leche & Derivados",
        "Azúcar/Edulcorantes",
        "Especias - Molidas",
        "Papel (Servilletas)",
      ];

      for (const nombre of nombresEspeciales) {
        const consumableTypeData: SaveConsumableTypeDTO = {
          name: nombre,
        };

        mockRepository.save.mockResolvedValue({} as ConsumableType);

        await consumableTypeService.save(consumableTypeData);

        expect(mockRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            name: nombre,
          })
        );
      }
    });
  });

  describe("saveAll", () => {
    it("debería guardar múltiples tipos de consumibles exitosamente", async () => {
      const consumableTypesData: SaveConsumableTypeDTO[] = [
        { name: "Granos de Café" },
        { name: "Lácteos" },
        { name: "Edulcorantes" },
      ];

      const savedConsumableTypes = [
        { consumableTypeId: 1, name: "Granos de Café", consumable: {} as any },
        { consumableTypeId: 2, name: "Lácteos", consumable: {} as any },
        { consumableTypeId: 3, name: "Edulcorantes", consumable: {} as any },
      ] as ConsumableType[];

      mockRepository.save.mockResolvedValue(savedConsumableTypes as any);

      const result = await consumableTypeService.saveAll(consumableTypesData);

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: "Granos de Café" }),
          expect.objectContaining({ name: "Lácteos" }),
          expect.objectContaining({ name: "Edulcorantes" }),
        ])
      );
      expect(result).toEqual(savedConsumableTypes);
    });

    it("debería crear entidades ConsumableType para cada elemento", async () => {
      const consumableTypesData: SaveConsumableTypeDTO[] = [
        { name: "Test Type 1" },
        { name: "Test Type 2" },
      ];

      let savedEntities: any[];
      mockRepository.save.mockImplementation((consumableTypes: any) => {
        savedEntities = consumableTypes as any[];
        return Promise.resolve(consumableTypes as any);
      });

      await consumableTypeService.saveAll(consumableTypesData);

      expect(savedEntities![0]).toBeInstanceOf(ConsumableType);
      expect(savedEntities![1]).toBeInstanceOf(ConsumableType);
      expect(savedEntities![0].name).toBe("Test Type 1");
      expect(savedEntities![1].name).toBe("Test Type 2");
    });

    it("debería manejar array vacío", async () => {
      mockRepository.save.mockResolvedValue([] as any);

      const result = await consumableTypeService.saveAll([]);

      expect(mockRepository.save).toHaveBeenCalledWith([]);
      expect(result).toEqual([]);
    });

    it("debería manejar errores del repositorio", async () => {
      const consumableTypesData: SaveConsumableTypeDTO[] = [
        { name: "Error Test" },
      ];

      const repositoryError = new Error("Error de guardado masivo");
      mockRepository.save.mockRejectedValue(repositoryError);

      await expect(consumableTypeService.saveAll(consumableTypesData)).rejects.toThrow("Error de guardado masivo");
    });

    it("debería manejar gran cantidad de tipos", async () => {
      const muchosTipos: SaveConsumableTypeDTO[] = Array.from({ length: 50 }, (_, i) => ({
        name: `Tipo ${i + 1}`,
      }));

      mockRepository.save.mockResolvedValue([] as any);

      await consumableTypeService.saveAll(muchosTipos);

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.arrayContaining(
          muchosTipos.map(tipo => 
            expect.objectContaining({ name: tipo.name })
          )
        )
      );
    });
  });

  describe("delete", () => {
    it("debería eliminar un tipo de consumible exitosamente", async () => {
      const consumableTypeId = 1;
      const deleteResult = { affected: 1 };

      mockRepository.delete.mockResolvedValue(deleteResult as any);

      await consumableTypeService.delete(consumableTypeId);

      expect(mockRepository.delete).toHaveBeenCalledWith(consumableTypeId);
    });

    it("debería lanzar error cuando el tipo de consumible no existe", async () => {
      const consumableTypeId = 999;
      const deleteResult = { affected: 0 };

      mockRepository.delete.mockResolvedValue(deleteResult as any);

      await expect(consumableTypeService.delete(consumableTypeId)).rejects.toThrow(
        `Tipo de consumible con ID ${consumableTypeId} no encontrado`
      );
      expect(mockRepository.delete).toHaveBeenCalledWith(consumableTypeId);
    });

    it("debería manejar errores del repositorio", async () => {
      const consumableTypeId = 1;
      const repositoryError = new Error("Error de eliminación");

      mockRepository.delete.mockRejectedValue(repositoryError);

      await expect(consumableTypeService.delete(consumableTypeId)).rejects.toThrow("Error de eliminación");
      expect(mockRepository.delete).toHaveBeenCalledWith(consumableTypeId);
    });

    it("debería manejar diferentes IDs", async () => {
      const ids = [1, 10, 100, 999];

      for (const id of ids) {
        const deleteResult = { affected: 1 };
        mockRepository.delete.mockResolvedValue(deleteResult as any);

        await consumableTypeService.delete(id);

        expect(mockRepository.delete).toHaveBeenCalledWith(id);
      }
    });
  });

  describe("update", () => {
    it("debería actualizar un tipo de consumible exitosamente", async () => {
      const updateData: Partial<UpdateConsumableTypeDTO> = {
        consumableTypeId: 1,
        name: "Granos Premium",
      };

      const existingConsumableType = {
        consumableTypeId: 1,
        name: "Granos",
        consumable: {} as any,
      } as ConsumableType;

      const updatedConsumableType = {
        consumableTypeId: 1,
        name: "Granos Premium",
        consumable: {} as any,
      } as ConsumableType;

      mockRepository.findOne.mockResolvedValue(existingConsumableType);
      mockRepository.save.mockResolvedValue(updatedConsumableType);

      const result = await consumableTypeService.update(updateData);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { consumableTypeId: 1 },
      });
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          consumableTypeId: 1,
          name: "Granos Premium",
        })
      );
      expect(result).toEqual(updatedConsumableType);
    });

    it("debería actualizar solo cuando name es proporcionado", async () => {
      const updateData: Partial<UpdateConsumableTypeDTO> = {
        consumableTypeId: 1,
        name: "Nuevo Nombre",
      };

      const existingConsumableType = {
        consumableTypeId: 1,
        name: "Nombre Original",
        consumable: {} as any,
      } as ConsumableType;

      mockRepository.findOne.mockResolvedValue(existingConsumableType);
      mockRepository.save.mockResolvedValue(existingConsumableType);

      await consumableTypeService.update(updateData);

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Nuevo Nombre",
        })
      );
    });

    it("debería mantener el nombre original cuando name es undefined", async () => {
      const updateData: Partial<UpdateConsumableTypeDTO> = {
        consumableTypeId: 1,
        // name no incluido
      };

      const existingConsumableType = {
        consumableTypeId: 1,
        name: "Nombre Original",
        consumable: {} as any,
      } as ConsumableType;

      mockRepository.findOne.mockResolvedValue(existingConsumableType);
      mockRepository.save.mockResolvedValue(existingConsumableType);

      await consumableTypeService.update(updateData);

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Nombre Original", // No cambió
        })
      );
    });

    it("debería lanzar error cuando el tipo de consumible no existe", async () => {
      const updateData: Partial<UpdateConsumableTypeDTO> = {
        consumableTypeId: 999,
        name: "No Existe",
      };

      mockRepository.findOne.mockResolvedValue(null);

      await expect(consumableTypeService.update(updateData)).rejects.toThrow(
        "Tipo de consumible con ID 999 no encontrado"
      );
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { consumableTypeId: 999 },
      });
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it("debería manejar errores del repositorio en findOne", async () => {
      const updateData: Partial<UpdateConsumableTypeDTO> = {
        consumableTypeId: 1,
        name: "Error Test",
      };

      const repositoryError = new Error("Error de consulta");
      mockRepository.findOne.mockRejectedValue(repositoryError);

      await expect(consumableTypeService.update(updateData)).rejects.toThrow("Error de consulta");
    });

    it("debería manejar errores del repositorio en save", async () => {
      const updateData: Partial<UpdateConsumableTypeDTO> = {
        consumableTypeId: 1,
        name: "Error Save",
      };

      const existingConsumableType = {
        consumableTypeId: 1,
        name: "Original",
        consumable: {} as any,
      } as ConsumableType;

      const saveError = new Error("Error de guardado");

      mockRepository.findOne.mockResolvedValue(existingConsumableType);
      mockRepository.save.mockRejectedValue(saveError);

      await expect(consumableTypeService.update(updateData)).rejects.toThrow("Error de guardado");
    });

    it("debería manejar actualizaciones con nombres especiales", async () => {
      const nombresEspeciales = [
        "Café 100% Premium",
        "Lácteos & Sustitutos",
        "Azúcar/Miel/Stevia",
        "Especias - Orgánicas",
      ];

      const existingConsumableType = {
        consumableTypeId: 1,
        name: "Original",
        consumable: {} as any,
      } as ConsumableType;

      for (const nombre of nombresEspeciales) {
        const updateData: Partial<UpdateConsumableTypeDTO> = {
          consumableTypeId: 1,
          name: nombre,
        };

        mockRepository.findOne.mockResolvedValue(existingConsumableType);
        mockRepository.save.mockResolvedValue({} as ConsumableType);

        await consumableTypeService.update(updateData);

        expect(mockRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            name: nombre,
          })
        );
      }
    });
  });

  describe("getAll", () => {
    it("debería obtener todos los tipos de consumibles", async () => {
      const mockConsumableTypes = [
        { consumableTypeId: 1, name: "Granos de Café", consumable: {} as any },
        { consumableTypeId: 2, name: "Lácteos", consumable: {} as any },
        { consumableTypeId: 3, name: "Edulcorantes", consumable: {} as any },
      ] as ConsumableType[];

      mockRepository.find.mockResolvedValue(mockConsumableTypes);

      const result = await consumableTypeService.getAll();

      expect(mockRepository.find).toHaveBeenCalledWith();
      expect(result).toEqual(mockConsumableTypes);
      expect(result).toHaveLength(3);
    });

    it("debería retornar array vacío cuando no hay tipos", async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await consumableTypeService.getAll();

      expect(result).toEqual([]);
    });

    it("debería manejar errores del repositorio", async () => {
      const repositoryError = new Error("Error de conexión");
      mockRepository.find.mockRejectedValue(repositoryError);

      await expect(consumableTypeService.getAll()).rejects.toThrow("Error de conexión");
      expect(mockRepository.find).toHaveBeenCalled();
    });

    it("debería obtener tipos con diferentes estructuras de datos", async () => {
      const mockConsumableTypes = [
        { consumableTypeId: 1, name: "Tipo Común", consumable: {} as any },
        { consumableTypeId: 2, name: "", consumable: {} as any }, // Nombre vacío
        { consumableTypeId: 3, name: "Tipo con Nombre Muy Largo y Detallado", consumable: {} as any },
      ] as ConsumableType[];

      mockRepository.find.mockResolvedValue(mockConsumableTypes);

      const result = await consumableTypeService.getAll();

      expect(result).toEqual(mockConsumableTypes);
      expect(result[0].name).toBe("Tipo Común");
      expect(result[1].name).toBe("");
      expect(result[2].name).toBe("Tipo con Nombre Muy Largo y Detallado");
    });
  });

  describe("getById", () => {
    it("debería obtener un tipo de consumible por ID", async () => {
      const consumableTypeId = 1;
      const mockConsumableType = {
        consumableTypeId: 1,
        name: "Granos Especiales",
        consumable: {} as any,
      } as ConsumableType;

      mockRepository.findOne.mockResolvedValue(mockConsumableType);

      const result = await consumableTypeService.getById(consumableTypeId);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { consumableTypeId: 1 },
      });
      expect(result).toEqual(mockConsumableType);
    });

    it("debería retornar null cuando el tipo no existe", async () => {
      const consumableTypeId = 999;
      mockRepository.findOne.mockResolvedValue(null);

      const result = await consumableTypeService.getById(consumableTypeId);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { consumableTypeId: 999 },
      });
      expect(result).toBeNull();
    });

    it("debería manejar errores del repositorio", async () => {
      const consumableTypeId = 1;
      const repositoryError = new Error("Error de consulta");
      mockRepository.findOne.mockRejectedValue(repositoryError);

      await expect(consumableTypeService.getById(consumableTypeId)).rejects.toThrow("Error de consulta");
      expect(mockRepository.findOne).toHaveBeenCalled();
    });

    it("debería manejar diferentes IDs", async () => {
      const ids = [1, 10, 100, 999];

      for (const id of ids) {
        const mockConsumableType = {
          consumableTypeId: id,
          name: `Tipo ${id}`,
          consumable: {} as any,
        } as ConsumableType;

        mockRepository.findOne.mockResolvedValue(mockConsumableType);

        const result = await consumableTypeService.getById(id);

        expect(result?.consumableTypeId).toBe(id);
        expect(mockRepository.findOne).toHaveBeenCalledWith({
          where: { consumableTypeId: id },
        });
      }
    });
  });

  describe("Casos de integración", () => {
    it("debería manejar flujo completo de CRUD", async () => {
      const consumableTypeData: SaveConsumableTypeDTO = {
        name: "Tipo Integración",
      };

      const savedConsumableType = {
        consumableTypeId: 1,
        name: "Tipo Integración",
        consumable: {} as any,
      } as ConsumableType;

      const updateData: Partial<UpdateConsumableTypeDTO> = {
        consumableTypeId: 1,
        name: "Tipo Actualizado",
      };

      const updatedConsumableType = {
        ...savedConsumableType,
        name: "Tipo Actualizado",
      } as ConsumableType;

      // 1. Guardar
      mockRepository.save.mockResolvedValueOnce(savedConsumableType);
      const saveResult = await consumableTypeService.save(consumableTypeData);
      expect(saveResult).toEqual(savedConsumableType);

      // 2. Obtener por ID
      mockRepository.findOne.mockResolvedValueOnce(savedConsumableType);
      const getResult = await consumableTypeService.getById(1);
      expect(getResult).toEqual(savedConsumableType);

      // 3. Actualizar
      mockRepository.findOne.mockResolvedValueOnce(savedConsumableType);
      mockRepository.save.mockResolvedValueOnce(updatedConsumableType);
      const updateResult = await consumableTypeService.update(updateData);
      expect(updateResult).toEqual(updatedConsumableType);

      // 4. Obtener todos
      mockRepository.find.mockResolvedValueOnce([updatedConsumableType]);
      const getAllResult = await consumableTypeService.getAll();
      expect(getAllResult).toContain(updatedConsumableType);

      // 5. Eliminar
      mockRepository.delete.mockResolvedValueOnce({ affected: 1 } as any);
      await expect(consumableTypeService.delete(1)).resolves.not.toThrow();
    });

    it("debería manejar gestión de múltiples tipos", async () => {
      const tiposData: SaveConsumableTypeDTO[] = [
        { name: "Granos de Café" },
        { name: "Lácteos" },
        { name: "Edulcorantes" },
        { name: "Especias" },
        { name: "Suministros" },
      ];

      const tiposGuardados = tiposData.map((data, index) => ({
        consumableTypeId: index + 1,
        name: data.name,
        consumable: {} as any,
      })) as ConsumableType[];

      // Guardar múltiples tipos
      mockRepository.save.mockResolvedValueOnce(tiposGuardados as any);
      const saveAllResult = await consumableTypeService.saveAll(tiposData);
      expect(saveAllResult).toHaveLength(5);

      // Obtener todos los tipos
      mockRepository.find.mockResolvedValueOnce(tiposGuardados);
      const getAllResult = await consumableTypeService.getAll();
      expect(getAllResult).toHaveLength(5);
      expect(getAllResult.map(t => t.name)).toEqual([
        "Granos de Café",
        "Lácteos", 
        "Edulcorantes",
        "Especias",
        "Suministros",
      ]);
    });

    it("debería manejar búsqueda y actualización específicas", async () => {
      const tipos = [
        { id: 1, nombre: "Café Arábica" },
        { id: 2, nombre: "Café Robusta" },
        { id: 3, nombre: "Descafeinado" },
      ];

      for (const tipo of tipos) {
        // Buscar tipo específico
        const mockTipo = {
          consumableTypeId: tipo.id,
          name: tipo.nombre,
          consumable: {} as any,
        } as ConsumableType;

        mockRepository.findOne.mockResolvedValueOnce(mockTipo);
        const getResult = await consumableTypeService.getById(tipo.id);
        expect(getResult?.name).toBe(tipo.nombre);

        // Actualizar tipo específico
        const updateData = {
          consumableTypeId: tipo.id,
          name: `${tipo.nombre} Premium`,
        };

        mockRepository.findOne.mockResolvedValueOnce(mockTipo);
        mockRepository.save.mockResolvedValueOnce({
          ...mockTipo,
          name: `${tipo.nombre} Premium`,
        });

        const updateResult = await consumableTypeService.update(updateData);
        expect(updateResult.name).toBe(`${tipo.nombre} Premium`);
      }
    });
  });

  describe("Validaciones de datos", () => {
    it("debería manejar nombres de diferentes longitudes", async () => {
      const nombresLongitudes = [
        "A", // Muy corto
        "Tipo Normal",
        "Tipo de Consumible con Nombre Extremadamente Largo y Detallado para Pruebas",
        "Café",
        "Especias y Condimentos Diversos",
      ];

      for (const nombre of nombresLongitudes) {
        const consumableTypeData: SaveConsumableTypeDTO = {
          name: nombre,
        };

        mockRepository.save.mockResolvedValue({} as ConsumableType);

        await consumableTypeService.save(consumableTypeData);

        expect(mockRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            name: nombre,
          })
        );
      }
    });

    it("debería manejar nombres con diferentes codificaciones", async () => {
      const nombresEspeciales = [
        "Café", // Acentos
        "Azúcar", // Tilde
        "Niño", // Ñ
        "Café™", // Símbolos
        "Tipo № 1", // Número especial
        "50% Descafeinado", // Porcentajes
      ];

      for (const nombre of nombresEspeciales) {
        const consumableTypeData: SaveConsumableTypeDTO = {
          name: nombre,
        };

        mockRepository.save.mockResolvedValue({} as ConsumableType);

        await consumableTypeService.save(consumableTypeData);

        expect(mockRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            name: nombre,
          })
        );
      }
    });

    it("debería manejar IDs extremos", async () => {
      const idsExtremos = [1, 999, 1000, 9999, 99999];

      for (const id of idsExtremos) {
        mockRepository.findOne.mockResolvedValue({
          consumableTypeId: id,
          name: `Tipo ${id}`,
          consumable: {} as any,
        } as ConsumableType);

        const result = await consumableTypeService.getById(id);

        expect(result?.consumableTypeId).toBe(id);
      }
    });

    it("debería manejar nombres vacíos y espacios", async () => {
      const nombresEspeciales = [
        "", // Vacío
        " ", // Solo espacio
        "  ", // Múltiples espacios
        " Tipo con espacios ", // Espacios al inicio y final
        "Tipo\tcon\ttabs", // Tabs
        "Tipo\ncon\nsaltos", // Saltos de línea
      ];

      for (const nombre of nombresEspeciales) {
        const consumableTypeData: SaveConsumableTypeDTO = {
          name: nombre,
        };

        mockRepository.save.mockResolvedValue({} as ConsumableType);

        await consumableTypeService.save(consumableTypeData);

        expect(mockRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            name: nombre,
          })
        );
      }
    });

    it("debería manejar actualizaciones con nombre vacío", async () => {
      const existingConsumableType = {
        consumableTypeId: 1,
        name: "Tipo Original",
        consumable: {} as any,
      } as ConsumableType;

      const updateData = { consumableTypeId: 1, name: "" };

      mockRepository.findOne.mockResolvedValue(existingConsumableType);
      mockRepository.save.mockResolvedValue({} as ConsumableType);

      await consumableTypeService.update(updateData);

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "",
        })
      );
    });

    it("debería manejar actualizaciones con un solo carácter", async () => {
      const existingConsumableType = {
        consumableTypeId: 1,
        name: "Tipo Original",
        consumable: {} as any,
      } as ConsumableType;

      const updateData = { consumableTypeId: 1, name: "A" };

      mockRepository.findOne.mockResolvedValue(existingConsumableType);
      mockRepository.save.mockResolvedValue({} as ConsumableType);

      await consumableTypeService.update(updateData);

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "A",
        })
      );
    });

    it("debería mantener nombre original cuando no se proporciona name", async () => {
      const existingConsumableType = {
        consumableTypeId: 1,
        name: "Tipo Original",
        consumable: {} as any,
      } as ConsumableType;

      const updateData = { consumableTypeId: 1 }; // Solo ID, sin name

      mockRepository.findOne.mockResolvedValue(existingConsumableType);
      mockRepository.save.mockResolvedValue({} as ConsumableType);

      await consumableTypeService.update(updateData);

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Tipo Original",
        })
      );
    });
  });
});