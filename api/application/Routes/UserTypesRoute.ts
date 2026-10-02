// Express is provided at runtime; allow compilation when its type declarations are unavailable.
import { Router } from 'express';
import {
    getUserTypes,
    getUserTypeById,
    saveUserType,
    updateUserType,
    deleteUserType
} from '../../controller/UserTypeController';
import { authorize } from '../../infrastructure/security/rbacMiddleware';
import { verifyToken } from '../../infrastructure/security/authMiddleware';

export const userTypeRouter = Router();
userTypeRouter.get('/user-types', getUserTypes);
userTypeRouter.get('/user-types/:id', getUserTypeById);
userTypeRouter.post('/user-types', saveUserType);
userTypeRouter.put('/user-types/:id', updateUserType);
userTypeRouter.delete('/user-types/:id', verifyToken, authorize(['admin']), deleteUserType);
