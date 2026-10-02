import { Role } from "../../../core/enums/Role";
import { UnitMeasurement as U } from "../../../core/enums/UnitMeasurement";

/** Catálogo de la cafetería simulada. Los costos son por unidad de medida. */

export const SUPPLIERS = [
  { key: "cafe", name: "Café de Altura", phone: "22501100", email: "ventas@cafedealtura.sv" },
  { key: "lacteos", name: "Lácteos La Pradera", phone: "22604455", email: "pedidos@lapradera.sv" },
  { key: "pan", name: "Panadería San Miguel", phone: "26617788", email: "mayoreo@sanmiguel.sv" },
  { key: "dulces", name: "Dulces del Valle", phone: "+50377128899", email: "ventas@dulcesdelvalle.sv" },
  { key: "frutas", name: "Frutas Frescas SV", phone: "22983311", email: "hola@frutasfrescas.sv" },
  { key: "empaques", name: "Empaques Centroamérica", phone: "22145566", email: "info@empaquesca.sv" },
] as const;

/** Proveedor que se dejó de usar: aparece inactivo, sin consumibles. */
export const INACTIVE_SUPPLIER = {
  name: "Distribuidora Antigua",
  phone: "24401234",
  email: "contacto@antigua.sv",
};

export const CONSUMABLE_TYPES = [
  "Café y té",
  "Lácteos y embutidos",
  "Panadería",
  "Endulzantes y jarabes",
  "Frutas",
  "Insumos y empaques",
] as const;

type ConsumableDef = {
  key: string;
  name: string;
  type: (typeof CONSUMABLE_TYPES)[number];
  supplier: (typeof SUPPLIERS)[number]["key"];
  unit: U;
  cost: number;
  minStock: number;
};

export const CONSUMABLES: ConsumableDef[] = [
  { key: "grano", name: "Café en grano", type: "Café y té", supplier: "cafe", unit: U.GRAM, cost: 0.022, minStock: 3000 },
  { key: "molido", name: "Café molido para filtro", type: "Café y té", supplier: "cafe", unit: U.GRAM, cost: 0.018, minStock: 1500 },
  { key: "teNegro", name: "Té negro en bolsita", type: "Café y té", supplier: "cafe", unit: U.UNIT, cost: 0.12, minStock: 40 },
  { key: "teVerde", name: "Té verde en bolsita", type: "Café y té", supplier: "cafe", unit: U.UNIT, cost: 0.14, minStock: 30 },
  { key: "leche", name: "Leche entera", type: "Lácteos y embutidos", supplier: "lacteos", unit: U.MILLILITER, cost: 0.0012, minStock: 10000 },
  { key: "almendra", name: "Leche de almendra", type: "Lácteos y embutidos", supplier: "lacteos", unit: U.MILLILITER, cost: 0.0035, minStock: 3000 },
  { key: "crema", name: "Crema batida", type: "Lácteos y embutidos", supplier: "lacteos", unit: U.MILLILITER, cost: 0.006, minStock: 1000 },
  { key: "quesoCrema", name: "Queso crema", type: "Lácteos y embutidos", supplier: "lacteos", unit: U.GRAM, cost: 0.012, minStock: 800 },
  { key: "mantequilla", name: "Mantequilla", type: "Lácteos y embutidos", supplier: "lacteos", unit: U.GRAM, cost: 0.01, minStock: 500 },
  { key: "jamon", name: "Jamón de pavo", type: "Lácteos y embutidos", supplier: "lacteos", unit: U.GRAM, cost: 0.014, minStock: 600 },
  { key: "croissant", name: "Croissant congelado", type: "Panadería", supplier: "pan", unit: U.PIECE, cost: 0.4, minStock: 24 },
  { key: "baguette", name: "Pan baguette", type: "Panadería", supplier: "pan", unit: U.PIECE, cost: 0.9, minStock: 8 },
  { key: "panBanana", name: "Pan de banana (porción)", type: "Panadería", supplier: "pan", unit: U.PIECE, cost: 0.6, minStock: 12 },
  { key: "bizcocho", name: "Brownie (porción)", type: "Panadería", supplier: "pan", unit: U.PIECE, cost: 0.85, minStock: 12 },
  { key: "galleta", name: "Masa de galleta", type: "Panadería", supplier: "pan", unit: U.GRAM, cost: 0.008, minStock: 1500 },
  { key: "azucar", name: "Azúcar", type: "Endulzantes y jarabes", supplier: "dulces", unit: U.GRAM, cost: 0.0015, minStock: 2000 },
  { key: "vainilla", name: "Jarabe de vainilla", type: "Endulzantes y jarabes", supplier: "dulces", unit: U.MILLILITER, cost: 0.012, minStock: 600 },
  { key: "caramelo", name: "Jarabe de caramelo", type: "Endulzantes y jarabes", supplier: "dulces", unit: U.MILLILITER, cost: 0.012, minStock: 800 },
  { key: "chocolate", name: "Chocolate en polvo", type: "Endulzantes y jarabes", supplier: "dulces", unit: U.GRAM, cost: 0.016, minStock: 800 },
  { key: "fresas", name: "Fresas", type: "Frutas", supplier: "frutas", unit: U.GRAM, cost: 0.009, minStock: 1500 },
  { key: "banano", name: "Banano", type: "Frutas", supplier: "frutas", unit: U.UNIT, cost: 0.15, minStock: 15 },
  { key: "limon", name: "Limón", type: "Frutas", supplier: "frutas", unit: U.UNIT, cost: 0.08, minStock: 30 },
  { key: "naranja", name: "Naranja", type: "Frutas", supplier: "frutas", unit: U.UNIT, cost: 0.2, minStock: 30 },
  { key: "hielo", name: "Hielo", type: "Insumos y empaques", supplier: "empaques", unit: U.GRAM, cost: 0.0004, minStock: 8000 },
  { key: "vaso", name: "Vaso plástico 16 oz", type: "Insumos y empaques", supplier: "empaques", unit: U.UNIT, cost: 0.09, minStock: 100 },
  { key: "pajilla", name: "Pajilla compostable", type: "Insumos y empaques", supplier: "empaques", unit: U.UNIT, cost: 0.02, minStock: 100 },
];

