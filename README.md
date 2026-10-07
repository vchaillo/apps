# GitHub Apps

A lightweight directory of Valentin Chaillou's published GitHub Pages projects. Static HTML, CSS and JavaScript, with no build dependencies or backend.

## Development

```sh
python3 -m http.server 8000
```

Open http://localhost:8000. Use a local server: fetching `projects.json` from a `file://` URL is not supported by browsers.

## Catalog

Edit `projects.json` to add, reorder, update or remove projects. Array order determines display order. Required fields: `id`, `name`, `description`, `category`, `url`, `repository`. Optional fields: `icon`, `status`, `summary`, `technologies` (string array), `screenshot` (HTTPS image URL), `categories` (string array). IDs must be unique and URLs must use HTTPS.

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

The catalog uses textContent rather than injecting HTML. Application buttons and header links open in a new tab with `noopener noreferrer`. Category tabs filter cards. Project tiles open an accessible detail dialog with a summary, technology list and optional screenshot. Both the project dialog and category manager support multiple categories and reassignment and custom categories; saved overrides persist in localStorage under `github-apps-category-overrides-v2` (migrated from `apps-category-overrides-v1`), per browser and device. Cancel and Escape discard the draft. Unassigned custom categories are not persisted. Changing `projects.json` updates defaults for all visitors; browser overrides take precedence. The directory does not read or modify data stored by the other applications.

## Deployment

Create the public repository `vchaillo/github-apps`, push these files to `main`, then select **GitHub Actions** in **Settings → Pages**. Each push validates the catalog and publishes only the static site files. The expected URL is https://vchaillo.github.io/github-apps/.

## Inventory

All 43 repositories accessible under `vchaillo` were checked on 2026-10-06. Seven had GitHub Pages enabled. The catalog includes six projects: Year Tracker, Classroom Map, MimXpressions, Life Calendar, Timelines and the portfolio. The GitHub profile statistics repository `vchaillo/vchaillo` is intentionally omitted.

Life Calendar and Timelines are labeled prototypes based on their source. No private repository is included. The catalog makes no GitHub API calls at runtime.
