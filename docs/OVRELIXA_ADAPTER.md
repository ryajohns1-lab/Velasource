# VelaSource v4 — Ovrelixa vendor import test

The Ovrelixa app is unchanged. The VelaSource app-import smoke test is hosted at https://velasource-demo-api.ryajohns1.workers.dev.

## Why the v3 test failed

The iPhone Diagnostics read `Package manifest: error (Cannot load Express definition)`. This means the manifest imported successfully, but the subsequent provider-definition download failed. Prior v3 definitions were requested from `raw.githubusercontent.com`, which served the file with `text/plain`; this did not prove the exact failure cause, but it exposed an unnecessary host/content-type dependency.

**v4 removes that dependency altogether.** The vendor URL and the one-file inline Express definition are served from the same Cloudflare Worker with `Content-Type: application/json` and no-store metadata cache headers.

## Install

1. In **Settings → Vendors**, remove old **VelaSource Express Adapter v3** (and any earlier demo adapters). Do not change the JakedUp or OpenScrapers packages.
2. Paste `https://velasource-demo-api.ryajohns1.workers.dev/vendor-v4.json` and tap **Check vendor URL**.
3. Import **VelaSource Express Adapter v4**.
4. Confirm **Settings → Sources → Vendors**, then search for **Big Buck Bunny (2008)**.
5. Tap **Look again** and view Diagnostics.

**Expected:** one found candidate from the VelaSource test provider, zero or one displayed depending on Premiumize cache eligibility. The normal HTTPS sample video is not guaranteed to be Premiumize-cached.

You may directly inspect `https://velasource-demo-api.ryajohns1.workers.dev/package-v4.json` to see an inline `_manifest` and `velasource` Express definition.

## Independent verification

`scripts/smoke-remote.mjs` exercises the exact public vendor → package/definition → search chain via GitHub Actions and asserts one matching licensed result, zero unrelated results, JSON content type and v4 metadata. This does not test an iPhone's network or Premiumize cache status.

The Worker is a read-only demo. It makes no arbitrary origin fetches, receives no debrid credentials and does not bypass Ovrelixa's Premiumize filtering.

Source license for test movie: *Big Buck Bunny*, Blender Foundation (2008), CC BY 3.0.
