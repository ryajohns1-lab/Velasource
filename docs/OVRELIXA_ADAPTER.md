# VelaSource → Ovrelixa (Express JSON adapter)

The [Syncler package starter](https://github.com/synclerd/package-starter) is a **format reference**, not a package to install. VelaSource is a separate independent engine. Ovrelixa's restricted Express JSON interpreter does not run downloaded scripts.

## Install the smoke test

1. Open **Ovrelixa → Settings → Vendors**.
2. If the previous **VelaSource Demo Express Adapter** is installed, remove it (and the old VelaSource vendor if necessary).
3. Add `https://raw.githubusercontent.com/ryajohns1-lab/Velasource/main/manifest.vendor.json`, then **Check vendor URL**, **Import** `VelaSource Express Adapter`.
4. In **Settings → Sources**, select **Vendors** and make sure Premiumize is connected.
5. To test the provider adapter, search for **Big Buck Bunny (2008)**, not an unrelated movie. Open **Diagnostics** to inspect the provider response.

The public smoke-test endpoint is `https://velasource-demo-api.ryajohns1.workers.dev/search?kind=movie&title=Big%20Buck%20Bunny` and health check is `https://velasource-demo-api.ryajohns1.workers.dev/health`. It returns **one** CC BY 3.0 video source for the specifically matched sample title and zero for unrelated titles. No unauthorized sites are scraped. It **does not** mean that the Ovrelixa picker will show a playable source: Ovrelixa independently filters all Vendors candidates to **Premiumize-cached** entries. A regular HTTPS demo MP4 may legitimately yield `1 returned candidate; 0 cached` and no picker rows. Do not bypass that gate.

### Hosted versus standalone

Cloudflare hosts a separate **smoke-test adapter only**, not the full Node search engine. The complete VelaSource Node.js source is supplied separately as a project ZIP, and should be uploaded into this repository's root if you want GitHub to contain that implementation. The full engine's `src/server.mjs` exposes `/v1/express/search`, using its provider concurrency, title matching, ranking and caching. Deploy the Node service on a trusted HTTPS host with your authorized provider endpoints before changing the adapter `base_url`.

For production, switch `express.json` `base_url` to the hosted Node service (and the query path to `v1/express/search`), bump the version numbers in `express.json` and `manifest.package.json`, and remove/re-import the package on testing devices.

**Attribution:** *Big Buck Bunny*, © 2008 Blender Foundation / www.bigbuckbunny.org, [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/). Playback URL: https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4
