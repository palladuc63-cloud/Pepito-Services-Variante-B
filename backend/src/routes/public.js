import express from 'express';
import * as ctrl from '../controllers/public.js';
import { rateLimit } from '../utils/rateLimit.js';

const router = express.Router();

router.get('/content', ctrl.getContent);
router.get('/projects', ctrl.listProjects);
router.get('/projects/:slug', ctrl.getProject);
router.get('/articles', ctrl.listArticles);
router.get('/articles/:slug', ctrl.getArticle);
router.get('/city-pages', ctrl.listCityPages);
router.get('/city-markers', ctrl.listCityMarkers);
router.get('/city-pages/:service/:slug', ctrl.getCityPage);
router.get('/redirects', ctrl.listRedirects);
// Anti-spam : 3 messages/min par IP
router.post('/messages', rateLimit({ max: 3, message: 'Trop de messages envoyés, réessayez dans une minute.' }), ctrl.createMessage);

export default router;
