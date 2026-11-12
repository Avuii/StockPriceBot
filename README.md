<p align="center">
  <img src="docs/logo.png" alt="StockPriceBot logo" width="180" />
</p>

<h1 align="center">StockPriceBot</h1>

<p align="center">
  <strong>Track product prices and availability, manage your watchlist, and get notified when an offer matches your goals.</strong>
</p>

<p align="center">
  <a href="https://avuii.github.io/StockPriceBot/demo/">
    <img src="https://img.shields.io/badge/Live%20Demo-Open-EC4899?style=for-the-badge&logo=githubpages&logoColor=white" alt="Open the live demo" />
  </a>
  <img src="https://img.shields.io/badge/Status-Active%20Development-F59E0B?style=for-the-badge" alt="Status: Active development" />
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-All%20Rights%20Reserved-6B7280?style=for-the-badge" alt="All Rights Reserved" /></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-149ECA?style=for-the-badge&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/ASP.NET%20Core-512BD4?style=for-the-badge&logo=dotnet&logoColor=white" alt="ASP.NET Core" />
  <img src="https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Chrome%20Extension-111827?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Chrome Extension" />
</p>

<p align="center">
  <a href="https://avuii.github.io/StockPriceBot/demo/"><strong>Live Demo</strong></a> ·
  <a href="#getting-started"><strong>Getting Started</strong></a> ·
  <a href="https://github.com/Avuii/StockPriceBot/issues"><strong>Report an Issue</strong></a>
</p>

---

## Application Preview

<p align="center">
  <a href="docs/dashboard.png">
    <img src="docs/dashboard.png" alt="StockPriceBot dashboard showing tracked products, price changes, and monitoring statistics" width="70%" />
  </a>
</p>

---

<p align="center">

| Product Management | Price Alerts |
|:---:|:---:|
| [<img src="docs/productswithpanel.png" alt="Product management with category panel" width="380" />](docs/productswithpanel.png) | [<img src="docs/alerts.png" alt="Price and availability alert management" width="380" />](docs/alerts.png) |

| Categories | Statistics |
|:---:|:---:|
| [<img src="docs/Categories.png" alt="Custom product categories" width="380" />](docs/Categories.png) | [<img src="docs/Statistics.png" alt="Product price and savings statistics" width="380" />](docs/Statistics.png) |

</p>

<details>
<summary><strong>More screenshots — watchlist, settings, and dark mode</strong></summary>

| Watchlist | Settings |
|:---:|:---:|
| [<img src="docs/watchlist.png" alt="Priority product watchlist" width="380" />](docs/watchlist.png) | [<img src="docs/settings.png" alt="Account and monitoring settings" width="380" />](docs/settings.png) |

| Dashboard Details | Products Without Category Panel |
|:---:|:---:|
| [<img src="docs/dashboard2.png" alt="Dashboard details" width="380" />](docs/dashboard2.png) | [<img src="docs/productswithoutpanel.png" alt="Expanded product list" width="380" />](docs/productswithoutpanel.png) |

| Category Management | Products by Category |
|:---:|:---:|
| [<img src="docs/Categories2.png" alt="Category editing" width="380" />](docs/Categories2.png) | [<img src="docs/Categories3.png" alt="Products grouped by category" width="380" />](docs/Categories3.png) |

| Statistics Details | Alert Settings |
|:---:|:---:|
| [<img src="docs/Statistics2.png" alt="Detailed monitoring statistics" width="380" />](docs/Statistics2.png) | [<img src="docs/settings2.png" alt="Notification preferences" width="380" />](docs/settings2.png) |

| Sign In | Dark Dashboard |
|:---:|:---:|
| [<img src="docs/loginpanel.png" alt="Sign-in screen" width="380" />](docs/loginpanel.png) | [<img src="docs/dark.png" alt="Dashboard in dark mode" width="380" />](docs/dark.png) |

| Dark Product View | Dark Statistics |
|:---:|:---:|
| [<img src="docs/dark2.png" alt="Products in dark mode" width="380" />](docs/dark2.png) | [<img src="docs/dark3.png" alt="Statistics in dark mode" width="380" />](docs/dark3.png) |


<p align="center">
  <a href="docs/dark4.png"><img src="docs/dark4.png" alt="Sign-in screen in dark mode" width="54%" /></a>
