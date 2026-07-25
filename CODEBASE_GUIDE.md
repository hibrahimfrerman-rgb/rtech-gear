# R-Tech Gear Codebase Guide

**Last Updated:** 2026-06-10  
**Purpose:** Complete reference for specialists implementing features on the R-Tech Gear e-commerce platform

---

## 📋 Executive Summary

R-Tech Gear is a **hybrid e-commerce platform** with two main components:

1. **Storefront** - Static HTML/CSS/JS multi-page site with dynamic product catalog
2. **Admin Dashboard** - React-based internal operations system with CSV import/export

Both systems share data sources and work together to manage products, inventory, orders, and payments.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────┐
│           STOREFRONT (Public)                       │
│  - HTML pages (index, shop, product, checkout)     │
│  - Vanilla JS (cart, wishlist, payments)           │
│  - CSS styling (Tailwind-inspired)                 │
│  - Product data: assets/data/products.json         │
└─────────────────────────────────────────────────────┘
                         │
                         ├─ Cart (localStorage)
                         ├─ Wishlist (localStorage)
                         └─ Payment Integration

┌─────────────────────────────────────────────────────┐
│         ADMIN DASHBOARD (Internal)                  │
│  - React 19 + Vite                                 │
│  - Tailwind CSS + Recharts                         │
│  - Pages: Dashboard, Products, Variants, Orders    │
│  - CSV Import/Export for data management           │
│  - Mock data (no backend database yet)             │
└─────────────────────────────────────────────────────┘
                         │
                         └─ Demo Data: admin/src/data/mockData.js

┌─────────────────────────────────────────────────────┐
│     PAYMENT INTEGRATIONS (Netlify Functions)       │
│  - M-Pesa STK Push (mobile checkout)               │
│  - DPO (credit/debit cards)                        │
│  - PayPal (cards & balance)                        │
│  - All functions in: netlify/functions/            │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│          DATA PIPELINE                              │
│  - Source: Spartan CSVs in assets/data/            │
│  - Transform: scripts/build-catalog.js             │
│  - Output: products.json + image catalog           │
│  - Admin mock data: mockData.js                    │
└─────────────────────────────────────────────────────┘
```

---

## 📁 Directory Structure

```
rtech-gear/
├── index.html                    # Home page
├── shop.html                     # Product listing
├── product.html                  # Single product page
├── checkout.html                 # Payment flow
├── cart.html                     # Cart review
├── wishlist.html                 # Saved items
├── track.html                    # Order tracking
├── flash-sale.html               # Flash sale page
├── blog.html, blog-single.html   # Blog pages
├── README.md                     # Project overview
│
├── admin/                        # React admin dashboard
│   ├── src/
│   │   ├── App.jsx               # Main app router (8 pages)
│   │   ├── index.css             # Tailwind styles
│   │   ├── main.jsx              # React entry point
│   │   ├── components/           # Reusable UI components
│   │   │   ├── AppShell.jsx      # Header, nav, sidebar
│   │   │   ├── DataTable.jsx     # Generic data table
│   │   │   ├── Modal.jsx         # Dialog component
│   │   │   ├── FormField.jsx     # Form inputs
│   │   │   ├── StatCard.jsx      # KPI display
│   │   │   └── ...other components
│   │   ├── pages/                # Page components (one per admin tab)
│   │   │   ├── DashboardPage.jsx # KPIs, charts, alerts
│   │   │   ├── ProductsPage.jsx  # Product CRUD
│   │   │   ├── VariantsPage.jsx  # Variant CRUD
│   │   │   ├── OrdersPage.jsx    # Order management
│   │   │   ├── InventoryPage.jsx # Stock visibility
│   │   │   ├── PaymentsPage.jsx  # Payment tracking
│   │   │   ├── AnalyticsPage.jsx # Reports
│   │   │   └── SettingsPage.jsx  # CSV import/export
│   │   ├── data/
│   │   │   └── mockData.js       # Demo data (25+ products, variants, orders)
│   │   └── lib/
│   │       ├── selectors.js      # Calculations & filters
│   │       └── utils.js          # Helpers
│   ├── package.json              # Dependencies
│   ├── vite.config.js            # Build config
│   ├── tailwind.config.js        # Tailwind setup
│   └── postcss.config.js         # CSS processing
│
├── assets/
│   ├── css/
│   │   ├── styles.css            # Global + storefront styles
│   │   ├── header.css            # Header/nav styling
│   │   ├── product-page.css      # Product detail page
│   │   ├── cart-page.css         # Cart & checkout styles
│   │   ├── blog.css              # Blog styles
│   │   ├── flash-sale.css        # Flash sale styles
│   │   └── first-pass.css        # Checkout-specific styles
│   ├── js/
│   │   ├── app.js                # Core logic (cart, WhatsApp, checkout)
│   │   ├── header.js             # Header interactions
│   │   ├── cart.js               # Cart drawer logic
│   │   ├── wishlist.js           # Wishlist logic
│   │   ├── product-page.js       # Product detail interactions
│   │   ├── products.js           # Product listing logic
│   │   ├── shop.js               # Shop page logic
│   │   ├── blog.js               # Blog page interactions
│   │   ├── flash-sale.js         # Flash sale logic
│   │   ├── hero.js               # Hero carousel
│   │   └── include.js            # Header/footer injection
│   ├── data/
│   │   ├── products.json         # Product catalog (auto-generated)
│   │   ├── flash-sales.json      # Flash sale listings
│   │   ├── flash-sale-picks.json # Variant IDs for flash sales
│   │   ├── flash-sale-images.json # Flash sale images
│   │   └── RTECH CSVs/           # Source data files
│   └── img/
│       ├── hero/                 # Hero carousel images
│       ├── products/             # Product images (organized by SKU)
│       ├── R-Tech Gear.🦉/       # Category images
│       └── cart pic/             # Cart/shipping graphics
│
├── netlify/
│   └── functions/                # Serverless functions
│       ├── mpesa-stk.js          # M-Pesa push trigger
│       ├── dpo-create-token.js   # DPO token generation
│       ├── dpo-verify-token.js   # DPO verification
│       ├── dpo-ipn.js            # DPO webhook
│       ├── paypal-create-order.js # PayPal order creation
│       └── paypal-capture.js     # PayPal payment capture
│
├── partials/
│   ├── header.html               # Header template (injected)
│   └── footer.html               # Footer template (injected)
│
├── scripts/
│   └── build-catalog.js          # CSV → products.json transformer
│
└── .github/
    └── agents/
        └── Amani.agent.md        # Custom coding mentor agent
