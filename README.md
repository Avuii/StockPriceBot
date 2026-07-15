<p align="center">
  <img src="docs/logo.png" alt="StockPriceBot logo" width="180" />
</p>

<h1 align="center">StockPriceBot</h1>

<p align="center">
  <strong>Product price and availability monitoring with a browser extension, web dashboard, and automated alerts.</strong>
</p>

<p align="center">
  <img
    src="https://img.shields.io/badge/status-active%20development-F59E0B?style=for-the-badge"
    alt="Status: active development"
  />
  <img
    src="https://img.shields.io/badge/Browser%20Extension-111827?style=for-the-badge&logo=googlechrome&logoColor=white"
    alt="Browser extension"
  />
  <img
    src="https://img.shields.io/badge/ASP.NET%20Core-512BD4?style=for-the-badge&logo=dotnet&logoColor=white"
    alt="ASP.NET Core"
  />
  <img
    src="https://img.shields.io/badge/React-2563EB?style=for-the-badge&logo=react&logoColor=white"
    alt="React"
  />
  <img
    src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white"
    alt="TypeScript"
  />
  <img
    src="https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white"
    alt="PostgreSQL"
  />
  <img
    src="https://img.shields.io/badge/MIT-22C55E?style=for-the-badge&logo=opensourceinitiative&logoColor=white"
    alt="MIT License"
  />
