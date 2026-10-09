import express from 'express';
import * as ctrl from '../controllers/public.js';
import { rateLimit } from '../utils/rateLimit.js';

const router = express.Router();

router.get('/content', ctrl.getContent);
router.get('/projects', ctrl.listProjects);
router.get('/articles', ctrl.listArticles);
router.get('/articles/:slug', ctrl.getArticle);
// Anti-spam : 3 messages/min par IP
router.post('/messages', rateLimit({ max: 3, message: 'Trop de messages envoyés, réessayez dans une minute.' }), ctrl.createMessage);

export default router;
