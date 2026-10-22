// Shared by the Astro build and scripts/validate.mjs.
// Validates a site's place.json and fills layout defaults per theme.

export const THEMES = {
  rooftop_dark:  { hero: 'full',  story: 'horizontal', label: 'روف توب / سهرات' },
  cafe_light:    { hero: 'split', story: 'stack',      label: 'كافيه هادئ' },
  heritage_warm: { hero: 'full',  story: 'stack',      label: 'مطعم شعبي' },
  clinic_clean:  { hero: 'split', story: 'stack',      label: 'عيادة أسنان' }
};
export const SECTIONS = ['story', 'menu', 'proof', 'reviews', 'amenities', 'visit'];
export const ICONS = ['sky', 'calendar', 'bag', 'car', 'access', 'check', 'wifi', 'tree', 'family', 'clock', 'tooth', 'shield', 'coffee'];

const isStr = (v) => typeof v === 'string' && v.trim().length > 0;
const UNSPLASH_ID = /^(photo|premium_photo)-[0-9]+-[0-9a-f]+$/;

export function checkPlace(p, slug) {
  const errors = [];
  const warn = [];
  const req = (cond, msg) => { if (!cond) errors.push(msg); };

  req(p && typeof p === 'object', 'place.json is not an object');
  if (errors.length) return { errors, warn };

  req(p.slug === slug, `slug must equal folder name "${slug}"`);
  req(/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug), 'slug must be lowercase latin letters, digits, dashes');
  req(THEMES[p.theme], `theme must be one of ${Object.keys(THEMES).join(', ')}`);
  req(isStr(p.name), 'name required');
  req(isStr(p.category_label), 'category_label required');
  req(isStr(p.area), 'area required');
  req(p.hero && isStr(p.hero.headline), 'hero.headline required');
  req(p.phone || p.directions_url, 'need phone or directions_url (a way to reach the place)');
  if (p.phone) req(/^\+\d{8,15}$/.test(p.phone.tel || ''), 'phone.tel must be +<digits>');
  if (p.whatsapp) req(/^\d{8,15}$/.test(p.whatsapp.number || ''), 'whatsapp.number must be digits only (and only when confirmed)');
  if (p.directions_url) req(/^https:\/\/(www\.)?google\.[a-z.]+\/maps|^https:\/\/maps\.app\.goo\.gl\//.test(p.directions_url), 'directions_url must be a Google Maps https link');
  if (p.rating) req(typeof p.rating.value === 'number' && Number.isInteger(p.rating.count) && isStr(p.rating.source), 'rating needs value, count, source');

  // images: Unsplash ids only, every referenced key must exist
  const imgs = p.images || {};
  for (const [k, v] of Object.entries(imgs)) {
    req(v && UNSPLASH_ID.test(v.id || ''), `images.${k}.id must be an Unsplash photo id`);
    req(v && isStr(v.alt) && v.alt.startsWith('صورة توضيحية'), `images.${k}.alt must start with "صورة توضيحية"`);
  }
  const refs = [p.hero?.image, p.amenities?.image, p.visit?.image,
    ...(p.story?.items || []).map((i) => i.image), ...(p.menu?.categories || []).map((c) => c.image)].filter(Boolean);
  for (const r of refs) req(imgs[r], `image key "${r}" is used but not defined in images`);

  // menu: a sample menu must say so
  if (p.menu) {
    if (p.menu.kind !== 'services') req(p.menu.sample === false || isStr(p.menu.note), 'sample menu needs a visible note');
    for (const c of p.menu.categories || []) for (const it of c.items || []) req(isStr(it.name), `menu item without name in ${c.id}`);
  }
  // reviews: real only, must carry their source id from the input data
  for (const r of p.reviews || []) {
    req(isStr(r.text) && isStr(r.author), 'review needs text and author');
    req(isStr(r.source_ref), 'review needs source_ref (the review_id it came from)');
  }
  for (const a of p.amenities?.items || []) if (!ICONS.includes(a.icon)) warn.push(`unknown icon "${a.icon}" -> check`);
  for (const s of p.sections || []) req(SECTIONS.includes(s), `unknown section "${s}"`);
  return { errors, warn };
}

export function normalize(p) {
  const t = THEMES[p.theme] || THEMES.cafe_light;
  return {
    agency: 'Amad Web',
    approved: false,
    banner: `هذا موقع تجريبي من تصميم ${p.agency || 'Amad Web'} — غير معتمد من إدارة المحل.`,
    sections: ['story', 'menu', 'proof', 'reviews', 'amenities', 'visit'],
    images: {},
    ...p,
    layout: { hero: t.hero, story: t.story, ...(p.layout || {}) }
  };
}
