<p align="center">
  <img src="docs/logo.png" alt="StockPriceBot Logo" width="180" />
</p>

<h1 align="center">StockPriceBot</h1>

<p align="center">
  <strong>Smart product price and stock monitoring with a browser extension, dashboard and automated alerts.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-active%20development-F59E0B?style=for-the-badge" alt="Status" />
  <img src="https://img.shields.io/badge/browser-extension-111827?style=for-the-badge" alt="Browser Extension" />
  <img src="https://img.shields.io/badge/backend-ASP.NET%20Core-512BD4?style=for-the-badge" alt="ASP.NET Core" />
  <img src="https://img.shields.io/badge/frontend-React%20%2B%20TypeScript-2563EB?style=for-the-badge" alt="React TypeScript" />
  <img src="https://img.shields.io/badge/database-PostgreSQL-336791?style=for-the-badge" alt="PostgreSQL" />
</p>

---

<a id="table-of-contents"></a>
## 📚 Table of Contents

- [Overview](#overview)
- [Problem](#problem)
- [Solution](#solution)
- [How It Works](#how-it-works)
- [Main Features](#main-features)
- [System Architecture](#system-architecture)
- [Browser Extension](#browser-extension)
- [Dashboard](#dashboard)
- [Backend](#backend)
- [Product Data Extraction Strategy](#product-data-extraction-strategy)
- [Example Product Card](#example-product-card)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Alert Types](#alert-types)
- [Roadmap](#roadmap)
- [Future Improvements](#future-improvements)
- [Project Status](#project-status)
- [License](#license)
- [Author](#author)

---

<a id="overview"></a>
## 🛒 Overview

**StockPriceBot** is a full-stack price and stock monitoring platform that helps users track selected products from online stores and receive notifications when the best buying moment appears.

The application combines a **browser extension**, a **backend API with scheduled product checks**, a **web dashboard**, and a **notification system**.

Users can visit a product page, add the product to their watchlist using the browser extension, set alert rules, and let the system automatically monitor price and availability changes.

---

<a id="problem"></a>
## ⚠️ Problem

Products often:

- go out of stock and return without any clear notification,
- change price frequently,
- become worth buying only after reaching a specific price threshold,
- require users to manually refresh product pages,
- cause users to miss good deals or restocks.

Example:

A user wants to buy a product only when its price drops to **50 PLN or less**.  
Instead of checking the page manually every day, StockPriceBot monitors the product automatically and sends an alert when the condition is met.

---

<a id="solution"></a>
## ✅ Solution

StockPriceBot allows users to track products from stores such as:

- Reserved,
- Zalando,
- Media Expert,
- Sephora,
- Empik,
- and other online shops.

The user opens a product page and clicks the browser extension button:

```txt
Watch this product
```

The extension detects and saves:

```txt
product name
current price
product URL
product image
stock availability
store name
```

Then the user defines alert conditions, for example:

```txt
Notify me when:
- the price drops to 50 PLN or less
- the product is back in stock
- the price drops by 20%
```

After that, the backend periodically checks the product and sends a notification when the selected condition is met.

---

<a id="how-it-works"></a>
## 🔄 How It Works

```txt
User opens product page
        |
        v
Browser extension detects product data
        |
        v
User sets alert conditions
        |
        v
Backend saves product and starts monitoring
        |
        v
Scheduler checks price and stock periodically
        |
        v
Dashboard displays current status and history
        |
        v
Notification is sent when an alert condition is met
```

---

<a id="main-features"></a>
## ✨ Main Features

Current MVP scope:

- add a product directly from the current browser tab,
- automatically detect product title, price, image, URL and availability,
- set a custom target price,
- monitor whether the product is available or out of stock,
- notify the user when the price drops below the selected threshold,
- notify the user when the product returns to stock,
- store product price history,
- display price changes on a chart,
- organize products into user-defined categories,
- edit or delete tracked products,
- view the last product check time,
- display alert status for every product.

---

<a id="system-architecture"></a>
## 🧱 System Architecture

```txt
[Browser Extension]
        |
        v
[Backend API + Scheduler]
        |
        v
[Dashboard Web App]
        |
        v
[Notifications]
```

The browser extension is used for quickly adding products from online stores.  
The backend handles persistent monitoring, scheduled checks and notifications.  
The dashboard gives the user a clear overview of tracked products, price history and active alerts.

---

<a id="browser-extension"></a>
## 🧩 Browser Extension

The browser extension is responsible for capturing product data from the currently opened page.

### MVP Features

- detect product title,
- detect current price,
- detect product image,
- detect product URL,
- detect stock availability,
- allow the user to set a target price,
- send the product to the backend API.

### Example Flow

```txt
1. User opens a product page.
2. User clicks the StockPriceBot extension icon.
3. The extension detects product data.
4. User enters a target price, for example 50 PLN.
5. User clicks "Save".
6. Product is added to the monitoring system.
```

### Example Extension Popup

```txt
StockPriceBot
────────────────────
Name: Nike Air Force 1
Price: 419 PLN
Status: In stock

[ Target price: 350 PLN ]

[x] Notify me when the price drops
[x] Notify me when the product is back in stock

[ Watch product ]
```

### Manual Selection Mode

If the extension cannot detect the price automatically, the user can manually select the price element on the page.

```txt
Price not detected.
Click the price on the page to select it manually.
```

The extension can then save a CSS selector, for example:

```txt
priceSelector = ".product-price"
stockSelector = ".availability"
```

This makes the system more flexible and allows it to support many different stores.

---

<a id="dashboard"></a>
## 📊 Dashboard

The dashboard is the main place for managing tracked products.

### Views

- tracked products list,
- product categories created by the user,
- current price,
- target alert price,
- availability status,
- price history,
- price chart,
- last checked time,
- alert status,
- edit target price,
- remove product.

### Dashboard Cards

The dashboard can include summary cards such as:

```txt
Tracked Products
Products In Stock
Products Below Target Price
Alerts Sent Today
```

### Product Details View

Each product can have a details page with:

- product image,
- current price,
- target price,
- availability status,
- store name,
- original product link,
- price history chart,
- alert configuration,
- last check date,
- notification history.

---

<a id="backend"></a>
## ⚙️ Backend

The backend is the core of the system.

It is responsible for:

- saving tracked products,
- storing user-defined categories,
- storing alert rules,
- checking product prices periodically,
- checking product availability,
- saving price history,
- detecting alert conditions,
- sending notifications,
- exposing API endpoints for the dashboard and extension.

The backend is required because the browser extension alone is not enough for reliable monitoring.  
If the browser is closed, the extension cannot consistently check products.  
The backend solves this by running scheduled checks independently.

---

<a id="product-data-extraction-strategy"></a>
## 🔎 Product Data Extraction Strategy

Different online stores use different HTML structures. Because of that, StockPriceBot should not rely on only one extraction method.

The extraction strategy is hybrid.

### Level 1: Saved Selectors

The extension can save CSS selectors from the product page.

Example:

```txt
priceSelector = ".product-price"
stockSelector = ".availability"
```

The backend can later use those selectors to read the same data from the page.

This approach is fast to implement, but it may break when the store changes its HTML structure.

### Level 2: Structured Product Data

Before relying on custom selectors, the system should try to read structured product data from:

```txt
JSON-LD
Open Graph tags
meta tags
schema.org/Product
```

Many stores expose product data in a structured format.

Example:

```json
{
  "@type": "Product",
  "name": "Example Product",
  "offers": {
    "price": "49.99",
    "availability": "InStock"
  }
}
```

This approach is more stable than guessing data from CSS classes.

### Level 3: Dynamic Pages

Some stores load prices dynamically using JavaScript.  
For those pages, the backend can use **Playwright** as a fallback.

Playwright opens the page like a real browser and reads the final rendered content.

### Final Extraction Order

```txt
1. Try JSON-LD / schema.org data
2. Try meta tags and Open Graph data
3. Try selectors saved by the browser extension
4. Use Playwright as a fallback for dynamic pages
```

---

<a id="example-product-card"></a>
## 🧾 Example Product Card

```txt
Nike Air Force 1

Current price: 419 PLN
Target price: 350 PLN
Status: In stock
Last checked: 2026-06-10 18:42
Alert status: Waiting
```

---

<a id="tech-stack"></a>
## 🛠️ Tech Stack

### Frontend Dashboard

```txt
React
TypeScript
Vite
TailwindCSS
Recharts
```

### Browser Extension

```txt
Chrome Extension
Manifest V3
React
TypeScript
Content Scripts
Background Service Worker
```

### Backend

```txt
ASP.NET Core Web API
Entity Framework Core
PostgreSQL
Hangfire or Quartz.NET
SignalR
Playwright
```

### Notifications

Notification channels planned for the application:

```txt
Telegram Bot
Email
Web Push Notifications
Discord Webhook
```

---

<a id="project-structure"></a>
## 📁 Project Structure

```txt
StockPriceBot/
├── backend/
│   ├── StockPriceBot.Api/
│   ├── StockPriceBot.Application/
│   ├── StockPriceBot.Domain/
│   └── StockPriceBot.Infrastructure/
│
├── dashboard/
│   └── React + TypeScript dashboard
│
├── extension/
│   └── Chrome Extension + React
│
├── docs/
│   └── logo.png
│
├── LICENSE
└── README.md
```

---

<a id="alert-types"></a>
## 🔔 Alert Types

Supported and planned alert rules:

```txt
price drops below target price
product is back in stock
price drops by selected percentage
any price change
```

Example conditions:

```txt
currentPrice <= targetPrice
oldStatus = OutOfStock and newStatus = InStock
oldPrice - newPrice >= selectedPercentage
oldPrice != newPrice
```

To avoid notification spam, the backend should store when an alert was last triggered.

---

<a id="roadmap"></a>
## 🗺️ Roadmap

### Stage 1: Backend and Database

- create ASP.NET Core Web API,
- configure PostgreSQL,
- create product, category, alert and history models,
- create CRUD endpoints for tracked products,
- create endpoints for browser extension.

### Stage 2: Dashboard

- create React dashboard,
- display tracked products,
- add product manually by URL,
- edit target price,
- delete product,
- create and manage categories.

### Stage 3: Product Checker

- implement price extraction service,
- implement availability extraction,
- save price history,
- run scheduled checks with Hangfire or Quartz.NET.

### Stage 4: Notifications

- add Telegram notifications,
- send alert when price is below target,
- send alert when product is back in stock,
- store notification history.

### Stage 5: Browser Extension

- create Manifest V3 extension,
- build popup UI,
- detect product data on the current page,
- send product data to the backend,
- support manual selector selection.

### Stage 6: Advanced Features

- add price charts,
- add SignalR live dashboard updates,
- add store-specific adapters,
- add Web Push notifications,
- add import and export of watchlists,
- add smarter alert rules.

---

<a id="future-improvements"></a>
## 🚀 Future Improvements

- store-specific adapters for popular shops,
- AI-assisted product data detection,
- automatic category suggestions,
- product comparison between stores,
- price drop probability insights,
- public product watchlists,
- shared wishlists,
- mobile-friendly dashboard,
- browser notification support,
- user accounts and authentication,
- deployment with Docker.

---

<a id="project-status"></a>
## 🟡 Project Status

StockPriceBot is currently under **active development**.

The project is being built as a practical full-stack application that solves a real everyday problem: missing price drops and product restocks.

---

<a id="license"></a>
## 📄 License

This project is licensed under the **MIT License**.

You are free to use, modify and distribute this project under the terms of the MIT License.  
See the `LICENSE` file for more details.

---

<a id="author"></a>
## 👩‍💻 Author

Created by **Katarzyna Stańczyk**.