/** Consumibles cuya última compra "se olvidó": terminan bajo el mínimo para probar alertas. */
export const ENDS_LOW = ["caramelo", "almendra", "fresas"];

export const PRODUCT_TYPES = [
  "Café caliente",
  "Bebidas frías",
  "Tés e infusiones",
  "Panadería",
  "Desayunos",
  "Postres",
] as const;

type ProductDef = {
  name: string;
  description: string;
  type: (typeof PRODUCT_TYPES)[number];
  price: number;
  /** Peso relativo de ventas */
  popularity: number;
  recipe: [string, number][];
  active?: boolean;
};

const cold = (extra: [string, number][]): [string, number][] => [...extra, ["vaso", 1], ["pajilla", 1]];

export const PRODUCTS: ProductDef[] = [
  { name: "Espresso", description: "Shot doble de la casa", type: "Café caliente", price: 2.0, popularity: 5, recipe: [["grano", 18]] },
  { name: "Café Americano", description: "Espresso con agua caliente", type: "Café caliente", price: 2.25, popularity: 10, recipe: [["grano", 18]] },
  { name: "Café de filtro", description: "Café filtrado del día", type: "Café caliente", price: 1.75, popularity: 6, recipe: [["molido", 15]] },
  { name: "Cappuccino", description: "Espresso con leche espumada", type: "Café caliente", price: 3.25, popularity: 8, recipe: [["grano", 18], ["leche", 150]] },
  { name: "Café Latte", description: "Espresso con leche vaporizada", type: "Café caliente", price: 3.5, popularity: 9, recipe: [["grano", 18], ["leche", 220]] },
  { name: "Latte de vainilla", description: "Latte con jarabe de vainilla", type: "Café caliente", price: 3.95, popularity: 5, recipe: [["grano", 18], ["leche", 220], ["vainilla", 20]] },
  { name: "Latte de almendra", description: "Latte con leche de almendra", type: "Café caliente", price: 3.95, popularity: 3, recipe: [["grano", 18], ["almendra", 220]] },
  { name: "Mocha", description: "Espresso, chocolate, leche y crema", type: "Café caliente", price: 3.95, popularity: 5, recipe: [["grano", 18], ["leche", 200], ["chocolate", 20], ["crema", 20]] },
  { name: "Macchiato de caramelo", description: "Leche, vainilla y caramelo", type: "Café caliente", price: 3.95, popularity: 5, recipe: [["grano", 18], ["leche", 200], ["caramelo", 25]] },
  { name: "Chocolate caliente", description: "Chocolate con leche entera", type: "Café caliente", price: 3.0, popularity: 4, recipe: [["chocolate", 30], ["leche", 250], ["azucar", 10]] },
  { name: "Frappé de caramelo", description: "Café frío batido con caramelo", type: "Bebidas frías", price: 4.5, popularity: 7, recipe: cold([["grano", 18], ["leche", 180], ["caramelo", 30], ["hielo", 200], ["crema", 25]]) },
  { name: "Frappé de mocha", description: "Café frío batido con chocolate", type: "Bebidas frías", price: 4.5, popularity: 5, recipe: cold([["grano", 18], ["leche", 180], ["chocolate", 25], ["hielo", 200], ["crema", 25]]) },
  { name: "Cold brew", description: "Café infusionado en frío 18 h", type: "Bebidas frías", price: 3.5, popularity: 4, recipe: cold([["molido", 30], ["hielo", 150]]) },
  { name: "Limonada", description: "Limonada natural", type: "Bebidas frías", price: 2.5, popularity: 5, recipe: cold([["limon", 2], ["azucar", 25], ["hielo", 150]]) },
  { name: "Smoothie de fresa", description: "Fresa, banano y leche", type: "Bebidas frías", price: 4.25, popularity: 4, recipe: cold([["fresas", 150], ["banano", 1], ["leche", 120], ["hielo", 100]]) },
  { name: "Jugo de naranja", description: "Naranja recién exprimida", type: "Bebidas frías", price: 3.0, popularity: 4, recipe: cold([["naranja", 3], ["hielo", 50]]) },
  { name: "Té negro", description: "Té negro con o sin azúcar", type: "Tés e infusiones", price: 1.75, popularity: 2, recipe: [["teNegro", 1], ["azucar", 10]] },
  { name: "Té verde", description: "Té verde japonés", type: "Tés e infusiones", price: 1.75, popularity: 2, recipe: [["teVerde", 1]] },
  { name: "Chai latte", description: "Té negro especiado con leche", type: "Tés e infusiones", price: 3.5, popularity: 3, recipe: [["teNegro", 1], ["leche", 200], ["vainilla", 10]] },
  { name: "Croissant de mantequilla", description: "Horneado cada mañana", type: "Panadería", price: 2.25, popularity: 8, recipe: [["croissant", 1], ["mantequilla", 10]] },
  { name: "Croissant de jamón y queso", description: "Jamón de pavo y queso crema", type: "Panadería", price: 3.5, popularity: 5, recipe: [["croissant", 1], ["jamon", 40], ["quesoCrema", 20]] },
  { name: "Pan de banana", description: "Porción de pan casero", type: "Panadería", price: 2.5, popularity: 4, recipe: [["panBanana", 1]] },
  { name: "Galleta con chispas", description: "Galleta grande de chocolate", type: "Panadería", price: 1.5, popularity: 5, recipe: [["galleta", 60]] },
  { name: "Tostadas francesas", description: "Con fresas y miel", type: "Desayunos", price: 4.95, popularity: 3, recipe: [["baguette", 0.5], ["leche", 80], ["azucar", 15], ["fresas", 50], ["mantequilla", 15]] },
  { name: "Sándwich de jamón", description: "Baguette, jamón y queso crema", type: "Desayunos", price: 4.5, popularity: 4, recipe: [["baguette", 0.5], ["jamon", 60], ["quesoCrema", 25]] },
  { name: "Brownie", description: "Brownie de chocolate", type: "Postres", price: 2.75, popularity: 4, recipe: [["bizcocho", 1]] },
  { name: "Cheesecake de fresa", description: "Porción con salsa de fresa", type: "Postres", price: 3.95, popularity: 3, recipe: [["quesoCrema", 80], ["fresas", 40], ["galleta", 40]] },
  { name: "Frappé de temporada", description: "Sabor del mes pasado", type: "Bebidas frías", price: 4.75, popularity: 0, recipe: cold([["grano", 18], ["leche", 180], ["hielo", 200]]), active: false },
  { name: "Té de jamaica", description: "Se dejó de vender", type: "Tés e infusiones", price: 1.75, popularity: 0, recipe: [["azucar", 15]], active: false },
];

