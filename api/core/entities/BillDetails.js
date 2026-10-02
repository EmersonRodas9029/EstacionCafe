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
exports.BillDetails = void 0;
const typeorm_1 = require("typeorm");
const Producto_1 = require("./Producto");
const Bill_1 = require("./Bill");
let BillDetails = class BillDetails {
    constructor() {
        this.billId = 0;
        this.productId = 0;
        this.quantity = 0;
        this.subTotal = 0;
    }
};
exports.BillDetails = BillDetails;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("increment", { name: "bill_details_id" }),
    __metadata("design:type", Number)
], BillDetails.prototype, "billDetailId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "bill_id" }),
    __metadata("design:type", Number)
], BillDetails.prototype, "billId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "product_id" }),
    __metadata("design:type", Number)
], BillDetails.prototype, "productId", void 0);
__decorate([
    (0, typeorm_1.Column)("integer"),
    __metadata("design:type", Number)
], BillDetails.prototype, "quantity", void 0);
__decorate([
    (0, typeorm_1.Column)("decimal", {
        name: "sub_total",
        precision: 10,
        scale: 2,
        transformer: {
            to: (value) => value,
            from: (value) => parseFloat(value),
        },
    }),
    __metadata("design:type", Number)
], BillDetails.prototype, "subTotal", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Producto_1.Product, (product) => product.billDetails),
    (0, typeorm_1.JoinColumn)({ name: "product_id" }),
    __metadata("design:type", Producto_1.Product)
], BillDetails.prototype, "product", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Bill_1.Bill, (bill) => bill.billDetails),
    (0, typeorm_1.JoinColumn)({ name: "bill_id" }),
    __metadata("design:type", Bill_1.Bill)
], BillDetails.prototype, "bill", void 0);
exports.BillDetails = BillDetails = __decorate([
    (0, typeorm_1.Entity)("bill_details"),
    __metadata("design:paramtypes", [])
], BillDetails);
