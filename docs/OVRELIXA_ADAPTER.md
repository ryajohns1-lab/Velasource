# VelaSource v5 — JakedUp-compatible Express package

**No Ovrelixa changes.** This adapter is independently deployed in Cloudflare.

## Background

The iPhone imported v3 and v4 but reported `Package manifest: error (Cannot load Express definition)`. That error comes from Ovrelixa attempting to retrieve and parse the provider definition, *before* searching and before Premiumize cache checks.

The v3 definition used GitHub Raw and the v4 definition used a one-file inline `_manifest` shortcut. The v5 experiment follows the observed live JakedUp endpoints and metadata fields precisely:

| Stage | JakedUp | VelaSource v5 |
|---|---|---|
| Vendor catalog | `/syncler/vendor` | `https://velasource-demo-api.ryajohns1.workers.dev/syncler/vendor/` |
| Express manifest | `/syncler/express/manifest` | `https://velasource-demo-api.ryajohns1.workers.dev/syncler/express/manifest` |
| Provider definition | `/syncler/express` | `https://velasource-demo-api.ryajohns1.workers.dev/syncler/express` |

VelaSource's Express manifest includes `name`, `id`, `version:5`, `classPath:""`, `permaUrl`, and `type:"express"`. Its `permaUrl` serves the `_manifest` + `velasource` rule object. All URLs are HTTPS and hosted on the same Cloudflare origin.

## Test

Remove the old v4 adapter, install `https://velasource-demo-api.ryajohns1.workers.dev/syncler/vendor/`, select Vendors and search for *Big Buck Bunny (2008)*. Open Diagnostics. If there is one `found` candidate but zero cached, the adapter is working and the remaining behavior is Ovrelixa's Premiumize-only filter. If the same definition error remains, the next useful evidence is the specific iOS fetch/HTTP failure; do not bypass security restrictions or change Ovrelixa solely for this smoke test.

[View independent API test](https://github.com/ryajohns1-lab/Velasource/actions/runs/41332037445). Only the freely licensed *Big Buck Bunny* (2008; © Blender Foundation, CC BY 3.0) is returned.
