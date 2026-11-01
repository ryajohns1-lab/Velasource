# VelaSource

Independent source-search engine and hosted **Ovrelixa Express adapter**. VelaSource is separate from the Ovrelixa movie app: no app source code, APK publishing, or authentication settings were modified.

## Current test package — VelaSource v6 (licensed movie discovery)

Use this address in **Ovrelixa → Settings → Vendors**:

`https://velasource-demo-api.ryajohns1.workers.dev/syncler/v6/vendor/`

Choose **Check vendor URL** and import **VelaSource — Archive Express v6**. First remove the old v5 demonstration package from Vendors; the new package must be explicitly imported. Leave your other vendors unchanged.

This version goes beyond the static Big Buck Bunny demo. It searches the **Internet Archive's movie catalog**, inspects matching records for an explicit Creative Commons/public-domain license, checks title and year, then retrieves item metadata to select a movie file. It will not fabricate TV episode matches or search unlicensed catalog items. License claims are metadata supplied to the Archive; verify rights independently if planning distribution or reuse.

The adapter uses the same three-stage format verified from JakedUp's public vendor package:
- Vendor: `https://velasource-demo-api.ryajohns1.workers.dev/syncler/v6/vendor/`
- Express manifest: `https://velasource-demo-api.ryajohns1.workers.dev/syncler/v6/manifest`
- Provider definition: `https://velasource-demo-api.ryajohns1.workers.dev/syncler/v6/express`
- Live public catalog search: `https://velasource-demo-api.ryajohns1.workers.dev/v6/search?kind=movie&title=Sintel&year=2010`
- Independent external [GitHub Actions test](https://github.com/ryajohns1-lab/Velasource/actions/runs/41333003683)

### Verified external tests

After correcting a quality-label matching issue and numeric-year parsing, an independent GitHub runner confirmed live, license-labelled candidates:

| Licensed film | Archive candidates returned |
|---|---:|
| *Sintel* (2010) | 3 |
| *Big Buck Bunny* (2008) | 3 |
| *Elephants Dream* (2006) | 3 |

These are genuine catalog items and metadata-resolved files, **not guaranteed playable links in Ovrelixa**: Ovrelixa only offers **Premiumize-confirmed cached sources**, and ordinary Internet Archive HTTPS videos may show *N returned candidates / 0 Premiumize cached*. That is intentional and is not a vendor-import failure.

### Older tested package

The v5 JakedUp-format, one-film compatibility test is still available at `https://velasource-demo-api.ryajohns1.workers.dev/syncler/vendor/`. Leave it installed if you need to compare the previous test.

## Standalone VelaSource Node engine (v0.3.0)

The separately supplied ZIP contains the original Node.js engine, a new `src/providers/internet-archive.mjs` provider, owner-configured remote-JSON provider support, metadata matching, parallel search, TTL caches and provider health/circuit breakers. The standalone package passes **21 local automated tests**. The full Node engine **is not deployed** by this Worker, which contains a compact independent implementation of the licensed Archive connector; GitHub only contains this Worker and its integration tests until the source ZIP is uploaded here.

The standalone engine needs Node 22+, configuration, and a suitable Node-capable host to run independently. The Worker is sufficient for testing the licensed archive provider via Ovrelixa.

All v6 provider traffic is read-only and does not receive Premiumize credentials, scrape arbitrary websites, or bypass Ovrelixa source filtering. The [Syncler starter](https://github.com/synclerd/package-starter) and [JakedUp's package](https://github.com/JakedUp/Syncler-Packages) were format references only.
