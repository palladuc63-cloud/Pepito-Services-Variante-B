import express from 'express';
import * as authController from '../controllers/auth.js';
import { authenticateJWT } from '../utils/auth.js';
import { rateLimit } from '../utils/rateLimit.js';

const router = express.Router();

// Anti brute-force : 5 tentatives/min par IP
router.post('/login', rateLimit({ max: 5, message: 'Trop de tentatives de connexion, réessayez dans une minute.' }), authController.login);
router.post('/logout', authController.logout);
router.get('/me', authenticateJWT, authController.me);

export default router;
