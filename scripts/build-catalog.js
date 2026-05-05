/* eslint-disable no-console */
// Builds storefront-ready data files from the "Spartan" CSVs and copies product images
// into web-safe paths under `assets/img/products/...`.
//
// Usage:
//   node scripts/build-catalog.js

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "assets", "data");
const IMG_ROOT = path.join(ROOT, "assets", "img");

const PRODUCT_HUB_CSV = path.join(
  DATA_DIR,
  "RTECH_Sp👽rtan_2_Commerce_OS_Pro_Upgraded_v3 - 01_Product_Hub.csv"
);
const VARIANT_ENGINE_CSV = path.join(
  DATA_DIR,
  "RTECH_Spartan_v6_MACHINE - 02_Variant_Engine.csv"
);
const FLASH_PICKS_JSON = path.join(DATA_DIR, "flash-sale-picks.json");

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function fileExists(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

// Minimal RFC4180-ish CSV parser (handles quotes, commas, newlines, and "" escapes).
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        const next = text[i + 1];
        if (next === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      continue;
    }

    if (ch === ",") {
      row.push(field);
      field = "";
      continue;
    }

    if (ch === "\r") continue;

    if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      continue;
    }

    field += ch;
  }

  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function findHeaderIndex(rows, firstCell) {
  const target = String(firstCell || "").trim();
  for (let i = 0; i < Math.min(rows.length, 80); i += 1) {
    if (!rows[i] || !rows[i].length) continue;
    if (String(rows[i][0] || "").trim() === target) return i;
  }
  return -1;
}

function rowsToObjects(rows, headerIndex) {
  const header = (rows[headerIndex] || []).map((h) => String(h || "").trim());
  const out = [];
  for (let i = headerIndex + 1; i < rows.length; i += 1) {
    const r = rows[i] || [];
    if (!r.length) continue;
    const obj = {};
    let nonEmpty = 0;
    for (let c = 0; c < header.length; c += 1) {
      const key = header[c];
      if (!key) continue;
      const value = r[c] == null ? "" : String(r[c]);
      if (String(value).trim()) nonEmpty += 1;
      obj[key] = value;
    }
    // Skip spacer rows.
    if (nonEmpty === 0) continue;
    out.push(obj);
  }
  return out;
}

function fixText(value) {
  if (value == null) return "";
  return String(value)
    .replace(/\s+/g, " ")
    // Common CP1252->UTF8 mojibake found in the CSVs.
    .replace(/â€™|â€˜|ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢|ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“/g, "'")
    .replace(/â€œ|â€|ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ|ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â/g, '"')
    .replace(/â€“|â€”|ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“|ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â/g, "-")
    .replace(/â€¢|ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢/g, "*")
    .replace(/â€‘|â€“|–/g, "-")
    .replace(/Â°|Ãƒâ€šÃ‚Â°/g, "deg")
    .replace(/Â|Ãƒâ€š/g, "")
    .trim();
}

function toNumber(value) {
  const cleaned = String(value || "").replace(/[^0-9.+-]/g, "");
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : 0;
}

