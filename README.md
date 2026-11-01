# VelaSource

VelaSource is a separate standalone source-search engine prototype, **not part of Ovrelixa**. The complete Node.js prototype is available separately in the owner's `VelaSource_Standalone_Prototype_v0.1.0` archive and has **not been deployed here yet**.

## Ovrelixa Vendors — import-only test

To test that Ovrelixa can discover and import a VelaSource vendor, enter:

```
https://raw.githubusercontent.com/ryajohns1-lab/Velasource/main/manifest.vendor.json
```

Navigate to **Ovrelixa → Settings → Vendors**, paste the URL, choose **Check vendor URL**, then **Import** the listed Express adapter.

**This is an import compatibility demo, not a live scraper.** The demo provider deliberately returns an empty source list. It does not query any indexes, produce playable files, access Premiumize, or start the VelaSource Node server. GitHub hosts the JSON metadata but does not execute the Node backend.

## Where to upload the complete standalone source

Extract the original ZIP and copy its **contents**, not the enclosing `VelaSource/` directory, to this repo root. The intended layout includes `src/`, `config/`, `data/`, `docs/`, `tests/`, `package.json`, `README.md`, and `LICENSE`. Preserve the `manifest.vendor.json`, `manifest.package.json`, and `express.json` demo files if you still want the test import URL.

When real, authorized providers are configured, deploy the Node service behind HTTPS with authentication and rate limiting, then build a compatible live adapter for Ovrelixa's limited Express JSON source engine or explicitly add support for the VelaSource API. A raw GitHub URL alone is not a backend.
