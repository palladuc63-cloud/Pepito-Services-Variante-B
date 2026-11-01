// Set d'icônes SVG sur-mesure Pépito Services.
// Style unique : trait 1.8, bouts ronds, viewBox 24×24, currentColor.
// Les pictos métiers (fence, gate, digger) sont dessinés pour l'activité.
export const ICONS: Record<string, string> = {
  // ── Pictos métiers ──
  fence:
    '<path d="M4 21v-12l2-2 2 2v12"/><path d="M10 21v-12l2-2 2 2v12"/><path d="M16 21v-12l2-2 2 2v12"/><path d="M3 12h18"/><path d="M3 17h18"/>',
  gate:
    '<path d="M3 21V5"/><path d="M21 21V5"/><path d="M5 21V9h6v12"/><path d="M13 21V9h6v12"/><path d="m5 9 6 12"/><path d="m19 9-6 12"/>',
  digger:
    '<rect x="3" y="17" width="8" height="4" rx="2"/><path d="M5 17v-4h4v4"/><path d="M5 13V9h3v4"/><path d="m10 11.5 5-3.5 4 3.5"/><path d="m19 11.5 1 3.5h-3"/><path d="M13.5 21h7.5"/>',
  // ── Navigation ──
  home:
    '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 9.5V20h13V9.5"/><path d="M10 20v-5.5h4V20"/>',
  artisan:
    '<path d="M7 12a5 5 0 0 1 10 0"/><path d="M4.5 12h15"/><path d="M12 7v3"/><path d="M7 21c0-4 2.2-6 5-6s5 2 5 6"/>',
  images:
    '<rect x="3" y="4" width="18" height="15" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="m3 18 6-6 4 4 3-3 5 5"/>',
  news:
    '<path d="M4 6h12v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6z"/><path d="M16 9h3a1 1 0 0 1 1 1v8a2 2 0 0 1-2 2"/><path d="M7 10h5"/><path d="M7 13h5"/><path d="M7 16h3"/>',
  mail:
    '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 7.5 8.5 6 8.5-6"/>',
  // ── Contact ──
  phone:
    '<path d="M5.5 3.5h3l1.5 4.5-2 1.5a12 12 0 0 0 6 6l1.5-2 4.5 1.5v3a2 2 0 0 1-2 2A17 17 0 0 1 3.5 5.5a2 2 0 0 1 2-2z"/>',
  clock:
    '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  map:
    '<path d="m9 4-6 2v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14"/><path d="M15 6v14"/>',
  building:
    '<rect x="5" y="4" width="14" height="17" rx="1"/><path d="M9 21v-4h6v4"/><path d="M9 8h2"/><path d="M13 8h2"/><path d="M9 12h2"/><path d="M13 12h2"/>',
  // ── Divers ──
  grid:
    '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
  pin:
    '<path d="M12 21s-6.5-5.4-6.5-10a6.5 6.5 0 0 1 13 0c0 4.6-6.5 10-6.5 10z"/><circle cx="12" cy="10.5" r="2"/>',
  'file-text':
    '<path d="M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V8l-4-5z"/><path d="M14 3v5h4"/><path d="M9 13h6"/><path d="M9 17h4"/>',
  calendar:
    '<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M8 3v4"/><path d="M16 3v4"/><path d="M4 11h16"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  'arrow-left': '<path d="M19 12H5"/><path d="m11 18-6-6 6-6"/>',
  'arrow-right': '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
  'chevron-left': '<path d="m15 18-6-6 6-6"/>',
  'chevron-right': '<path d="m9 18 6-6-6-6"/>',
  external:
    '<path d="M14 4h6v6"/><path d="M20 4 11 13"/><path d="M18 14v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h5"/>',
  facebook:
    '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>',
  instagram:
    '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>',
};

// Slug catégorie/service → picto métier (fallback : grille).
const CATEGORY_ICONS: Record<string, string> = {
  clotures: 'fence',
  'clotures-palissades': 'fence',
  portails: 'gate',
  'portails-portillons': 'gate',
  terrassements: 'digger',
  'petits-terrassements': 'digger',
};

export function categoryIcon(slug?: string | null): string {
  return (slug && CATEGORY_ICONS[slug]) || 'grid';
}
