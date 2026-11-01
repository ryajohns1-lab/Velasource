# VelaSource → Ovrelixa (Express JSON adapter)

The [Syncler package starter](https://github.com/synclerd/package-starter) is a **format reference**, not a package to install. VelaSource is a separate independent engine. Ovrelixa's restricted Express JSON interpreter does not run downloaded scripts.

## Install the smoke test

1. Open **Ovrelixa → Settings → Vendors**.
2. Remove any older VelaSource demo/adapter package from **Vendors** (the v1 demo deliberately returned an empty list).
3. Add `https://raw.githubusercontent.com/ryajohns1-lab/Velasource/main/vendor-v3.json`, then **Check vendor URL**, **Import** `VelaSource Express Adapter v3`.
4. In **Settings → Sources**, select **Vendors** and make sure Premiumize is connected.
5. To test the provider adapter, search for **Big Buck Bunny (2008)**, not an unrelated movie. Open **Diagnostics** to inspect the provider response.

The public smoke-test endpoint is `https://velasource-demo-api.ryajohns1.workers.dev/search?kind=movie&title=Big%20Buck%20Bunny` and health check is `https://velasource-demo-api.ryajohns1.workers.dev/health`. It returns **one** CC BY 3.0 video source for the specifically matched sample title and zero for unrelated titles. No unauthorized sites are scraped. It **does not** mean that the Ovrelixa picker will show a playable source: Ovrelixa independently filters all Vendors candidates to **Premiumize-cached** entries. A regular HTTPS demo MP4 may legitimately yield `1 returned candidate; 0 cached` and no picker rows. Do not bypass that gate.

### Hosted versus standalone

Cloudflare hosts a separate **smoke-test adapter only**, not the full Node search engine. The complete VelaSource Node.js source is supplied separately as a project ZIP, and should be uploaded into this repository's root if you want GitHub to contain that implementation. The full engine's `src/server.mjs` exposes `/v1/express/search`, using its provider concurrency, title matching, ranking and caching. Deploy the Node service on a trusted HTTPS host with your authorized provider endpoints before changing the adapter `base_url`.

For production, create a **new versioned definition URL** (for example `express-v4.json`) and change its `base_url` to the hosted Node service (and the query path to `v1/express/search`), bump the version numbers in the new definition and package manifests, and remove/re-import the package on testing devices.

**Attribution:** *Big Buck Bunny*, © 2008 Blender Foundation / www.bigbuckbunny.org, [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/). Playback URL: https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4

## Why v3 uses new filenames

Ovrelixa caches downloaded Express definitions by their exact URL for up to 45 minutes. Its **Look again** action clears only the title-search cache, not the provider-definition cache. The earlier v1 and v2 adapters reused `express.json`, so an already-running app could still search the previous *empty* demo. The new `vendor-v3.json` → `package-v3.json` → `express-v3.json` chain guarantees a different definition URL. **Remove the old VelaSource package and import the v3 vendor URL**, then test Big Buck Bunny. A successful provider result will be reported in Diagnostics as **1 returned candidate** before Premiumize cache filtering. Expect **0 Premiumize cached** for the ordinary CC-licensed HTTPS sample file; it is not a cached debrid link.

If the count remains zero, open **Diagnostics** and inspect the provider's status (empty, error, timeout, etc.), which distinguishes a nonmatching title from an unreachable API.
