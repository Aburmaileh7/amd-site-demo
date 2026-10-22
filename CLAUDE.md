# Amad Web — demo sites factory

Astro + GSAP. One folder per business: `sites/<slug>/place.json` → built to `/<slug>/`.
Deployed by GitHub Actions to Cloudflare Pages project `amd-demos` → `https://amd-demos.pages.dev/<slug>/`.

## Your job when a routine run gives you businesses (JSON in the run text)
The run text is a JSON object: `{ "batch_id": "...", "places": [ { "place_id", "slug_hint", "lead": {...}, "business_data": {...} } ] }`.
`business_data` holds Google Maps data from Apify: name, category, address, phone, rating, opening_hours, amenities, and up to 15 `reviews` each with a `review_id`.

For **each** place:
1. Pick a slug: latin lowercase with dashes from the name (e.g. `cielo-cafe`). If `sites/<slug>` exists for a *different* place_id, append `-2`.
2. Write `sites/<slug>/place.json` following `sites/san-rooftop/place.json` (rooftop), `sites/cielo-cafe/place.json` (cafe, full hero), `sites/the-couch-coffee-house/place.json` (cafe, split hero + story). Also store `"place_id"` and `"batch_id"` at the top level.
3. `npm run validate -- <slug>` must pass. Then `npm run build` and `node scripts/qa.mjs <slug>`. Look at `qa-out/<slug>/*.png` yourself (mobile + desktop) and fix anything that looks broken, empty, cramped or clipped.
4. Commit `sites/<slug>/place.json` only (never commit dist/ or qa-out/).

When every place is done: `git pull --rebase` then push. Pushing to `main` deploys. If you can only push to a `claude/...` branch, push there; the workflow merges it into `main` and deploys.
Finally write a one-line summary per place: slug, theme, URL `https://amd-demos.pages.dev/<slug>/`, and anything the owner should verify.

## Choosing the design
| theme | when | layout defaults |
|---|---|---|
| `rooftop_dark` | rooftops, evening venues, lounges, places open late with views/terraces | full hero, horizontal pinned story |
| `cafe_light` | cafes, bakeries, dessert shops, study cafes | split hero, stacked story (use `layout.hero: "full"` for terrace/outdoor-led cafes) |
| `heritage_warm` | local/popular restaurants, breakfast/foul/falafel, grills, traditional food | full hero, stacked story |
| `clinic_clean` | dental clinics | split hero; `menu.kind: "services"` (no prices); no story, no shisha, no mentions |

Make every site feel specific to *this* place: choose `sections` order, a `story` built from what reviews repeat (opening hours, signature items, seating), and optionally an `accent` (`{hex, rgb, hover, ink}`) that fits the place's name or mood. Two sites of the same theme must not look identical: vary accent, hero layout, story and section order.

## Honesty rules (non-negotiable)
- **Facts** (name, phone, address, hours, rating, amenities) come only from `business_data`. Missing → leave the field out; the section hides itself.
- **Reviews**: copy real reviews only, short (≤ 280 chars, trim with …), author first name + initial, `stars`, and `source_ref` = the `review_id`. Pick 4–6 positive, specific ones. Never write or edit a review's meaning. No reviews → `"reviews": []`.
- **Mentions** (`mentions`, `"mentioned": true` on menu items): only dishes/drinks named in reviews, one item per entry, ≤ 4 words.
- **Menu**: real menu is unknown, so it is a *sample*: `"sample": true` + the standard note. Realistic Jordanian prices in د.أ for the category. Clinics: services only, no prices, no medical promises.
- **WhatsApp** only when `lead.whatsapp_confirmed` is `TRUE`.
- **Images**: Unsplash only, free (not Unsplash+), relevant to the place type; `alt` starts with `صورة توضيحية`. Find ids by fetching `https://unsplash.com/s/photos/<query>` and reading photo ids (`photo-…`). Never use the business's Google photos.
- Copy: natural Arabic, concrete details, no empty slogans ("تجربة لا تُنسى", "الأفضل"), headline 4–9 words, intro 15–30 words.
- Keep `approved: false` (preview banner + noindex). Only the owner's approval changes it.

## Code changes
Prefer data over code. Change components only when a site needs something the system can't express, keep it generic (works for all sites), re-run QA on all sites after.
