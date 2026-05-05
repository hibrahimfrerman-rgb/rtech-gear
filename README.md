# R-Tech Gear

This repo includes a separate internal admin dashboard app in [admin](/c:/rtech-gear/admin) built with React, Tailwind CSS, Recharts, and local mock data.

## Admin dashboard

The admin dashboard is for internal ecommerce operations, not the storefront. It includes:

- Dashboard KPIs, charts, recent orders, low stock alerts, and content gaps
- Products, variants, orders, inventory, payments, analytics, and settings/imports pages
- Parent product plus child variant data structure
- CSV preview/import support for `products`, `variants`, `orders`, and `inventory`
- CSV export buttons
- Demo data, empty states, and loading states

## Install

1. Install Node.js 20 or newer.
2. Open a terminal in [admin](/c:/rtech-gear/admin).
3. Run:

```bash
npm install
```

## Run locally

From [admin](/c:/rtech-gear/admin), start the dev server:

```bash
npm run dev
```

Vite will print a local URL, usually `http://localhost:5173`.

## Build for preview

From [admin](/c:/rtech-gear/admin), run:

```bash
npm run build
npm run preview
```

## CSV import

1. Open the `Settings / Imports` page in the admin dashboard.
2. Choose a dataset: `products`, `variants`, `orders`, or `inventory`.
3. Click `Import CSV`.
4. Preview the parsed rows.
5. Click `Import Preview Rows` to append them into local state.

Expected headers can match the dashboard fields directly. For example:

- `products`: `id`, `productName`, `storeDisplayName`, `category`, `brand`, `shortDescription`, `longDescription`, `supplierUrl`, `mainImage`, `galleryImageCount`, `status`, `featured`
- `variants`: `id`, `productId`, `variantName`, `variantOption`, `color`, `size`, `model`, `supplierSku`, `internalSku`, `stockQty`, `costPrice`, `sellingPrice`, `discount`, `weight`, `status`
- `orders`: `id`, `date`, `customerName`, `phone`, `email`, `product`, `variant`, `quantity`, `unitPrice`, `shipping`, `total`, `paymentMethod`, `paymentStatus`, `orderStatus`, `deliveryStatus`, `profit`, `notes`
- `inventory`: `variantId` or `id`, `productId`, `variantName`, `sku` or `internalSku`, `currentStock` or `stockQty`

## Export CSV

Go to `Settings / Imports`, choose a dataset, then click `Export CSV`.

## Where to edit data

- Demo data source: [mockData.js](/c:/rtech-gear/admin/src/data/mockData.js)
- Dashboard calculations: [selectors.js](/c:/rtech-gear/admin/src/lib/selectors.js)
- Main app shell and page wiring: [App.jsx](/c:/rtech-gear/admin/src/App.jsx)

## Storefront catalog (site HTML)

The storefront reads product data from `assets/data/products.json` and flash sale data from `assets/data/flash-sales.json`.

To regenerate both from the Spartan CSVs (and copy your product photos into web-safe paths under `assets/img/products/catalog/`), run:

```bash
node scripts/build-catalog.js
```

Files you’ll edit most often:

- Product + shared info: `assets/data/RTECH_Sp👽rtan_2_Commerce_OS_Pro_Upgraded_v3 - 01_Product_Hub.csv`
- Variants (color/size/model) + prices: `assets/data/RTECH_Spartan_v6_MACHINE - 02_Variant_Engine.csv`
- Flash sale picks (variant IDs): `assets/data/flash-sale-picks.json`
- Flash sale hero + optional image overrides: `assets/data/flash-sale-images.json`

## Page preview map

- Dashboard: overview KPIs, charts, recent orders, stock and content alerts
- Products: searchable parent product table with add/edit flow
- Variants: child variant table with duplication and bulk stock/price edits
- Orders: filterable order table with add/update actions
- Inventory: stock health and estimated value by SKU
- Payments: payment tracking and follow-up status
- Analytics: revenue, profit, category, payment, and stock visual summaries
- Settings / Imports: CSV tools, demo reset, categories, statuses, and import history
