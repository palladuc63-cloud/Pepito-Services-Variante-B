import { eq, desc } from 'drizzle-orm';
import { db } from '../db.js';
import { socialPosts } from '../db/schema.js';
import { publishToFacebook, facebookConfigured } from '../utils/social.js';
import { notify } from '../utils/notify.js';

export async function listPosts(_req, res) {
  const rows = await db.select().from(socialPosts).orderBy(desc(socialPosts.createdAt));
  res.json({ configured: facebookConfigured(), posts: rows });
}

export async function updatePost(req, res) {
  const id = Number(req.params.id);
  const { content, status } = req.body ?? {};
  const allowed = ['draft', 'approved', 'published', 'failed'];
  await db.update(socialPosts).set({
    ...(content !== undefined && { content }),
    ...(status !== undefined && allowed.includes(status) && { status }),
  }).where(eq(socialPosts.id, id));
  res.json({ status: 'ok' });
}

export async function publishPost(req, res) {
  const id = Number(req.params.id);
  const [post] = await db.select().from(socialPosts).where(eq(socialPosts.id, id));
  if (!post) return res.status(404).json({ error: 'Post introuvable' });

  try {
    const { id: fbPostId } = await publishToFacebook(post);
    await db.update(socialPosts).set({
      status: 'published', fbPostId, error: null, publishedAt: new Date(),
    }).where(eq(socialPosts.id, id));
    notify('✅ Publié sur Facebook — Pépito', post.content.split('\n')[0]);
    res.json({ status: 'published', fbPostId });
  } catch (err) {
    await db.update(socialPosts).set({ status: 'failed', error: err.message })
      .where(eq(socialPosts.id, id));
    res.status(502).json({ error: err.message });
  }
}

export async function deletePost(req, res) {
  await db.delete(socialPosts).where(eq(socialPosts.id, Number(req.params.id)));
  res.json({ status: 'ok' });
}
