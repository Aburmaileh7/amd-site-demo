// /p/<place_id>.json — lets n8n find a finished site by Google place_id
// (unguessable; no public list of demo sites).
export function getStaticPaths() {
  const files = import.meta.glob('../../../sites/*/place.json', { eager: true });
  return Object.entries(files)
    .map(([path, mod]) => ({ slug: path.split('/').at(-2), p: mod.default ?? mod }))
    .filter(({ p }) => p.place_id)
    .map(({ slug, p }) => ({ params: { pid: p.place_id }, props: { slug, p } }));
}
export function GET({ props }) {
  const { slug, p } = props;
  return new Response(JSON.stringify({
    slug, place_id: p.place_id, batch_id: p.batch_id || null, name: p.name, theme: p.theme,
    path: `/${slug}/`, approved: !!p.approved
  }), { headers: { 'content-type': 'application/json' } });
}
