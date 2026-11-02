// Création/dédoublonnage des prospects : un prospect = un contact unique
// (par email ou téléphone), quel que soit le canal d'entrée.
// Appelé par createMessage pour chaque lead reçu.
import { eq, isNotNull } from 'drizzle-orm';
import { db } from '../db.js';
import { prospects } from '../db/schema.js';

// 06… et +336… désignent le même numéro : comparaison sur les 9
// derniers chiffres pour éviter les doublons de prospects.
const normPhone = (v) => String(v || '').replace(/\D/g, '').slice(-9);

export async function upsertProspect({ name, email, phone, projectType, source, consent }) {
  try {
    const np = normPhone(phone);
    let existing;
    if (email) {
      [existing] = await db.select().from(prospects).where(eq(prospects.email, email));
    }
    if (!existing && np) {
      const rows = await db.select().from(prospects).where(isNotNull(prospects.phone));
      existing = rows.find((r) => normPhone(r.phone) === np);
    }

    if (existing) {
      // Contact déjà connu : mise à jour des infos fraîches + date de
      // dernière sollicitation. Complète téléphone/email si absents —
      // la personne peut revenir par un autre canal avec d'autres infos.
      await db.update(prospects).set({
        ...(name && { name: name.slice(0, 150) }),
        ...(projectType && { projectType: projectType.slice(0, 100) }),
        ...(consent && { consent: true }),
        ...(phone && !existing.phone && { phone: phone.slice(0, 40) }),
        ...(email && !existing.email && { email: email.slice(0, 255) }),
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
