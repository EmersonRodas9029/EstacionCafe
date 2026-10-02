"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userTypeRouter = void 0;
// Express is provided at runtime; allow compilation when its type declarations are unavailable.
const express_1 = require("express");
const UserTypeController_1 = require("../../controller/UserTypeController");
const rbacMiddleware_1 = require("../../infrastructure/security/rbacMiddleware");
const authMiddleware_1 = require("../../infrastructure/security/authMiddleware");
exports.userTypeRouter = (0, express_1.Router)();
exports.userTypeRouter.get('/user-types', UserTypeController_1.getUserTypes);
exports.userTypeRouter.get('/user-types/:id', UserTypeController_1.getUserTypeById);
exports.userTypeRouter.post('/user-types', UserTypeController_1.saveUserType);
exports.userTypeRouter.put('/user-types/:id', UserTypeController_1.updateUserType);
exports.userTypeRouter.delete('/user-types/:id', authMiddleware_1.verifyToken, (0, rbacMiddleware_1.authorize)(['admin']), UserTypeController_1.deleteUserType);
