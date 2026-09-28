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
exports.Product = void 0;
const typeorm_1 = require("typeorm");
const BillDetails_1 = require("./BillDetails");
const Ingredient_1 = require("./Ingredient");
const ProductType_1 = require("./ProductType");
let Product = class Product {
    constructor() {
        this.name = "";
        this.description = "";
        this.price = 0.0;
        this.cost = 0.0;
        this.active = true;
        this.productTypeId = 0;
    }
};
exports.Product = Product;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: "product_id" }),
    __metadata("design:type", Number)
], Product.prototype, "productId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Product.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Product.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)("decimal", {
        precision: 10,
        scale: 2,
        transformer: {
            to: (value) => value,
            from: (value) => parseFloat(value),
        },
    }),
    __metadata("design:type", Number)
], Product.prototype, "price", void 0);
__decorate([
    (0, typeorm_1.Column)("decimal", {
        precision: 10,
        scale: 2,
        transformer: {
            to: (value) => value,
            from: (value) => parseFloat(value),
        },
    }),
    __metadata("design:type", Number)
], Product.prototype, "cost", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Boolean)
], Product.prototype, "active", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "product_type_id", nullable: true }),
    __metadata("design:type", Number)
], Product.prototype, "productTypeId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => ProductType_1.ProductType, (productType) => productType.products),
    (0, typeorm_1.JoinColumn)({ name: "product_type_id" }),
    __metadata("design:type", ProductType_1.ProductType)
], Product.prototype, "productType", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => BillDetails_1.BillDetails, (billDetail) => billDetail.product),
    __metadata("design:type", Array)
], Product.prototype, "billDetails", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Ingredient_1.Ingredient, (ingredient) => ingredient.product),
    __metadata("design:type", Array)
], Product.prototype, "ingredients", void 0);
exports.Product = Product = __decorate([
    (0, typeorm_1.Entity)("products"),
    __metadata("design:paramtypes", [])
], Product);