</p>

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Interface Preview](#interface-preview)
- [Architecture](#architecture)
- [How It Works](#how-it-works)
- [Tech Stack](#tech-stack)
- [Repository Structure](#repository-structure)
- [Getting Started](#getting-started)
- [Email Configuration](#email-configuration)
- [Product Data Extraction](#product-data-extraction)
- [Alerts](#alerts)
- [API Overview](#api-overview)
- [Testing and Build](#testing-and-build)
- [Privacy and Transparency](#privacy-and-transparency)
- [Known Limitations](#known-limitations)
- [Roadmap](#roadmap)
- [Project Status](#project-status)
- [License](#license)
- [Author](#author)

---

## Overview

**StockPriceBot** is a full-stack application for tracking product prices, availability, and selected variants across online stores.

Users can add a product manually from the dashboard or capture it directly from the currently opened product page with the Chrome extension. The system then checks the product at scheduled intervals, stores its history, evaluates alert rules, and sends an email when a relevant change occurs.

The project combines:

- a **React dashboard** for managing products, categories, alerts, and account settings,
- a **Chrome extension** for collecting product data from store pages,
- an **ASP.NET Core API** for authentication and application operations,
- a **Quartz.NET worker** for scheduled monitoring,
- a **PostgreSQL database** for persistent data and history,
- and **email notifications** for price and availability events.

### Static Demo

A lightweight GitHub Pages preview is available in the [`demo/`](demo/) directory. It uses screenshots from `docs/` and does not require the backend, database, package installation, or a build step.

After GitHub Pages is enabled for the repository root, the demo can be published at:

```text
https://<your-username>.github.io/StockPriceBot/demo/
```

Publishing instructions are available in [`demo/README.md`](demo/README.md).

---

## Key Features

### Product Monitoring

- Add products from the dashboard or browser extension.
- Track product URL, store, image, category, current price, and target price.
- Save product variants such as size and color.
- Add personal notes and enable or pause monitoring.
- Store price, availability, alert, and monitoring history.
- Display product health states such as successful check, selector issue, blocked store, or unreadable page.

### Organization and Discovery

- Create custom categories with Lucide icons and colors.
- Use list or image-based product views.
- Search, filter, and sort tracked products.
- Perform bulk actions.
- Maintain a separate watchlist for high-priority products.
- Import wishlist data and export products to CSV.

### Alerts and Insights

- Receive alerts when a product reaches its target price.
- Receive notifications after a configured percentage price drop.
- Detect back-in-stock events.
- Monitor selected size and color variants.
- Review recent alerts, price history, savings, statistics, and top opportunities.
- Configure anti-spam rules and daily notification limits.

### User Experience

- Responsive React dashboard.
- Light and dark themes with a consistent visual identity.
- Polish and English interface support.
- Clear privacy information about data read by the browser extension.

---

## Interface Preview

The images below are compact previews. Full-size screenshots are available in the [`docs/`](docs/) directory.

| Dashboard | Product Management |
| --- | --- |
| <img src="docs/dashboard.png" alt="StockPriceBot dashboard" width="380" /> | <img src="docs/productswithpanel.png" alt="Tracked products with category panel" width="380" /> |

| Categories | Alerts |
| --- | --- |
| <img src="docs/Categories.png" alt="Product categories" width="380" /> | <img src="docs/alerts.png" alt="Price and availability alerts" width="380" /> |

| Statistics | Settings |
| --- | --- |
| <img src="docs/Statistics.png" alt="Product monitoring statistics" width="380" /> | <img src="docs/settings.png" alt="Account and application settings" width="380" /> |

<details>
<summary><strong>Show additional screenshots</strong></summary>

<br />

| Dashboard Details | Products Without Panel |
| --- | --- |
| <img src="docs/dashboard2.png" alt="Dashboard details" width="380" /> | <img src="docs/productswithoutpanel.png" alt="Products without category panel" width="380" /> |

| Watchlist | Category Management |
| --- | --- |
| <img src="docs/watchlist.png" alt="Product watchlist" width="380" /> | <img src="docs/Categories2.png" alt="Category management" width="380" /> |

| Products by Category | Statistics Details |
| --- | --- |
| <img src="docs/Categories3.png" alt="Products grouped by category" width="380" /> | <img src="docs/Statistics2.png" alt="Detailed monitoring statistics" width="380" /> |

| Alert Settings | Login |
| --- | --- |
| <img src="docs/settings2.png" alt="Alert settings" width="380" /> | <img src="docs/loginpanel.png" alt="Login panel" width="380" /> |

| Dark Dashboard | Dark Product View |
| --- | --- |
| <img src="docs/dark.png" alt="Dashboard in dark theme" width="380" /> | <img src="docs/dark2.png" alt="Product view in dark theme" width="380" /> |

| Dark Statistics | Dark Login |
| --- | --- |
| <img src="docs/dark3.png" alt="Statistics in dark theme" width="380" /> | <img src="docs/dark4.png" alt="Login panel in dark theme" width="380" /> |

</details>

---

## Architecture

```mermaid
flowchart LR
    Extension["Chrome Extension"] --> API["ASP.NET Core API"]
    Dashboard["React Dashboard"] <--> API
    API <--> DB[("PostgreSQL")]
    Worker["Quartz.NET Worker"] <--> DB
    Worker --> Stores["Product Pages"]
    Worker --> Mail["Email Notifications"]
    API --> Hub["SignalR Hub"]
    Hub --> Dashboard
```

### Component Responsibilities

| Component | Responsibility |
| --- | --- |
| Chrome Extension | Reads product data from the current page and sends it to the API. |
| React Dashboard | Manages products, categories, settings, history, alerts, and statistics. |
| ASP.NET Core API | Handles authentication, application operations, validation, and dashboard data. |
| Quartz.NET Worker | Runs scheduled checks, evaluates alert rules, and creates monitoring records. |
| PostgreSQL | Stores accounts, products, categories, histories, settings, and alert logs. |
| SignalR | Delivers live price and status updates to the dashboard. |
| SMTP Service | Sends price and availability notifications by email. |

---

## How It Works

1. The user opens a product page in a supported browser.
2. The Chrome extension detects the product name, price, image, store, availability, and visible variant information.
3. The user reviews the detected data, sets alert rules, and saves the product.
4. The API validates and stores the product in PostgreSQL.
5. The worker checks active products according to their configured refresh intervals.
6. Each successful check can update price history, availability history, and monitoring logs.
7. When an alert condition is met, the system records the event and sends an email notification.
8. The dashboard displays the latest product state and receives live updates through SignalR.

---

## Tech Stack

### Backend

- ASP.NET Core Web API
- Entity Framework Core
- PostgreSQL
- Quartz.NET
- SignalR
- PBKDF2 password hashing
- SMTP email notifications
- Docker Compose

### Dashboard

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Recharts
- Lucide React
- SignalR client

### Browser Extension

- Chrome Extension Manifest V3
- React
- TypeScript
- Content scripts
- Background service worker
- `chrome.storage` for local extension settings and token storage

---

## Repository Structure

```text
StockPriceBot/
├── backend/
│   ├── src/
│   │   ├── PriceStockBot.Api/              # HTTP endpoints, auth, SignalR, configuration
│   │   ├── PriceStockBot.Core/             # Domain models, alert rules, and ports
│   │   ├── PriceStockBot.Infrastructure/   # EF Core, extraction, email, services
│   │   └── PriceStockBot.Worker/           # Quartz.NET scheduled monitoring jobs
│   └── tests/
│       └── PriceStockBot.Tests/            # Parser and alert-rule tests
│
├── frontend/
│   ├── dashboard/
│   │   └── src/
│   │       ├── app/                        # App-level types and view helpers
│   │       └── components/
│   │           ├── categories/             # Category management
│   │           ├── charts/                 # Price and savings charts
│   │           ├── common/                 # Shared UI controls
│   │           ├── layout/                 # Navigation and application shell
│   │           ├── products/               # Cards, forms, filters, and details
│   │           └── settings/               # Account and notification settings
│   └── extension/
│       └── src/
│           ├── popup/                      # Extension popup interface
│           ├── background.ts               # Background service worker
│           └── content.ts                  # Product-page data extraction
│
├── demo/                                   # Static GitHub Pages preview
├── docs/                                   # Logo and interface screenshots
├── docker-compose.yml                      # PostgreSQL, API, and worker services
├── .env.example                            # Local environment template
├── LICENSE
└── README.md
```

---

## Getting Started

### Requirements

- Docker Desktop with the Linux engine enabled
- .NET SDK 8
- Node.js 20 or newer
- Chrome or another Chromium-based browser

### 1. Create the Local Environment File

PowerShell:

```powershell
Copy-Item .env.example .env
```

Bash:

```bash
cp .env.example .env
```

The default PostgreSQL values can be used for local development. SMTP variables are required only when testing email delivery.

### 2. Start the API, Worker, and Database

```bash
docker compose up --build
```

Default local services:

| Service | Address |
| --- | --- |
| API | `http://localhost:5080` |
| PostgreSQL | `localhost:5432` |

EF Core migrations are applied automatically when the API and worker start.

> [!TIP]
> If Docker reports a `dockerDesktopLinuxEngine` pipe error, open Docker Desktop and wait until the Linux engine is ready before running the command again.

### 3. Start the Dashboard

```bash
npm --prefix frontend/dashboard install
npm --prefix frontend/dashboard run dev
```

The default dashboard address is:

```text
http://localhost:5187
```

If the port is already in use, update the development script in `frontend/dashboard/package.json`.

### 4. Build and Load the Chrome Extension

```bash
npm --prefix frontend/extension install
npm --prefix frontend/extension run build
```

Then:

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Select **Load unpacked**.
4. Choose `frontend/extension/dist`.
5. Open the dashboard settings and copy the API token.
6. Paste the token into the extension if it was not synchronized automatically.

The extension attempts to detect the product name, price, image, URL, store, availability, size, color, and category suggestion. When automatic price detection fails, the user can select the price element manually.

---

## Email Configuration

The sender account is configured at application level. Individual users only provide the recipient address for alerts in the dashboard.

Example Gmail SMTP configuration:

```dotenv
EMAIL_ENABLED=true
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_USERNAME=stockpricebotalert@gmail.com
EMAIL_PASSWORD=google-app-password
EMAIL_FROM=stockpricebotalert@gmail.com
EMAIL_FROM_NAME=StockPriceBot
EMAIL_ENABLE_SSL=true
```

For Gmail, use a **Google App Password** instead of the regular account password. After configuring the alert address in the dashboard, use the **Send test** action to verify delivery.

> [!IMPORTANT]
> Never commit real credentials or application passwords. Store local secrets in `.env`, and keep that file excluded from version control.

---

## Product Data Extraction

Online stores expose product data in different formats, so StockPriceBot uses a layered extraction strategy.

### Extraction Order

1. JSON-LD and `schema.org/Product` data.
2. Open Graph and standard metadata.
3. CSS selectors detected or saved by the browser extension.
4. A manually selected price element.
5. A monitoring error state when the page cannot be read reliably.

### Monitoring Flow

The worker loads active products that are due for a check according to the refresh interval selected in account settings, such as every 15 minutes, 30 minutes, 1 hour, 3 hours, or once per day.

Each check can update:

- current price,
- availability,
- selected variant state,
- price history,
- availability history,
- monitoring status,
- and the latest readable error message.

---

## Alerts

Alerts can be triggered when:

- a product reaches or falls below its target price,
- the price drops by a configured percentage,
- an unavailable product returns to stock,
- a selected size or color becomes available,
- or the current price is close to the target price.

Available anti-spam controls include:

- minimum discount percentage,
- maximum emails per product per day,
- daily digest mode,
- selected-variant-only alerts,
- back-in-stock alerts,
- and below-target alerts.

---

## API Overview

```text
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
GET    /api/auth/me
POST   /api/auth/logout

GET    /api/account/settings
PATCH  /api/account/settings
POST   /api/account/settings/test-email

GET    /api/products
GET    /api/products/{id}
POST   /api/products
PATCH  /api/products/{id}
DELETE /api/products/{id}
GET    /api/products/{id}/history
POST   /api/products/{id}/check
POST   /api/products/preview

GET    /api/categories
POST   /api/categories
PATCH  /api/categories/{id}
DELETE /api/categories/{id}

GET    /api/dashboard/stats
GET    /hubs/price-updates
```

---

## Testing and Build

### Backend Tests

```bash
dotnet test
```

### Dashboard Production Build

```bash
npm --prefix frontend/dashboard run build
```

### Extension Production Build

```bash
npm --prefix frontend/extension run build
```

---

## Privacy and Transparency

The browser extension reads only the data needed to save and monitor a product:

- product name,
- current price,
- product image,
- product URL,
- store name,
- availability,
- selected size and color when detectable,
- and a user-selected price selector when manual selection is used.

The API token is stored locally with `chrome.storage` and is used only for communication with the StockPriceBot backend. The extension does not replace affiliate links, modify coupon codes, or alter store content.

Account passwords are stored as secure hashes and are never persisted as plain text.

---

## Known Limitations

- Some stores block regular HTTP requests or require anti-bot verification.
- JavaScript-heavy pages may not expose the final price in the initial HTML response.
- Product page changes can invalidate previously saved CSS selectors.
- Variant detection works best when the selected size or color is visible on the page.
- Email delivery requires valid SMTP configuration.
- A browser-rendering fallback for difficult pages is planned but is not yet part of the default monitoring pipeline.

When a page cannot be processed safely, StockPriceBot records a monitoring error instead of silently storing unreliable data.

---

## Roadmap

### Completed

- [x] ASP.NET Core API with user accounts and token authentication
- [x] PostgreSQL persistence with Entity Framework Core migrations
- [x] React dashboard with light and dark themes
- [x] Chrome extension for adding products from store pages
- [x] Product variants including size, color, category, note, and image
- [x] Backend-based watchlist
- [x] Price, availability, monitoring, and alert histories
- [x] Email alert settings and test email action
- [x] Category management with custom Lucide icons and colors
- [x] Search, filtering, sorting, bulk actions, CSV export, and wishlist import

### Planned

- [ ] Store-specific adapters for popular e-commerce platforms
- [ ] Playwright fallback for JavaScript-heavy pages
- [ ] Web push notifications
- [ ] Improved multi-URL and CSV import workflow
- [ ] End-to-end tests for dashboard and extension flows
- [ ] Production deployment on a low-cost cloud stack
- [ ] Cross-store product comparison
- [ ] Smarter recommendations based on price history

---

## Project Status

StockPriceBot is under **active development**.

The core full-stack architecture is in place, including the API, database, worker, dashboard, browser extension, and email notification flow. Current work focuses on improving extraction reliability, store compatibility, automated testing, and production deployment.

---

## License

This project is licensed under the **MIT License**. See the [`LICENSE`](LICENSE) file for details.

---

## Author

Created by **Katarzyna Stańczyk**
