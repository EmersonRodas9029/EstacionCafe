/** Pruebas de integración contra PostgreSQL real (npm run test:int). */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/test/integration"],
  testMatch: ["**/*.int.test.ts"],
  setupFiles: ["<rootDir>/test/integration/env.ts"],
  maxWorkers: 1,
  testTimeout: 30000,
};
