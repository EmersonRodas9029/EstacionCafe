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
exports.Bill = void 0;
const typeorm_1 = require("typeorm");
const BillDetails_1 = require("./BillDetails");
const User_1 = require("./User");
const Table_1 = require("./Table");
const Status_1 = require("../enums/Status");
let Bill = class Bill {
    constructor() {
        this.billId = undefined;
        this.customer = "";
        this.date = new Date();
    }
};
exports.Bill = Bill;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("increment", { name: "bill_id" }),
    __metadata("design:type", Number)
], Bill.prototype, "billId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "cash_register" }),
    __metadata("design:type", Number)
], Bill.prototype, "cashRegisterId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "table_id", type: "varchar", length: 10, nullable: true }),
    __metadata("design:type", String)
], Bill.prototype, "tableId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Bill.prototype, "customer", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Date)
], Bill.prototype, "date", void 0);
__decorate([
    (0, typeorm_1.Column)("decimal", {
        name: "total",
        precision: 10,
        scale: 2,
        transformer: {
            to: (value) => value,
            from: (value) => parseFloat(value),
        },
    }),
    __metadata("design:type", Number)
], Bill.prototype, "total", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 20, default: Status_1.Status.DRAFT }),
    __metadata("design:type", String)
], Bill.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({
        name: "created_at",
        default: () => "CURRENT_TIMESTAMP",
    }),
    __metadata("design:type", Date)
], Bill.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({
        name: "updated_at",
        default: () => "CURRENT_TIMESTAMP",
        onUpdate: "CURRENT_TIMESTAMP",
    }),
    __metadata("design:type", Date)
], Bill.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => BillDetails_1.BillDetails, (billDet) => billDet.bill),
    __metadata("design:type", Array)
], Bill.prototype, "billDetails", void 0);
__decorate([
    (0, typeorm_1.JoinColumn)({ name: "cash_register" }),
    (0, typeorm_1.ManyToOne)(() => User_1.User, (cashRegister) => cashRegister.bill),
    __metadata("design:type", User_1.User)
], Bill.prototype, "cashRegister", void 0);
__decorate([
    (0, typeorm_1.JoinColumn)({ name: "table_id" }),
    (0, typeorm_1.ManyToOne)(() => Table_1.Table, (table) => table.bills, { nullable: true }),
    __metadata("design:type", Table_1.Table)
], Bill.prototype, "table", void 0);
exports.Bill = Bill = __decorate([
    (0, typeorm_1.Entity)("bills")
], Bill);
