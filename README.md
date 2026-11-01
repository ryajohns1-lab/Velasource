# VelaSource

Independent provider-search service for Ovrelixa's existing Syncler-compatible Express importer. **Ovrelixa itself is unchanged**; this service runs separately on Cloudflare Workers.

## New: VelaSource v7 provider network

Paste the following into **Ovrelixa → Settings → Vendors**, tap **Check vendor URL**, and import **VelaSource Network — Express v7**.

`https://velasource-network-api.ryajohns1.workers.dev/syncler/v7/vendor/`

v7 runs on a **separate Cloudflare Worker** to preserve the working v6 integration:

| Source | Live | Media | Notes |
|---|---|---|---|
| Internet Archive | Yes | Movies | Searches license-labelled titles and verifies metadata/video files |
| Wikimedia Commons | Yes | Movies | Uses MediaWiki API and per-file license metadata |
| Authorized Owner Feed | Not configured | Movies and TV episodes | Owner-controlled allowlisted HTTPS feed, with exact season/episode matching |

Both live catalog searches execute concurrently, then results are scored against title/year, filtered for license metadata and actual media files, deduplicated, and cached. Each provider has separate timeouts and failure isolation. The licensed-film sources are **not a broad commercial movie/TV index**.

**Test titles:** *Sintel (2010)*, *Big Buck Bunny (2008)*, and *Elephants Dream (2006)*. On a successful *Sintel* network test, Internet Archive returned three candidates and Wikimedia Commons returned one. See [v7 end-to-end tests](https://github.com/ryajohns1-lab/Velasource/actions/workflows/network-v7.yml).

### Crucial distinction: candidate results vs. playable sources

Ovrelixa accepts only **Premiumize-confirmed cached sources** from Vendors. VelaSource searches public, license-labelled media and returns candidate HTTPS files; **the source picker may still be empty** if Premiumize doesn't report them as cached. No changes were made to that gate and VelaSource does not bypass it. Provider reports from v7 tell you which upstream source responded successfully.

### Live endpoints

- Vendor catalog: `https://velasource-network-api.ryajohns1.workers.dev/syncler/v7/vendor/`
- Express package manifest: `https://velasource-network-api.ryajohns1.workers.dev/syncler/v7/manifest`
- Provider definition: `https://velasource-network-api.ryajohns1.workers.dev/syncler/v7/express`
- Movie search API: `https://velasource-network-api.ryajohns1.workers.dev/v7/search?kind=movie&title=Sintel&year=2010`
- Provider health: `https://velasource-network-api.ryajohns1.workers.dev/v7/health`

Every manifest endpoint supports both URL forms, with and without a trailing slash.

## Adding authorized sources and series

See [Provider network documentation](docs/PROVIDER_NETWORK.md) and [the example authorized feed](config/authorized-feed.example.json). The feed connector is disabled unless `AUTHORIZED_FEED_URL`, `AUTHORIZED_FEED_HOST`, and `AUTHORIZED_MEDIA_HOSTS` are supplied on the Worker deployment. Its tests verify title/year, season and episode, HTTPS-only URLs, license/owner-authorization metadata and allowed hosts. Do **not** configure private commercial media URLs on a publicly accessible Worker without introducing an access-control layer.

## Existing versions

The proven v6 Archive-only vendor remains available at `https://velasource-demo-api.ryajohns1.workers.dev/syncler/v6/vendor/`. The v5 single-film compatibility test also remains on that old Worker. Neither was replaced by v7.

The separately supplied v0.3 Node ZIP remains an independent full-engine prototype and **has not been uploaded to this repository or automatically deployed**. The deployed v7 Worker is the maintained, independently testable network implementation.

The [Syncler package-starter](https://github.com/synclerd/package-starter) and [JakedUp vendor manifest](https://jakedup.com/syncler/vendor) were used as file-format references only. No third-party scraper packages are bundled or executed here.
