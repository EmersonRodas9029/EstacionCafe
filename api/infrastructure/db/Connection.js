"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDataSource = exports.AppDataSource = void 0;
require("../supabase/loadEnv");
const typeorm_1 = require("typeorm");
const path_1 = require("path");
const databaseUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
const useSsl = process.env.DB_SSL !== "false";
const connectionOptions = databaseUrl
    ? {
        type: "postgres",
        url: databaseUrl,
        ssl: useSsl ? { rejectUnauthorized: false } : false,
    }
    : {
        type: "postgres",
        host: process.env.SUPABASE_DB_HOST || process.env.DB_HOST,
        port: Number(process.env.SUPABASE_DB_PORT || process.env.DB_PORT || 5432),
        username: process.env.SUPABASE_DB_USER || process.env.DB_USERNAME,
        password: process.env.SUPABASE_DB_PASSWORD || process.env.DB_PASSWORD,
        database: process.env.SUPABASE_DB_NAME || process.env.DB_DATABASE || "postgres",
        ssl: useSsl ? { rejectUnauthorized: false } : false,
    };
exports.AppDataSource = new typeorm_1.DataSource({
    ...connectionOptions,
    synchronize: false,
    logging: process.env.DB_LOGGING === "true",
    entities: [(0, path_1.join)(__dirname, "../../core/entities/*{.ts,.js}")],
    migrations: [],
    subscribers: [],
});
const getDataSource = () => exports.AppDataSource;
exports.getDataSource = getDataSource;
exports.default = exports.AppDataSource;
