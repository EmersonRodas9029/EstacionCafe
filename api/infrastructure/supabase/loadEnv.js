"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
const path_1 = require("path");
// La API guarda sus credenciales en api/.env, independientemente del cwd.
(0, dotenv_1.config)({ path: (0, path_1.resolve)(__dirname, "../../.env") });
