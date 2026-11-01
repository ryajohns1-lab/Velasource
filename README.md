# VelaSource

Independent provider-search engine prototype and a hosted compatibility-test adapter for Ovrelixa. **Ovrelixa code and app builds are unchanged.**

## Current VelaSource v5 import

Paste this URL in **Ovrelixa → Settings → Vendors**:

`https://velasource-demo-api.ryajohns1.workers.dev/syncler/vendor/`

1. Remove **VelaSource Express Adapter v4** (and any earlier VelaSource test packages).
2. Choose **Check vendor URL** with the v5 URL above.
3. Import **VelaSource - Express v5**, and check **Settings → Sources → Vendors**.
4. Search for **Big Buck Bunny (2008)** and view Diagnostics.

The v5 catalog exactly follows the working JakedUp-style three-stage structure:

- Vendor: `https://velasource-demo-api.ryajohns1.workers.dev/syncler/vendor/`
- Legacy Express manifest: `https://velasource-demo-api.ryajohns1.workers.dev/syncler/express/manifest` (fields: name, id, version, classPath, permaUrl, type)
- Provider rules: `https://velasource-demo-api.ryajohns1.workers.dev/syncler/express`
- Licensed sample search API: `https://velasource-demo-api.ryajohns1.workers.dev/search?kind=movie&title=Big%20Buck%20Bunny`
- Health: `https://velasource-demo-api.ryajohns1.workers.dev/health`

All endpoints are served from the same Cloudflare Worker as JSON. The [external GitHub Actions smoke test](https://github.com/ryajohns1-lab/Velasource/actions/workflows/adapter-smoke.yml) verifies vendor → legacy manifest → provider definition → test search using the same Accept header as Ovrelixa's restricted provider fetch.

**Expected diagnostics:** one returned candidate for the public Creative Commons *Big Buck Bunny* (2008) test. The displayed stream picker can still contain zero items because Ovrelixa only accepts Premiumize-confirmed cached links. This sample is an ordinary HTTPS video, not a Premiumize-cached source.

## Independent Node engine

This hosted Worker is **a licensed-sample adapter**, not the full standalone Node VelaSource engine. The original VelaSource source ZIP (provided separately) includes provider orchestration, lookup/ranking, and a local Express API. The entire Node source has not yet been uploaded to this repository or deployed. GitHub cannot run the Node server by itself.

Do not confuse a successful vendor import with operational, authorized live-provider configuration. Syncler's [package-starter](https://github.com/synclerd/package-starter) and [JakedUp/Syncler-Packages](https://github.com/JakedUp/Syncler-Packages) were used as format references, not copied as executed code.
