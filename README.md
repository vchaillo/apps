# Apps

A lightweight directory of Valentin Chaillou's published GitHub Pages projects. Static HTML, CSS and JavaScript, with no build dependencies or backend.

## Development

```sh
python3 -m http.server 8000
```

Open http://localhost:8000. Use a local server: fetching `projects.json` from a `file://` URL is not supported by browsers.

## Catalog

Edit `projects.json` to add, reorder, update or remove projects. Array order determines display order. Required fields: `id`, `name`, `description`, `category`, `url`, `repository`. Optional fields: `icon`, `status`, `note`. IDs must be unique and URLs must use HTTPS.

```json
{
  "id": "my-app",
  "name": "My App",
  "icon": "🛠️",
  "category": "Outils",
  "description": "A short description for people using the app.",
  "url": "https://vchaillo.github.io/my-app/",
  "repository": "https://github.com/vchaillo/my-app"
}
```

Validate changes with:

```sh
node --check app.js
node scripts/validate-catalog.mjs
```

The catalog uses textContent rather than injecting HTML. Cards open apps in the same tab so Back returns to the directory. The directory does not read or modify data stored by the other applications.

## Deployment

Create the public repository `vchaillo/apps`, push these files to `main`, then select **GitHub Actions** in **Settings → Pages**. Each push validates the catalog and publishes only the static site files. The expected URL is https://vchaillo.github.io/apps/.

## Links between projects

Add this small link to each application's existing navigation when convenient:

```html
<a href="https://vchaillo.github.io/apps/">Toutes les applications</a>
```

## Initial inventory

All 43 repositories accessible under `vchaillo` were checked on 2026-10-06. Seven had GitHub Pages enabled, and all seven default published URLs returned HTTP 200. The catalog includes all seven: Year Tracker, Classroom Map, MimXpressions, Life Calendar, Timelines, the current portfolio, and its previous version under `/vchaillo/`.

Life Calendar and Timelines are labeled prototypes based on their current source. A successful HTTP response verifies availability of the page, not every application feature. No private repository is included. The catalog is intentionally maintained manually; it makes no GitHub API calls at runtime.
