import { Router } from 'express';
import {
    getSuppliers,
    getSupplierById,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    getActiveSuppliers
} from '../../controller/SupplierController';
import { verifyToken } from '../../infrastructure/security/authMiddleware';
import { authorize } from '../../infrastructure/security/rbacMiddleware';

export const supplierRouter = Router();

supplierRouter.get('/suppliers', getSuppliers);
supplierRouter.get('/suppliers/active', getActiveSuppliers);
supplierRouter.get('/suppliers/:id', getSupplierById);
supplierRouter.post('/suppliers', createSupplier);
supplierRouter.put('/suppliers/:id', updateSupplier);
supplierRouter.delete('/suppliers/:id', verifyToken, authorize(['admin']), deleteSupplier);
