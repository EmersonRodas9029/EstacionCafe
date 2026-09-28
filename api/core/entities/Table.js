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
exports.Table = exports.TableStatus = void 0;
const typeorm_1 = require("typeorm");
const Bill_1 = require("./Bill");
var TableStatus;
(function (TableStatus) {
    TableStatus["DISPONIBLE"] = "disponible";
    TableStatus["OCUPADA"] = "ocupada";
    TableStatus["RESERVADA"] = "reservada";
})(TableStatus || (exports.TableStatus = TableStatus = {}));
let Table = class Table {
};
exports.Table = Table;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: "table_id", type: "varchar", length: 10 }),
    __metadata("design:type", String)
], Table.prototype, "tableId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 50 }),
    __metadata("design:type", String)
], Table.prototype, "zone", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "simple-enum",
        enum: TableStatus,
        default: TableStatus.DISPONIBLE,
    }),
    __metadata("design:type", String)
], Table.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Bill_1.Bill, (bill) => bill.table),
    __metadata("design:type", Array)
], Table.prototype, "bills", void 0);
exports.Table = Table = __decorate([
    (0, typeorm_1.Entity)("tables")
], Table);