```

---

## 🛍️ Core Features

### 1. **Product Management (Dual System)**

**Storefront Side:**
- Products stored in `assets/data/products.json`
- Parent-child structure (product + variants)
- Auto-generated from CSV using `scripts/build-catalog.js`
- Each product has SKU, name, description, pricing, images, tags

**Admin Dashboard:**
- Mock data in `admin/src/data/mockData.js`
- CRUD operations for products and variants
- CSV import/export support
- Categories: Audio, Wearables, Power, Photography, Accessories
- Statuses: Live, Draft, Archived

**Key File:** [assets/data/products.json](assets/data/products.json)

---

### 2. **Checkout Flow**

**File:** [checkout.html](checkout.html)

**Steps:**
1. **Express M-Pesa** - One-click payment button
2. **Contact Info** - Email, phone, full name capture
3. **Delivery Options** - Ship vs. pickup, speed selection
4. **Payment Method Selection** - M-Pesa, DPO, PayPal
5. **Card Fields (if needed)** - Card number, expiry, CVV
6. **Order Summary** - Live price calculation, shipping estimate

**Key Elements:**
- Form ID: `#checkoutForm`
- Items display: `#checkoutItems`
- Total calculation: `#checkoutTotal`, `#checkoutSubtotal`, `#checkoutShipping`
- Radio buttons for payment method: `name="payment"` values are `"M-Pesa"`, `"DPO"`, `"PayPal"`
- Shipping options: `name="shippingSpeed"` with format `"mode|cost"`
- Delivery modes: `name="deliveryMode"` values are `"ship"` or `"pickup"`

**Important:** Keep element IDs consistent with [assets/js/app.js](assets/js/app.js) logic

---

### 3. **Cart System**

**Storage:** Browser `localStorage` (key: `rtech_cart_v1`)

**Structure:**
```javascript
{
  items: [
    { productId, variantId, quantity, price, name, image }
  ],
  total: number,
  timestamp: date
}
```

