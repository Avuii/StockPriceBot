# StockPriceBot Demo App

This is a separate demo application for GitHub Pages.

It is not the production dashboard and it does not talk to the .NET backend. It renders the same dashboard UI with shared React components from `frontend/dashboard/src`, but uses its own in-browser mock API from `demo/src/mockApi.ts`.

Product management, categories, watchlist, filters, settings, and product details stay interactive without requiring PostgreSQL, the API, the worker, or the browser extension.

## Preview Locally

From the repository root:

```powershell
Set-Location demo
npm install
$env:VITE_API_URL='demo://mock-api'
npm run dev
Remove-Item Env:VITE_API_URL
```

Then open the Vite URL shown in the terminal.

## Publish on GitHub Pages

The repository includes `.github/workflows/github-pages.yml`. The workflow builds this `demo/` project and deploys the output to `/demo/`.

1. Commit the `demo/`, `frontend/dashboard/`, and workflow files.
2. Push to `main`.
3. Go to repository `Settings`.
4. Open `Pages`.
5. Set `Source` to `GitHub Actions`.
6. Open:

```text
https://<your-username>.github.io/<repository-name>/demo/
```

For this repository:

```text
https://<your-username>.github.io/StockPriceBot/demo/
```
