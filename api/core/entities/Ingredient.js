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
exports.Ingredient = void 0;
const typeorm_1 = require("typeorm");
const Producto_1 = require("./Producto");
const Consumable_1 = require("./Consumable");
let Ingredient = class Ingredient {
    constructor() {
        this.name = "";
        this.quantity = 0;
    }
};
exports.Ingredient = Ingredient;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("increment", { name: "ingredient_id" }),
    __metadata("design:type", Number)
], Ingredient.prototype, "ingredientId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "consumable_id" }),
    __metadata("design:type", Number)
], Ingredient.prototype, "consumableId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Ingredient.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)("decimal", { precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], Ingredient.prototype, "quantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "product_id" }),
    __metadata("design:type", Number)
], Ingredient.prototype, "productId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Consumable_1.Consumable, (consumable) => consumable.ingredients),
    (0, typeorm_1.JoinColumn)({ name: "consumable_id" }),
    __metadata("design:type", Consumable_1.Consumable)
], Ingredient.prototype, "consumable", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Producto_1.Product, (product) => product.ingredients),
    (0, typeorm_1.JoinColumn)({ name: "product_id" }),
    __metadata("design:type", Producto_1.Product)
], Ingredient.prototype, "product", void 0);
exports.Ingredient = Ingredient = __decorate([
    (0, typeorm_1.Entity)("ingredients"),
    __metadata("design:paramtypes", [])
], Ingredient);