function normalizePercent(value) {
  const num = toNumber(value);
  if (!num) return 0;
  // Accept 0.15 or 15
  return num > 1 ? num / 100 : num;
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function stripExtraQuotes(value) {
  let out = fixText(value || "");
  // CSV sometimes carries an extra pair of quotes inside the value.
  if (out.startsWith('"') && out.endsWith('"')) out = out.slice(1, -1);
  return out.trim();
}

function toAbsoluteImagePath(maybePath) {
  const raw = stripExtraQuotes(maybePath);
  if (!raw) return "";

  // Already absolute Windows path.
  if (/^[a-zA-Z]:\\/.test(raw)) return repairOwlFolder(raw);

  // Already absolute POSIX-like.
  if (raw.startsWith("/")) return path.join(ROOT, raw.slice(1));

  // Likely repo-relative.
  return repairOwlFolder(path.join(ROOT, raw));
}

function repairOwlFolder(absPath) {
  const str = String(absPath || "");
  if (!str) return str;
  // The Spartan CSVs sometimes contain a mojibake version of the owl folder name.
  // Normalize any `assets\img\R-Tech Gear.*\...` to the actual on-disk folder `R-Tech Gear.🦉`.
  const normalized = str.replace(/\\/g, "/");
  const fixed = normalized.replace(
    /\/assets\/img\/R-Tech Gear\.[^/]+\//i,
    "/assets/img/R-Tech Gear.🦉/"
  );
  return fixed.replace(/\//g, "\\");
}

function toWebPathFromAbs(absPath) {
  if (!absPath) return "";
  const normalized = absPath.replace(/\\/g, "/");
  const idx = normalized.toLowerCase().lastIndexOf("/assets/");
  if (idx >= 0) return normalized.slice(idx + 1); // drop leading "/"
  const idx2 = normalized.toLowerCase().lastIndexOf("assets/");
  if (idx2 >= 0) return normalized.slice(idx2);
  return "";
}

function copyImageToFolder(absPath, webFolder) {
  if (!absPath || !webFolder) return "";
  const filename = path.basename(absPath);
  const cleanFolder = String(webFolder).replace(/\\/g, "/").replace(/^\/+/, "");
  const folderOnDisk = path.join(ROOT, cleanFolder);
  ensureDir(folderOnDisk);

  const destAbs = path.join(folderOnDisk, filename);
  if (fileExists(absPath)) {
    try {
      if (!fileExists(destAbs) || fs.statSync(destAbs).size !== fs.statSync(absPath).size) {
        fs.copyFileSync(absPath, destAbs);
      }
    } catch (err) {
      console.warn("Image copy failed:", absPath, "->", destAbs, String(err && err.message ? err.message : err));
    }
  } else {
    // If the absolute path doesn't exist, attempt to interpret it as a web path already.
    const maybeWeb = toWebPathFromAbs(absPath);
    if (maybeWeb) return maybeWeb;
    console.warn("Missing image file:", absPath);
  }

  const withSlash = cleanFolder.endsWith("/") ? cleanFolder : `${cleanFolder}/`;
  return `${withSlash}${filename}`;
}

function safeWebFolder(rawFolder, productId) {
  const raw = fixText(rawFolder || "").replace(/\\/g, "/").trim();
  // Only accept a normal relative `assets/...` path without Windows-illegal characters.
  const candidate = raw.replace(/^"+|"+$/g, "").replace(/^\/+/, "");
  const illegal = /[<>:"|?*\u0000-\u001F]/g;
  const cleaned = candidate.replace(illegal, "").replace(/\s+/g, "-");
  const looksLikeAssets = cleaned.toLowerCase().startsWith("assets/");
  const looksLikeProducts = cleaned.toLowerCase().startsWith("assets/img/products/");
  const safe = looksLikeAssets && looksLikeProducts && cleaned.length <= 180 ? cleaned : "";
  const fallback = `assets/img/products/catalog/${slugify(productId) || "product"}/`;
  const out = safe || fallback;
  return out.endsWith("/") ? out : `${out}/`;
}

function splitTags(value) {
  const text = fixText(value || "");
  if (!text) return [];
  const tokens = text
    .split(/[\s,|/]+/g)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => t.toLowerCase())
    .filter((t) => t.length >= 3 && t.length <= 32);
  return Array.from(new Set(tokens));
}

function build() {
  console.log("Reading CSVs...");
  const hubText = readText(PRODUCT_HUB_CSV);
  const variantText = readText(VARIANT_ENGINE_CSV);

  const hubRows = parseCsv(hubText);
  const variantRows = parseCsv(variantText);

  const hubHeaderIndex = findHeaderIndex(hubRows, "Product ID");
  const variantHeaderIndex = findHeaderIndex(variantRows, "Variant Row");

  if (hubHeaderIndex < 0) throw new Error("Could not find Product Hub header row (Product ID)");
  if (variantHeaderIndex < 0) throw new Error("Could not find Variant Engine header row (Variant Row)");

  const hub = rowsToObjects(hubRows, hubHeaderIndex);
  const variants = rowsToObjects(variantRows, variantHeaderIndex);

  console.log(`Parsed Product Hub rows: ${hub.length}`);
  console.log(`Parsed Variant Engine rows: ${variants.length}`);

  const hubByProductId = new Map();
  hub.forEach((row) => {
    const pid = fixText(row["Product ID"]);
    if (!pid) return;
    hubByProductId.set(pid, row);
  });

  // Build products from the hub, then attach variants.
  const productsByPid = new Map();
  hubByProductId.forEach((row, pid) => {
    const activeRaw = fixText(row["Active?"]).toLowerCase();
    const active = activeRaw === "y" || activeRaw === "yes" || activeRaw === "true" || activeRaw === "1";
    if (!active) return;

    const handle = fixText(row["Codex Handle"]) || fixText(row["Base Product Name"]) || pid;
    const hubSku = fixText(row["Legacy RTech SKU"]) || fixText(row["RTech SKU"]) || "";
    const productId =
      (slugify(hubSku) || slugify(handle) || slugify(pid) || `p-${Math.random().toString(16).slice(2, 8)}`)
        .slice(0, 32);

    const webFolder = safeWebFolder(row["Image Folder"], productId);
    const images = ["Image1", "Image2", "Image3", "Image4"]
      .map((k) => copyImageToFolder(toAbsoluteImagePath(row[k]), webFolder))
      .filter(Boolean);

    const category = fixText(row["Category"]).replace(/[-_]/g, " ");
    const tags = Array.from(
      new Set([
        ...splitTags(row["Search Tags"]),
        ...splitTags(row["Product Family"]),
        ...splitTags(row["Base Product Name"]),
        ...splitTags(category),
        pid.toLowerCase()
      ])
    );

    const flags = [];
    const priceStatus = fixText(row["Price Status"]).toLowerCase();
    if (priceStatus.includes("ready") || priceStatus.includes("✓")) flags.push("featured");

    productsByPid.set(pid, {
      pid,
      id: productId,
      sku: hubSku || pid,
      name: fixText(row["Base Product Name"]) || fixText(row["Product Family"]) || pid,
      category: category || "",
      supplierUrl: fixText(row["Shared Supplier URL"]) || "",
      short_description: fixText(row["Shared Short Description"]) || "",
      long_description: fixText(row["Shared Long Description"]) || "",
      description: fixText(row["Shared Long Description"]) || fixText(row["Shared Short Description"]) || "",
      tags,
      flags,
      images,
      variants: []
    });
  });

  // Attach variants.
  variants.forEach((row) => {
    const pid = fixText(row["Product ID"]);
    if (!pid || !productsByPid.has(pid)) return;

    const product = productsByPid.get(pid);

    const option1Name = fixText(row["Option 1 Name"]);
    const option1Value = fixText(row["Option 1 Value"]);
    const option2Name = fixText(row["Option 2 Name"]);
    const option2Value = fixText(row["Option 2 Value"]);

    const attrs = {};
    if (option1Name && option1Value) attrs[option1Name] = option1Value;
    if (option2Name && option2Value) attrs[option2Name] = option2Value;

    const labelParts = [];
    if (option1Value) labelParts.push(option1Value);
    if (option2Value) labelParts.push(option2Value);

    const rtechSku = fixText(row["RTech SKU Suggestion"]) || fixText(row["SKU"]) || "";
    const variantId = rtechSku || `${product.id}-${slugify(labelParts.join("-") || "default")}`.slice(0, 48);

    const webFolder = safeWebFolder(
      row["Image Folder"],
      product.id
    ) || (product.images[0] ? path.posix.dirname(product.images[0]) + "/" : `assets/img/products/catalog/${product.id}/`);
    const vImages = ["Image1", "Image2", "Image3", "Image4"]
      .map((k) => copyImageToFolder(toAbsoluteImagePath(row[k]), webFolder))
      .filter(Boolean);

    const price = toNumber(row["AUTO Store Price (KES)"]);
    const compareAt = toNumber(row["AUTO Compare-at (KES)"]);
    const stockQty = toNumber(row["Stock Qty"]);

    if (!price) return;

    const cleanVariantName = labelParts.length ? `${product.name} - ${labelParts.join(" / ")}` : product.name;

    product.variants.push({
      id: variantId,
      sku: variantId,
      name: cleanVariantName,
      label: labelParts.join(" / "),
      price_ksh: price,
      compare_at_ksh: compareAt,
      stock_qty: stockQty,
      attributes: attrs,
      images: vImages.length ? vImages : product.images
    });
  });

  const products = Array.from(productsByPid.values()).map((p) => {
    // Compute base price/compare-at for cards.
    const prices = p.variants.map((v) => Number(v.price_ksh || 0)).filter((n) => Number.isFinite(n) && n > 0);
    const compare = p.variants.map((v) => Number(v.compare_at_ksh || 0)).filter((n) => Number.isFinite(n) && n > 0);
    const minPrice = prices.length ? Math.min(...prices) : 0;
    const maxCompare = compare.length ? Math.max(...compare) : 0;

    // Ensure product-level images include any variant images (first few only).
    const imageSet = new Set((p.images || []).filter(Boolean));
    p.variants.forEach((v) => (v.images || []).forEach((img) => imageSet.add(img)));
    const images = Array.from(imageSet);

    return {
      id: p.id,
      sku: p.sku || p.id,
      name: p.name,
      description: p.description,
      short_description: p.short_description,
      long_description: p.long_description,
      category: p.category,
      supplier_url: p.supplierUrl,
      price_ksh: minPrice,
      compare_at_ksh: maxCompare,
      images,
      tags: p.tags,
      flags: p.flags,
      variants: p.variants
    };
  });

  // Flash sale: pick high-discount variants.
  const flashCandidates = [];
  products.forEach((p) => {
    (p.variants || []).forEach((v) => {
      const now = Number(v.price_ksh || 0);
      const old = Number(v.compare_at_ksh || 0);
      if (!now || !old || old <= now) return;
      const pct = (old - now) / old;
      flashCandidates.push({
        id: v.id,
        name: v.name || p.name,
        description: p.short_description || "",
        price: now,
        compareAt: old,
        currency: "KES",
        image: (Array.isArray(v.images) && v.images[0]) || (Array.isArray(p.images) && p.images[0]) || "",
        category: (p.category || "other").toLowerCase().replace(/\s+/g, "-"),
        discount: pct
      });
    });
  });

  flashCandidates.sort((a, b) => b.discount - a.discount);

  let picked = [];
  if (fileExists(FLASH_PICKS_JSON)) {
    try {
      const raw = JSON.parse(readText(FLASH_PICKS_JSON));
      if (Array.isArray(raw)) {
        const wanted = raw.map((x) => String(x || "").trim()).filter(Boolean);
        const map = new Map(flashCandidates.map((c) => [String(c.id), c]));
        picked = wanted.map((id) => map.get(id)).filter(Boolean);
      }
    } catch (err) {
      console.warn("Ignoring invalid flash-sale-picks.json:", String(err && err.message ? err.message : err));
    }
  }

  const flashBase = (picked.length ? picked : flashCandidates.slice(0, 12));
  const flash = flashBase.slice(0, 12).map((item, idx) => {
    const endsAt = new Date(Date.now() + (idx % 6 + 1) * 6 * 3600 * 1000).toISOString();
    const deliverySpeed = idx % 3 === 0 ? "same-day" : idx % 3 === 1 ? "next-day" : "standard";
    return {
      id: item.id,
      name: item.name,
      description: item.description,
      price: Math.round(item.price),
      compareAt: Math.round(item.compareAt),
      currency: item.currency,
      image: item.image,
      category: item.category,
      deliverySpeed,
      endsAt
    };
  });

  const productsOut = path.join(DATA_DIR, "products.json");
  const flashOut = path.join(DATA_DIR, "flash-sales.json");

  ensureDir(DATA_DIR);
  fs.writeFileSync(productsOut, JSON.stringify(products, null, 2) + "\n", "utf8");
  fs.writeFileSync(flashOut, JSON.stringify(flash, null, 2) + "\n", "utf8");

  console.log("Wrote:", path.relative(ROOT, productsOut));
  console.log("Wrote:", path.relative(ROOT, flashOut));
  console.log("Products:", products.length, "Flash items:", flash.length);
}

try {
  build();
} catch (err) {
  console.error("Build failed:", err && err.stack ? err.stack : err);
  process.exitCode = 1;
}
