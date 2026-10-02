"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Consumable = void 0;
const typeorm_1 = require("typeorm");
const ConsumableType_1 = require("./ConsumableType");
const UnitMeasurement_1 = require("../enums/UnitMeasurement");
const Ingredient_1 = require("./Ingredient");
const Supplier_1 = require("./Supplier");
let Consumable = class Consumable {
    constructor() {
        this.name = "";
        this.cosumableTypeId = 0;
        this.quantity = 0;
        this.cost = 0;
    }
};
exports.Consumable = Consumable;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("increment", { name: "consumable_id" }),
    __metadata("design:type", Number)
], Consumable.prototype, "consumableId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "supplier_id" }),
    __metadata("design:type", Number)
], Consumable.prototype, "supplierId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Consumable.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "consumable_type_id" }),
    __metadata("design:type", Number)
], Consumable.prototype, "cosumableTypeId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => ConsumableType_1.ConsumableType, (type) => type),
    (0, typeorm_1.JoinColumn)({ name: "consumable_type_id" }),
    __metadata("design:type", ConsumableType_1.ConsumableType)
], Consumable.prototype, "consumableType", void 0);
__decorate([
    (0, typeorm_1.Column)("float"),
    __metadata("design:type", Number)
], Consumable.prototype, "quantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "unitMeasurement", type: "varchar", length: 20 }),
    __metadata("design:type", String)
], Consumable.prototype, "unitMeasurement", void 0);
__decorate([
    (0, typeorm_1.Column)("numeric", { precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], Consumable.prototype, "cost", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Consumable.prototype, "active", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Ingredient_1.Ingredient, (ingredient) => ingredient.consumable),
    __metadata("design:type", Array)
], Consumable.prototype, "ingredients", void 0);
__decorate([
    (0, typeorm_1.JoinColumn)({ name: "supplier_id" }),
    (0, typeorm_1.ManyToOne)(() => Supplier_1.Supplier, (supplier) => supplier.consumable),
    __metadata("design:type", Supplier_1.Supplier)
], Consumable.prototype, "supplier", void 0);
exports.Consumable = Consumable = __decorate([
    (0, typeorm_1.Entity)("Consumable"),
    __metadata("design:paramtypes", [])
], Consumable);