</p>

</details>

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Configuration & API](#configuration--api)
- [Testing & Security](#testing--security)
- [Project Status & Roadmap](#project-status--roadmap)
- [License](#license)
- [Author](#author)

## Overview

**StockPriceBot** is a full-stack price and stock monitoring application for products sold by online stores. It helps users follow price changes, monitor selected sizes or colors, and act on price drops or restocks without repeatedly checking product pages.

Users can add products directly from the React dashboard or capture details from an open store page using the Chrome extension. An ASP.NET Core API manages accounts and tracked products, while a Quartz.NET worker performs scheduled checks, stores monitoring history, and evaluates notification rules. The dashboard displays product status, price history, and statistics, with live updates through SignalR.

## Demo

The [interactive GitHub Pages demo](https://avuii.github.io/StockPriceBot/demo/) uses shared dashboard components, sample products, and a mock API. It can be explored without registering or running the backend.

<p align="center">
  <a href="https://avuii.github.io/StockPriceBot/demo/"><strong>Open StockPriceBot Demo →</strong></a>
</p>

> [!IMPORTANT]
> The public demo does **not** monitor real stores, run scheduled jobs, persist data in PostgreSQL, or send email alerts. These capabilities belong to the full application.


## Key Features

| Feature | Description |
|---|---|
| **Product Tracking** | Save products with URL, store, image, current and target prices, notes, category, and selected variants. |
| **Browser Extension** | Capture product information from store pages or manually select the price element. |
| **Scheduled Monitoring** | Run periodic checks and keep price, availability, and monitoring history. |
| **Price & Stock Alerts** | Detect target prices, percentage drops, restocks, and selected variant availability. |
| **Watchlist & Categories** | Prioritize products and organize them using custom categories, colors, and icons. |
| **Search & Bulk Operations** | Filter and manage multiple products, preview URL and CSV imports, retry failed rows, and export CSV. |
| **Store Comparisons** | Select equivalent tracked offers and compare prices, variants, availability, and check timestamps by currency. |
| **Analytics** | Explore price charts, recent alerts, potential savings, and recommendations based on observed prices. |
| **Personalization** | Responsive dashboard, light/dark themes, and Polish/English interface. |

The extraction pipeline checks for Shopify theme product JSON and WooCommerce product markup, then tries JSON-LD, metadata, and saved CSS selectors. When enabled, the Playwright fallback retries extraction against the rendered page if the HTTP response contains no usable price. The extension also supports manually selecting a price element.

Alerts can be configured with target prices, percentage thresholds, restock conditions, selected variants, daily email limits, and digest preferences.

## Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS |
| **UI & Charts** | Recharts, Lucide React |
| **Backend** | C#, ASP.NET Core 8 Web API, Entity Framework Core |
| **Database** | PostgreSQL |
| **Background Processing** | Quartz.NET |
| **Real-Time Communication** | SignalR |
| **Browser Extension** | Chrome Manifest V3, React, TypeScript, content scripts, service worker |
| **Notifications** | SMTP email, Telegram, and browser Web Push |
| **Infrastructure** | Docker Compose |
| **Demo** | React with a mock API and sample product data |

## Architecture

The full application separates the dashboard, browser extension, API, persistent storage, and monitoring worker. The public demo follows a separate mock-data path.

```mermaid
flowchart LR
    Extension[Chrome Extension] --> API[ASP.NET Core API]
    Dashboard[React Dashboard] <--> API
    API <--> DB[(PostgreSQL)]
    Worker[Quartz.NET Worker] <--> DB
    Worker --> Stores[Online Store Pages]
    Worker --> Mail[SMTP Email]
    API --> Hub[SignalR Hub]
    Hub --> Dashboard
    Demo[GitHub Pages Demo] --> Mock[Mock API and Sample Data]
```

### Monitoring Flow

```mermaid
flowchart TD
    A[Add or capture a product] --> B[Save product and alert settings]
    B --> C[Scheduled monitoring check]
    C --> D{Page data readable?}
    D -- Yes --> E[Update price and availability history]
    D -- No --> F[Record monitoring error]
    E --> G{Alert condition met?}
    G -- Yes --> H[Record alert and notify user]
    G -- No --> I[Next scheduled check]
    H --> I
    F --> I
```

### Repository Structure

```text
StockPriceBot/
├── backend/
│   ├── src/
│   │   ├── PriceStockBot.Api/               # REST API, auth, SignalR
│   │   ├── PriceStockBot.Core/              # Domain models and alert rules
│   │   ├── PriceStockBot.Infrastructure/    # Persistence, extraction, email
│   │   └── PriceStockBot.Worker/            # Quartz.NET monitoring jobs
│   └── tests/PriceStockBot.Tests/           # Backend tests
├── frontend/
│   ├── dashboard/                           # React dashboard
│   └── extension/                           # Browser extension
├── demo/                                    # Independent GitHub Pages demo
├── docs/                                    # Logo and screenshots
├── .github/workflows/                       # Automation workflows
├── docker-compose.yml                       # Local services
├── .env.example                             # Example environment variables
├── .gitignore
├── LICENSE
└── README.md
```

## Getting Started

### Prerequisites

- Docker Desktop with Linux containers enabled.
- .NET 8 runtime and an SDK that supports the `.slnx` solution format, such as .NET SDK 10.
- Node.js 20 or newer and npm.
- Chrome or another Chromium-based browser for the extension.

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/Avuii/StockPriceBot.git
   cd StockPriceBot
   ```

2. Create the local environment configuration:

   **PowerShell**
   ```powershell
   Copy-Item .env.example .env
   ```

   **Bash**
   ```bash
   cp .env.example .env
   ```

3. Start PostgreSQL, the API, and the monitoring worker:

   ```bash
   docker compose up --build -d
   ```

4. Install dependencies and start the React dashboard:

   ```bash
   npm install --prefix frontend/dashboard
   npm run dev --prefix frontend/dashboard
   ```

5. Build the Chrome extension:

   ```bash
   npm install --prefix frontend/extension
   npm run build --prefix frontend/extension
   ```

   Open `chrome://extensions`, enable **Developer mode**, select **Load unpacked**, and choose `frontend/extension/dist`. Configure the API token from the dashboard settings if it has not synchronized automatically.

| Service | Default local address |
|---|---|
| Dashboard | `http://localhost:5187` |
| API | `http://localhost:5080` |
| PostgreSQL | `localhost:5432` |

The local API and worker apply EF Core migrations when they start in the documented development setup.

> [!TIP]
> If Docker reports a `dockerDesktopLinuxEngine` pipe error, start Docker Desktop and make sure the Linux engine is running before retrying.

### Run the Demo Locally

The interactive demo does not require Docker, PostgreSQL, or the extension:

```bash
npm install --prefix demo
npm run dev --prefix demo
```

Open the address shown by Vite in the terminal.

## Configuration & API

### Environment Variables

The root `.env` file contains local configuration for the application. SMTP credentials are only required to test or use real email notifications.

| Variable | Purpose |
|---|---|
| `EMAIL_ENABLED` | Enable or disable email delivery |
| `EMAIL_SMTP_HOST` | SMTP server hostname |
| `EMAIL_SMTP_PORT` | SMTP server port |
| `EMAIL_USERNAME` | SMTP account username |
| `EMAIL_PASSWORD` | SMTP password or provider-specific app password |
| `EMAIL_FROM` | Sender email address |
| `EMAIL_FROM_NAME` | Sender display name |
| `EMAIL_ENABLE_SSL` | Enable secure SMTP connection settings |

Example SMTP configuration:

```dotenv
EMAIL_ENABLED=true
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_USERNAME=your-sender@example.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=your-sender@example.com
EMAIL_FROM_NAME=StockPriceBot
EMAIL_ENABLE_SSL=true
```

The SMTP sender is configured at application level. Users configure a recipient address in the dashboard and can verify delivery with **Send test**.

> [!IMPORTANT]
> Keep `.env` and all real credentials out of version control. The committed `.env.example` must contain only placeholders or non-sensitive defaults. Do not expose tokens or SMTP credentials in frontend code.

### Rendered Store Pages

Set `PLAYWRIGHT_ENABLED=true` in `.env` and rebuild with `docker compose up --build -d`. Compose installs Chromium in both the API and worker images so previews and scheduled checks can use the fallback. For a native .NET run, build the API and worker, run either generated `playwright.ps1 install chromium` script, and set `Scraping__PlaywrightEnabled=true` for both processes. On Linux, add `--with-deps` to the install command when Chromium's system dependencies are missing.

Store fetches require publicly routable IPv4 on standard HTTP or HTTPS ports. The browser fallback has a time and request budget and may miss offers behind login, blocked automation, or complex browser interactions.

### Browser Notifications

Generate a VAPID key pair with `npx web-push generate-vapid-keys`. Set `WEB_PUSH_PUBLIC_KEY`, `WEB_PUSH_PRIVATE_KEY`, and `WEB_PUSH_SUBJECT` (for example, `mailto:alerts@example.com`) in `.env` and restart the API and worker. For native runs use the corresponding `Notifications__WebPush__PublicKey`, `Notifications__WebPush__PrivateKey`, and `Notifications__WebPush__Subject` settings. Both processes need the same stable keys.

On the HTTPS dashboard or localhost, open **Settings**, choose **Enable browser notifications**, and grant permission. Browser notifications use the existing product alert rules. Each browser subscribes separately.

### Import and Compare Offers

In **Products**, open **Import wishlist**. Paste whitespace-separated HTTP(S) URLs or upload a CSV with a `URL` header. CSV supports comma, semicolon, or tab separators and the dashboard's English and Polish export headers, including currency, prices, category, and variants. Review the valid and skipped rows before importing. A failed row can be retried from the same dialog. An active product imported without a price is eligible for the next scheduled check.

Select two or more tracked offers for equivalent products and variants, then choose **Compare prices**. The dashboard groups prices by currency and highlights the lowest available price among checked offers in each group. Product details show a recommendation once there are observations from at least three prior days in the last 30 days. The recommendation uses the latest in-stock observation per day in the offer's current currency.

### API Reference

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/auth/register` | Register an account |
| `POST` | `/api/auth/login` | Sign in |
| `POST` | `/api/auth/forgot-password` | Request password reset |
| `POST` | `/api/auth/reset-password` | Reset a password |
| `GET` | `/api/auth/me` | Retrieve current account |
| `POST` | `/api/auth/logout` | Sign out |
| `GET` | `/api/account/settings` | Read account settings |
| `PATCH` | `/api/account/settings` | Update account settings |
| `POST` | `/api/account/settings/test-email` | Send a test email |
| `GET` | `/api/account/push/key` | Retrieve the VAPID public key |
| `PUT`, `DELETE` | `/api/account/push/subscription` | Enable or remove a browser subscription |
| `GET` | `/api/products` | List tracked products |
| `GET` | `/api/products/{id}` | Retrieve a tracked product |
| `POST` | `/api/products` | Add a product |
| `PATCH` | `/api/products/{id}` | Update product details |
| `DELETE` | `/api/products/{id}` | Delete a product |
| `GET` | `/api/products/{id}/history` | Retrieve monitoring history |
| `POST` | `/api/products/{id}/check` | Request a monitoring check |
| `POST` | `/api/products/preview` | Preview extracted product data |
| `GET` | `/api/categories` | List categories |
| `POST` | `/api/categories` | Create a category |
| `PATCH` | `/api/categories/{id}` | Update a category |
| `DELETE` | `/api/categories/{id}` | Delete a category |
| `GET` | `/api/dashboard/stats` | Retrieve dashboard statistics |

The SignalR hub is available at `/hubs/price-updates` in the full application. The public demo uses mock data rather than these endpoints.

## Testing & Security

### Build and Test Commands

Run backend tests from the repository root:

```bash
dotnet test PriceStockBot.slnx
```

Build the dashboard, extension, and standalone demo from the repository root:

```bash
npm run build --prefix frontend/dashboard
npm run build --prefix frontend/extension
npm run build --prefix demo
```

To build the GitHub Pages demo with the expected base path:

**PowerShell**
```powershell
Set-Location demo
$env:VITE_API_URL = 'demo://mock-api'
$env:VITE_BASE_PATH = '/StockPriceBot/demo/'
npm run build
Remove-Item Env:VITE_API_URL
Remove-Item Env:VITE_BASE_PATH
Set-Location ..
```

**Bash**
```bash
cd demo
VITE_API_URL=demo://mock-api VITE_BASE_PATH=/StockPriceBot/demo/ npm run build
cd ..
```

### Continuous Integration & Deployment

The [interactive demo](https://avuii.github.io/StockPriceBot/demo/) is published separately on GitHub Pages. The dashboard, backend, worker, database, and browser extension require the full application setup; the demo build alone does not verify those components.

The [Application tests workflow](.github/workflows/tests.yml) builds the dashboard and extension, then runs the backend tests and Chromium workflows. The browser tests exercise CSV import and retry, offer comparisons, price recommendations, browser subscription controls, and extension capture and submission using fixture store pages and API responses.

To run the browser tests locally, build the dashboard and extension with the default API URL, build the solution, then run these commands in PowerShell:

```powershell
./backend/tests/PriceStockBot.Tests/bin/Debug/net8.0/playwright.ps1 install chromium
$env:RUN_BROWSER_TESTS = '1'
dotnet test PriceStockBot.slnx --no-build
```

### Security & Privacy

| Area | Implementation |
|---|---|
| Account security | Token-based API authentication and PBKDF2 password hashing |
| Extension storage | API token saved locally with `chrome.storage` |
| Product data | Reads product-specific fields such as price, URL, store, image, availability, and visible variants |
| Store integrity | Does not replace affiliate links, change coupon codes, or modify store content |
| Credentials | SMTP secrets are provided by local backend configuration |

> [!NOTE]
> The extension needs to read product pages to capture product details. It is not designed to collect unrelated browsing content.

> [!WARNING]
> Stores may block automated requests, render prices dynamically, or change HTML selectors. Monitoring errors are recorded when reliable extraction is not possible; price checks are not guaranteed for every website.

## Project Status & Roadmap

**Current status: Active development.** The full-stack application has a dashboard, ASP.NET Core API, PostgreSQL storage, Quartz.NET worker, Chrome extension, and configurable email alerts. The separate GitHub Pages demo provides a simulated interface preview.

| Component | Status |
|---|---|
| React dashboard | Implemented |
| ASP.NET Core API and authentication | Implemented |
| PostgreSQL and scheduled monitoring | Implemented |
| Chrome extension | Implemented |
| Email alert flow | Implemented; SMTP configuration required |
| GitHub Pages demo | Available; simulated data |
| Automated testing | Backend and Chromium workflow tests |
| Full production deployment | Planned |

### Implemented

- [x] ASP.NET Core API with user accounts and token authentication.
- [x] PostgreSQL persistence and EF Core migrations.
- [x] React dashboard with responsive layouts and light/dark themes.
- [x] Chrome extension for capturing products and selecting price elements.
- [x] Product records with images, notes, categories, target prices, sizes, and colors.
- [x] Priority watchlist, sorting, filtering, bulk actions, CSV export, and wishlist import.
- [x] Scheduled checks using Quartz.NET and real-time dashboard updates through SignalR.
- [x] Price, availability, alert, and monitoring histories.
- [x] Price-drop, target-price, restock, and variant alerts with email preferences.
- [x] Custom categories with Lucide icons and colors.
- [x] Polish and English dashboard interface.
- [x] Standalone mock-data demo on GitHub Pages.
- [x] Backend parser and alert-rule tests.

- [x] Shopify and WooCommerce extraction with an optional Playwright fallback.
- [x] Browser notifications with VAPID configuration.
- [x] CSV import preview and per-row retry, cross-store comparison, and price-history recommendations.
- [x] Dashboard and extension Chromium workflow tests.

### Planned Improvements

- [ ] Deploy the full dashboard, API, worker, and database to production.

### Known Limitations

- Some stores block regular HTTP requests or require anti-bot challenges.
- Some JavaScript storefronts require interactions or authenticated sessions beyond the rendered price check.
- Site redesigns can invalidate stored CSS selectors.
- Variant detection requires the selected size or color to be discoverable on the page.
- Email delivery depends on valid SMTP configuration.
- The GitHub Pages demo does not perform real monitoring or send notifications.

## License

Copyright © 2026 [Avuii](https://github.com/Avuii). All rights reserved.

The project's original code, design, and content may not be copied,
modified, redistributed, or used commercially without prior written
permission, except where applicable law permits.

Previously released MIT-licensed versions remain covered by their original license.

Third-party materials retain their respective licenses.
See the [LICENSE](LICENSE) file for details.



## Author

Created and maintained by **[Avuii](https://github.com/Avuii)**.
