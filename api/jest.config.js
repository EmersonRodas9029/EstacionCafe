/** Pruebas unitarias (sin base de datos). Integración: jest.integration.config.js */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/"],
  testMatch: ["**/__tests__/**/*.ts", "**/?(*.)+(spec|test).ts"],
  testPathIgnorePatterns: ["/node_modules/", "/dist/", "\\.int\\.test\\.ts$"],
  collectCoverageFrom: [
    "**/*.ts",
    "!**/*.d.ts",
    "!**/node_modules/**",
    "!**/__tests__/**",
    "!test/**",
    "!dist/**",
    "!infrastructure/db/migrations/**",
  ],
  clearMocks: true,
  restoreMocks: true,
};
