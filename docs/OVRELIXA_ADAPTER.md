# VelaSource v6 adapter — live licensed movie catalog

**Purpose:** a separate test environment to prove that Ovrelixa can load an independently hosted Express package backed by real external movie catalog searches. Ovrelixa is unchanged.

## Import

Enter `https://velasource-demo-api.ryajohns1.workers.dev/syncler/v6/vendor/` in **Settings → Vendors**, then check and import the **VelaSource — Archive Express v6** package. Select Vendors as the active search source. To see positive test results, search *Sintel (2010)*, *Big Buck Bunny (2008)* or *Elephants Dream (2006)*. Tap Diagnostics to inspect returned candidates.

## Architecture

VelaSource v6 is hosted as a Cloudflare Worker. It exposes a three-step Express package flow matching JakedUp's verified public format: catalog → manifest (`classPath`, `permaUrl`, `type:express`) → provider rules. The rules point to the separate `/v6/search` endpoint. We confirmed every step from a separate GitHub Actions runner.

The search is restricted to Archive movie items with explicit CC/public-domain license metadata. Film title and year must match within a bounded confidence threshold, known resolution/codec suffixes are removed for comparisons, and the selected item metadata must contain a real video file. Queries are limited, parallel metadata requests have timeouts, and successful queries are cached briefly.

**Important:** Archive licensing information is uploader-provided metadata, not a legal certification. This connector is for authorized/public media and should not be used to imply rights to distribute third-party files.

## Source eligibility

Ovrelixa's existing Premiumize-only policy stays in place. Its source picker may display **0 streams even when Diagnostics says 1–3 returned candidates** because a normal HTTPS Archive file is not necessarily Premiumize-cached. Do not change or bypass this behavior for a test.

## Test record

- GitHub Actions v6 external integration run [41333003683](https://github.com/ryajohns1-lab/Velasource/actions/runs/41333003683), attempt 3: success.
- Test titles: Sintel, Big Buck Bunny, Elephants Dream; three candidates each at test time.
- v5 one-film demo remains available; v6 does not change v5 routes.
- Standalone Node v0.3 ZIP: separate artifact with 21 passing local tests, and pluggable authorized remote JSON endpoints. It is not currently deployed.
