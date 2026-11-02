// Création/dédoublonnage des prospects : un prospect = un contact unique
// (par email ou téléphone), quel que soit le canal d'entrée.
// Appelé par createMessage pour chaque lead reçu.
import { eq, or } from 'drizzle-orm';
import { db } from '../db.js';
import { prospects } from '../db/schema.js';

export async function upsertProspect({ name, email, phone, projectType, source, consent }) {
  try {
    const conditions = [];
    if (email) conditions.push(eq(prospects.email, email));
    if (phone) conditions.push(eq(prospects.phone, phone));

    let existing;
    if (conditions.length) {
      const rows = await db.select().from(prospects).where(or(...conditions));
      existing = rows[0];
    }

    if (existing) {
      // Contact déjà connu : mise à jour des infos fraîches + date de dernière sollicitation.
      await db.update(prospects).set({
        ...(name && { name: name.slice(0, 150) }),
        ...(projectType && { projectType: projectType.slice(0, 100) }),
        ...(consent && { consent: true }),
        lastContactAt: new Date(),
      }).where(eq(prospects.id, existing.id));
      return existing.id;
    }

    const [res] = await db.insert(prospects).values({
      name: (name || 'Inconnu').slice(0, 150),
      email: email?.slice(0, 255) || null,
      phone: phone?.slice(0, 40) || null,
      projectType: projectType?.slice(0, 100) || null,
      source: source || 'contact',
      consent: Boolean(consent),
      lastContactAt: new Date(),
    });
    return res.insertId;
  } catch (err) {
    console.error('upsertProspect:', err.message);
    return null;
  }
}
