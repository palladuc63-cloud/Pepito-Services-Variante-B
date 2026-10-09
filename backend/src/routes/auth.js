import express from 'express';
import * as authController from '../controllers/auth.js';
import { authenticateJWT } from '../utils/auth.js';

const router = express.Router();

router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/me', authenticateJWT, authController.me);

export default router;
