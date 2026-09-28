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
exports.Purchase = void 0;
const typeorm_1 = require("typeorm");
const Supplier_1 = require("./Supplier");
let Purchase = class Purchase {
    constructor() {
        this.purchaseId = undefined;
        this.date = new Date();
        this.cashRegister = 0;
        this.supplierId = 0;
        this.total = 0;
    }
};
exports.Purchase = Purchase;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("increment", { name: "purchase_id" }),
    __metadata("design:type", Number)
], Purchase.prototype, "purchaseId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Date)
], Purchase.prototype, "date", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "cash_register" }),
    __metadata("design:type", Number)
], Purchase.prototype, "cashRegister", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "supplier_id" }),
    __metadata("design:type", Number)
], Purchase.prototype, "supplierId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Supplier_1.Supplier),
    (0, typeorm_1.JoinColumn)({ name: "supplier_id" }),
    __metadata("design:type", Supplier_1.Supplier)
], Purchase.prototype, "supplier", void 0);
__decorate([
    (0, typeorm_1.Column)("decimal", { precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], Purchase.prototype, "total", void 0);
exports.Purchase = Purchase = __decorate([
    (0, typeorm_1.Entity)("purchases")
], Purchase);
