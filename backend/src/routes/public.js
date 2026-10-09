import express from 'express';
import * as ctrl from '../controllers/public.js';

const router = express.Router();

router.get('/content', ctrl.getContent);
router.get('/projects', ctrl.listProjects);
router.get('/articles', ctrl.listArticles);
router.get('/articles/:slug', ctrl.getArticle);
router.post('/messages', ctrl.createMessage);

export default router;
