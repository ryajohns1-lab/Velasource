# VelaSource

Independent provider-search engine prototype and a separately hosted **Ovrelixa Express adapter**. Ovrelixa's installed code, build and private APK delivery have **not** been changed.

## Current import URL (v4)

Paste this URL in **Ovrelixa → Settings → Vendors**:

`https://velasource-demo-api.ryajohns1.workers.dev/vendor-v4.json`

Select **Check vendor URL**, then **Import VelaSource Express Adapter v4**. Remove the old v3 package first.

The **vendor JSON, package manifest, and provider definition** now all come from the same Cloudflare Worker with `application/json` response headers. This avoids the former problem where the iPhone could recognize a package but report `Cannot load Express definition` when fetching a separate GitHub Raw definition.

- Live vendor: https://velasource-demo-api.ryajohns1.workers.dev/vendor-v4.json
- Package/definition (one file): https://velasource-demo-api.ryajohns1.workers.dev/package-v4.json
- Health: https://velasource-demo-api.ryajohns1.workers.dev/health
- Licensed sample search: https://velasource-demo-api.ryajohns1.workers.dev/search?kind=movie&title=Big%20Buck%20Bunny
- Automated external test: [GitHub Actions](https://github.com/ryajohns1-lab/Velasource/actions/workflows/adapter-smoke.yml)

The public smoke-test API returns **one candidate** for the Creative Commons film *Big Buck Bunny* (2008) and zero for unrelated titles. Ovrelixa's separate **Premiumize-only** gate may reject the normal HTTPS sample video, so one result in **Diagnostics** and zero playable streams can be expected.

This is **not** the fully deployed original VelaSource Node search engine. The separate source ZIP contains the full Node.js prototype and needs configuration and hosting for real authorized provider searches. GitHub does not execute Node backends.

The [Syncler package starter](https://github.com/synclerd/package-starter) was used only as a description of compatible Express metadata, not as executable code.

## Source

The worker source is in [worker/velasource-demo-api.mjs](worker/velasource-demo-api.mjs); [scripts/smoke-remote.mjs](scripts/smoke-remote.mjs) tests the deployed API from GitHub Actions. See [documentation](docs/OVRELIXA_ADAPTER.md).
