# amd-site

مصنع المواقع التجريبية لـ Amad Web. كل محل في `sites/<slug>/place.json`، ويُنشر على `https://amd-demos.pages.dev/<slug>/`.

```bash
npm ci
npm run dev                 # http://localhost:4321/<slug>/
npm run build               # validate + build all sites into dist/
node scripts/qa.mjs <slug>  # screenshots + checks (needs playwright)
```
Instructions for Claude routine runs: `CLAUDE.md` and `ROUTINE_PROMPT.md`.