**Features:**
- Add/remove items
- Adjust quantities
- Calculate subtotal
- Free shipping threshold: KES 3,000
- Progress bar to free shipping
- Mini cart in header
- Full cart drawer

**Files:**
- Display: [assets/js/cart.js](assets/js/cart.js)
- Summary: [checkout.html](checkout.html#L345)

---

### 4. **Payment Integrations**

**M-Pesa (Primary)**
- Server function: [netlify/functions/mpesa-stk.js](netlify/functions/mpesa-stk.js)
- Initiates STK push to user's phone
- Fast, preferred for Kenya
- No additional fields needed

**DPO (Credit/Debit Cards)**
- Create token: [netlify/functions/dpo-create-token.js](netlify/functions/dpo-create-token.js)
- Verify token: [netlify/functions/dpo-verify-token.js](netlify/functions/dpo-verify-token.js)
- IPN webhook: [netlify/functions/dpo-ipn.js](netlify/functions/dpo-ipn.js)
- Requires: Card number, expiry, CVV, name on card

**PayPal**
- Create order: [netlify/functions/paypal-create-order.js](netlify/functions/paypal-create-order.js)
- Capture payment: [netlify/functions/paypal-capture.js](netlify/functions/paypal-capture.js)
- Redirect to PayPal checkout
- Returns after payment approval

**Checkout Integration:** [assets/js/app.js](assets/js/app.js) → `connectCheckoutForm()` function

---

### 5. **Admin Dashboard (8 Pages)**

**Technology Stack:**
- React 19
- Vite (dev server, bundler)
- Tailwind CSS (styling)
- Recharts (charts/graphs)
- PapaParse (CSV parsing)
- Lucide React (icons)

**Pages:**

1. **Dashboard** - KPIs, trending charts, recent orders, alerts
   - File: [admin/src/pages/DashboardPage.jsx](admin/src/pages/DashboardPage.jsx)
   - Shows: Revenue, orders, inventory health, profit, payment mix

2. **Products** - Parent product records (name, description, category, images)
   - File: [admin/src/pages/ProductsPage.jsx](admin/src/pages/ProductsPage.jsx)
   - Actions: Add, edit, view variants, featured flag

3. **Variants** - Child records (SKU, pricing, stock, options)
   - File: [admin/src/pages/VariantsPage.jsx](admin/src/pages/VariantsPage.jsx)
   - Attributes: Color, size, model, cost, selling price, stock

4. **Orders** - Customer orders with fulfillment tracking
   - File: [admin/src/pages/OrdersPage.jsx](admin/src/pages/OrdersPage.jsx)
   - Statuses: Pending, Processing, Completed, Cancelled

5. **Inventory** - Stock visibility by SKU
   - File: [admin/src/pages/InventoryPage.jsx](admin/src/pages/InventoryPage.jsx)
   - Shows: Current stock, reorder alerts, SKU mapping

6. **Payments** - Payment reconciliation
   - File: [admin/src/pages/PaymentsPage.jsx](admin/src/pages/PaymentsPage.jsx)
   - Methods: M-Pesa, DPO, PayPal
   - Statuses: Paid, Pending, Failed, Partial

7. **Analytics** - Strategic reporting
   - File: [admin/src/pages/AnalyticsPage.jsx](admin/src/pages/AnalyticsPage.jsx)
   - Metrics: Revenue, profit, category performance, trends

8. **Settings / Imports** - CSV tools and configuration
   - File: [admin/src/pages/SettingsPage.jsx](admin/src/pages/SettingsPage.jsx)
   - Actions: Import, export, preview, demo reset

**Demo Data:**
- Location: [admin/src/data/mockData.js](admin/src/data/mockData.js)
- Contains: 6 products, 16 variants, sample orders, payments
- Used for testing and feature development

---

## 🔌 Payment Configuration

**WhatsApp Integration**
- Config: [assets/js/app.js](assets/js/app.js) line ~23
- Number: `254746343234` (no + sign, E.164 format)
- Used for: WhatsApp fallback button, support link
- Edit `STORE_CONFIG.whatsappNumber` to change

**Free Shipping Threshold**
- Amount: KES 3,000
- Configuration: [assets/js/app.js](assets/js/app.js) line ~28
- Edit `STORE_CONFIG.freeShippingThreshold` to adjust

**Currency**
- Default: KES (Kenyan Shilling)
- Edit `STORE_CONFIG.currency` if needed

---

## 📊 Data Flow

### Creating New Products

**Step 1: Update Source CSV**
- File: `assets/data/RTECH_Sp👽rtan_2_Commerce_OS_Pro_Upgraded_v3 - 01_Product_Hub.csv`
- Fields: id, productName, storeDisplayName, category, brand, descriptions, supplier URL, images, status

**Step 2: Update Variant CSV**
- File: `assets/data/RTECH_Spartan_v6_MACHINE - 02_Variant_Engine.csv`
- Fields: productId, variantName, color, size, model, SKU, pricing, stock, weight

**Step 3: Run Build Script**
```bash
node scripts/build-catalog.js
```
- Transforms CSVs → products.json
- Copies images to web-safe paths
- Merges products + variants

**Step 4: Verify in Storefront**
- [shop.html](shop.html) reads `products.json`
- Products appear automatically
- [product.html](product.html) displays individual product

---

## 🚀 Setup Instructions for Specialists

### Prerequisites
- Node.js 20+ (for admin dashboard)
- Git (version control)
- Code editor (VS Code recommended)

### Install Admin Dashboard
```bash
cd admin
npm install
npm run dev
```
Runs at `http://localhost:5173`

### Build for Production
```bash
cd admin
npm run build
npm run preview
```

### Generate Product Catalog
```bash
# From root directory
node scripts/build-catalog.js
```

### Deploy to Netlify
- Connected to GitHub repo
- Pushes to main branch trigger deployment
- Builds root (`index.html`, assets) and admin functions
- See [netlify.toml](netlify.toml) for config

---

## 🛠️ Key Customization Points

| Feature | File | Notes |
|---------|------|-------|
| WhatsApp number | [assets/js/app.js](assets/js/app.js#L23) | E.164 format (254XXXXXXXXX) |
| Free shipping threshold | [assets/js/app.js](assets/js/app.js#L28) | KES amount |
| Delivery locations | [checkout.html](checkout.html#L225) | Nairobi datalist options |
| Pickup stores | [checkout.html](checkout.html#L242) | Store list |
| Payment methods | [checkout.html](checkout.html#L290) | Radio options |
| Checkout styling | [assets/css/first-pass.css](assets/css/first-pass.css) | Checkout-only styles |
| Cart layout | [assets/js/cart.js](assets/js/cart.js) | Drawer structure |
| Admin demo data | [admin/src/data/mockData.js](admin/src/data/mockData.js) | Test products/orders |
| Admin styling | [admin/src/index.css](admin/src/index.css) | Tailwind global + custom |

---

## ✅ Testing Checklist

### Storefront
- [ ] Products load from `products.json`
- [ ] Cart adds/removes items correctly
- [ ] Wishlist saves to localStorage
- [ ] Checkout calculates totals correctly
- [ ] Free shipping threshold triggers at KES 3,000
- [ ] WhatsApp link works with cart summary
- [ ] Payment method selection shows/hides card fields
- [ ] Flash sale picks display correctly
- [ ] Blog pages load and format properly

### Admin Dashboard
- [ ] All 8 pages load without errors
- [ ] Dashboard shows KPIs and charts
- [ ] Can add/edit products and variants
- [ ] CSV import preview works
- [ ] CSV export generates valid files
- [ ] Orders page displays sample data
- [ ] Inventory shows stock levels
- [ ] Analytics renders charts

### Payment Integration
- [ ] M-Pesa button triggers STK on checkout
- [ ] DPO card fields appear when selected
- [ ] PayPal redirect works
- [ ] Checkout form validates required fields

---

## 📞 Support & Questions

- **Amani Agent**: Type `/Amani` in chat for code-specific help
- **File Documentation**: Detailed comments in key files
- **Demo Data**: Use admin dashboard mock data for testing

---

## 🎯 Next Steps for Specialists

1. **Clone & Setup** - Get admin running locally
2. **Explore Data** - Review mockData.js and products.json
3. **Test Flow** - Add test product, verify in checkout
4. **Review Payment Logic** - Understand checkout.js integration
5. **Plan Customizations** - Identify what needs to change
6. **Implement Features** - Use Amani agent for guidance

---

**Last Updated:** June 10, 2026  
**Maintained by:** R-Tech Gear Development Team  
**Questions?** Use `/Amani` agent in VS Code Chat
