# VelaSource

A standalone movie/episode search engine prototype with a Syncler **Express JSON-compatible adapter for Ovrelixa**. This is independent of Ovrelixa; neither its player nor its private Cloudflare APK delivery was modified.

## Import into Ovrelixa

Enter this in **Settings → Vendors**:

`https://raw.githubusercontent.com/ryajohns1-lab/Velasource/main/vendor-v3.json`

Choose **Check vendor URL** and **Import VelaSource Express Adapter v3**. See [test steps and limitations](docs/OVRELIXA_ADAPTER.md).

## Current test status

- **Live hosted adapter:** `https://velasource-demo-api.ryajohns1.workers.dev/health`
- **Licensed test movie:** Big Buck Bunny (2008), CC BY 3.0. The API returns one candidate for this exact title, zero for other titles.
- **Vendors cache policy:** Ovrelixa requires Premiumize-cached media. A valid regular HTTPS demo video may appear in Diagnostics but not in the playable source list.
- **Not yet live:** The standalone Node.js search engine from `VelaSource_Standalone_Prototype_v0.1.0` is not hosted via this worker. Its original source has not yet been uploaded to this GitHub repository; uploading the project ZIP contents to the repository root is a separate step.

The current worker is deliberately read-only, with no debrid credentials and no arbitrary URL fetching. It is for verifying the Express package manifest and end-to-end import/search connectivity, **not an operational scraper network**.

## Source layout

The full source ZIP contains `src/`, `config/`, `data/`, `docs/`, `tests/`, `package.json` and `LICENSE`. Its Node 22+ service includes `/v1/express/search` and can host your independently configured authorized providers.

The Syncler [package-starter](https://github.com/synclerd/package-starter) was used only to understand the publishing format; its placeholder files are not imported or executed.
