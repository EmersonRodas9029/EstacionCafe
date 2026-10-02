// Base de datos aislada para integración; se crea y migra en db.ts
process.env.NODE_ENV = "test";
process.env.DB_DATABASE = process.env.TEST_DB_DATABASE ?? "estacioncafe_test";
process.env.DB_LOGGING = "false";