export const TABLES = [
  ...["I1", "I2", "I3", "I4", "I5", "I6"].map((tableId) => ({ tableId, zone: "Interior" })),
  ...["T1", "T2", "T3", "T4", "T5"].map((tableId) => ({ tableId, zone: "Terraza" })),
  ...["B1", "B2", "B3"].map((tableId) => ({ tableId, zone: "Barra" })),
];

export const CASH_REGISTERS = [
  { number: "001", active: true },
  { number: "002", active: true },
  { number: "003", active: false },
];

export const USER_TYPES = [
  { name: "Administrador", permissionLevel: 10, role: Role.ADMIN },
  { name: "Mesero", permissionLevel: 3, role: Role.MESERO },
  { name: "Cajero", permissionLevel: 5, role: Role.CAJERO },
];

export const DEMO_PASSWORD = "AdminDemo123!";

/** `untilDaysAgo`: dejó de trabajar ese día (queda inactivo). */
export const STAFF: {
  username: string;
  role: Role;
  pin?: string;
  untilDaysAgo?: number;
}[] = [
  { username: "admin.demo", role: Role.ADMIN },
  { username: "mesero.demo", role: Role.MESERO, pin: "1234" },
  { username: "ana.lopez", role: Role.MESERO, pin: "1111" },
  { username: "luis.martinez", role: Role.MESERO, pin: "2222" },
  { username: "sofia.ramirez", role: Role.MESERO, pin: "3333" },
  { username: "diego.hernandez", role: Role.MESERO, pin: "4444" },
  { username: "pedro.castillo", role: Role.MESERO, untilDaysAgo: 15 },
  { username: "cajero.demo", role: Role.CAJERO, pin: "5678" },
  { username: "carla.mendez", role: Role.CAJERO, pin: "6666" },
];

export const CUSTOMER_NAMES = [
  "Ana", "Luis", "Marta", "Carlos", "Sofía", "Diego", "Elena", "Jorge", "Valeria", "Andrés",
  "Gabriela", "Ricardo", "Daniela", "Fernando", "Paola", "Mario", "Lucía", "Roberto", "Camila", "Esteban",
];
