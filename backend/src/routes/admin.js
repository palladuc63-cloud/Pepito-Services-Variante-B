import express from 'express';
import { authenticateJWT } from '../utils/auth.js';
import * as ctrl from '../controllers/admin.js';
import * as social from '../controllers/social.js';

const router = express.Router();
router.use(authenticateJWT);

router.get('/categories', ctrl.listCategories);
router.post('/categories', ctrl.createCategory);
router.put('/categories/:id', ctrl.updateCategory);
router.delete('/categories/:id', ctrl.deleteCategory);

router.get('/services', ctrl.listServices);
router.post('/services', ctrl.createService);
router.put('/services/:id', ctrl.updateService);
router.delete('/services/:id', ctrl.deleteService);

router.get('/projects', ctrl.listProjects);
router.post('/projects', ctrl.createProject);
router.put('/projects/:id', ctrl.updateProject);
router.delete('/projects/:id', ctrl.deleteProject);

router.get('/articles', ctrl.listArticles);
router.post('/articles', ctrl.createArticle);
router.put('/articles/:id', ctrl.updateArticle);
router.delete('/articles/:id', ctrl.deleteArticle);

router.get('/messages', ctrl.listMessages);
router.put('/messages/:id', ctrl.markMessageRead);
router.delete('/messages/:id', ctrl.deleteMessage);

router.get('/settings', ctrl.getSettings);
router.put('/settings', ctrl.updateSettings);

router.get('/social-posts', social.listPosts);
router.put('/social-posts/:id', social.updatePost);
router.post('/social-posts/:id/publish', social.publishPost);
router.delete('/social-posts/:id', social.deletePost);

export default router;
