# VelaSource v7 provider network — architecture and setup

## Purpose and scope

This repo hosts a read-only **authorized-media discovery network**, not a universal movie scraper. It deliberately excludes unlicensed torrent indexes and has no Premiumize or user credentials. Ovrelixa's Premiumize-cached-only policy is unchanged.

## Supported providers

**Internet Archive**: Search the `advancedsearch.php` API with title/film and a license filter. Verify item-level license, approximate year, title similarity and physical media filenames from `/metadata/{identifier}`. Prefer broadly playable MP4 over MKV/WebM when available. Metadata represents the uploader's assertion; review individual rights before distribution.

**Wikimedia Commons**: Search `commons.wikimedia.org/w/api.php` for video files. Require a machine-readable CC/public-domain `LicenseUrl`, a full-film title match, an allowed video filename, and `upload.wikimedia.org` HTTPS delivery URLs. Exclude excerpts, clips and trailers.

**Authorized Owner Feed**: Disabled until explicitly configured. Reads a finite JSON catalog from a deployment-time allowlisted HTTPS URL. Requires the configured feed host, media-host list, title/year match, and explicit CC license URL **or** owner attestation `rightsGranted:true`. TV results must also match exact numeric season and episode. The feed's owner is responsible for ensuring content rights. All direct media URLs returned by this public search API may become publicly visible; do not add private URLs without an access-control layer.

## Configuration — optional authorized feed

Cloudflare Worker `velasource-network-api` environment variables:

| Variable | Example | Purpose |
|---|---|---|
| `AUTHORIZED_FEED_URL` | `https://feed.example.com/catalog.json` | Fixed absolute HTTPS JSON URL |
| `AUTHORIZED_FEED_HOST` | `feed.example.com` | Exact allowed feed host |
| `AUTHORIZED_MEDIA_HOSTS` | `media.example.com,cdn.example.com` | Comma-separated approved delivery hosts |

No arbitrary request URL is accepted from the client. If any variable is missing or invalid, this provider remains disabled and the public endpoint reports `unconfigured`.

[Example JSON format](../config/authorized-feed.example.json). For TV items provide `kind:"episode"`, `season`, `episode`, a file URL, and verifiable rights. Private and credential-bearing streams require additional authentication before enabling such a feed.

## Reliability and performance

- Both public movie catalogs run **in parallel**, with bounded responses and upstream timeouts.
- Title matching normalizes punctuation, technical codec labels and year.
- Per-provider failures are reported separately; a failing upstream cannot erase another provider's successful results.
- Circuit breaker temporarily skips repeatedly failing providers.
- 120-second in-memory result cache, capped at 150 search keys. The authorized-feed cache is partitioned by its configured feed URL and allowed media domains.
- Direct links are deduplicated by media URL and ranked for confidence.
- `/v7/health` returns provider status and whether the authorized feed is configured.

Provider latency and availability fluctuate. A search returning zero candidates isn't automatically a parser error; inspect the `providers` array for `ok`, `error`, `circuit-open`, or `unconfigured`.

## Tests

[Live network integration](https://github.com/ryajohns1-lab/Velasource/actions/workflows/network-v7.yml) checks the vendor/manifest/definition chain (including trailing slashes), public catalog results, source allowlists, response shape, and cache. Isolated unit tests mock an owner feed to verify exact episode matching, invalid host and HTTP rejection, rights requirements and cache partitioning.

The separate previous [v6 adapter](https://velasource-demo-api.ryajohns1.workers.dev/syncler/v6/vendor/) remains operational. No change to Ovrelixa, other vendors, private APK publishing, or activation-code protection.
