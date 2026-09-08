# Site maintenance

## Publish content

- Product source: `tools/products.json`. Use `tools/generate_product_pages.py` for full product generation.
- Store source: `data/stores.json`. Times are Asia/Taipei; the Inventec station is private.
- Run `node tools/build-site.mjs` after updating products or stores. This refreshes the homepage, directory pages, store schema and canonical URLs.
- Run `node --test tools/chat.test.mjs` for chat API checks.
- `node tools/preview-site.mjs` serves a local preview at http://127.0.0.1:4317. No live AI key is needed to check the fallback UI.
- Production uses extensionless article/product/store URLs. File names on disk retain `.html`.
- An unknown public URL must return HTTP 404. `robots.txt` must contain rules, not the homepage HTML. Cloudflare configuration may need checking if it overrides origin behavior.

## AI service

Existing Vercel environment: `GEMINI_API_KEY`. Optional: `GEMINI_MODEL` (default `gemini-2.5-flash`). Never put keys in browser code or Git.

Input is limited to 1,200 characters and 8 history messages. Output is rendered as text. CORS allowlisting does not authenticate clients.

The built-in five-requests-per-minute limiter is per warm function instance and resets on a cold start. A global multi-instance limit requires both `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` configured on Vercel. The Redis command is atomic and fails closed on backend errors. The integration is implemented but no Redis resource was provisioned in this update. A platform firewall rule can provide additional protection.

## Analytics

GA4 measurement ID `G-R9EDGK5GED` is loaded by `assets/site.js`. It sends page views plus `purchase_outbound`, `contact_line`, `contact_phone`, `store_directions` and `view_product_link` events. An outbound purchase click is an intent signal, not a completed order.

## Images and editorial follow-up

Existing brand artwork is retained. For per-store photography, use actual location images supplied by the owner, not unrelated stock images. Older health and brewing articles require a separate source-based editorial pass before adding further claims. A publication date or review attribution must reflect actual work, not be refreshed automatically to imply recency.
