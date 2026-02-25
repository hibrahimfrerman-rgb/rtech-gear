/* blog.js
   Blog listing + single post rendering.
*/

(function () {
  /* BLOG DOM TARGETS
     List page:
       - #blogPostsGrid, #blogListMeta
       - #blogCategories, #blogRecent, #blogArchives, #blogTags
       - #blogSearchForm, #blogSearchInput
     Single page:
       - #blogSingleTitle, #blogSingleBody, #blogSingleMeta, #blogSingleMedia
       - #blogSingleQuote, #blogSingleGallery, #blogSingleImageTags, #blogSingleTags
       - #blogRelated
  */
  const posts = [
    {
      slug: "creator-starter-kit-2026",
      title: "Creator Starter Kit 2026: Smart Picks for Better Content",
      excerpt: "Build a practical starter setup with audio, lighting, and support gear that actually improves daily content output.",
      category: "Audio",
      date: "2026-02-08",
      author: "R-Tech Team",
      image: "assets/img/hero-1.jpg",
      gallery: ["assets/img/promo-1.jpg", "assets/img/hero-2.jpg"],
      quote: "Great content does not start with expensive gear. It starts with repeatable setup quality.",
      tags: ["Audio", "Creator", "Setup"],
      content: [
        "A clean creator setup does not need expensive gear from day one. The biggest gains usually come from clear audio, stable framing, and consistent lighting.",
        "Start with one reliable microphone, one stable mount, and one compact light source. This gives you repeatable quality across short videos, livestreams, and product demos.",
        "When you upgrade, upgrade based on bottlenecks. If your audio clips, improve the mic first. If videos shake, improve support gear before buying another camera.",
        "The goal is simple: fewer setup delays, cleaner output, and faster publishing."
      ]
    },
    {
      slug: "wireless-audio-buying-guide",
      title: "Wireless Audio Buying Guide: What Actually Matters",
      excerpt: "Battery life, latency, and pickup pattern affect voice clarity more than flashy specs. Here is what to prioritize.",
      category: "Audio",
      date: "2026-02-01",
      author: "R-Tech Team",
      image: "assets/img/promo-2.jpg",
      gallery: ["assets/img/hero-3.jpg", "assets/img/hero-1.jpg"],
      quote: "Audio quality is often the main reason viewers trust a product demo.",
      tags: ["Audio", "Microphone", "Guide"],
      content: [
        "Wireless audio products can look similar but perform very differently in real use.",
        "Focus on three practical points: stable connection range, low background noise, and charging speed. These are the features that save shoots.",
        "For interviews and short reels, prioritize clear speech pickup over raw loudness. For outdoor use, include wind protection in your checklist.",
        "Strong audio quality makes average video look premium. Weak audio does the opposite."
      ]
    },
    {
      slug: "home-office-upgrades-that-help",
      title: "Home Office Upgrades That Improve Daily Workflow",
      excerpt: "Small upgrades in desk tech can cut friction and make your workday smoother.",
      category: "Smart Home",
      date: "2026-01-25",
      author: "R-Tech Team",
      image: "assets/img/hero-2.jpg",
      gallery: ["assets/img/promo-1.jpg", "assets/img/hero-1.jpg"],
      quote: "Small workflow fixes are usually worth more than flashy desk additions.",
      tags: ["Smart Home", "Productivity", "Workspace"],
      content: [
        "Your workspace should reduce friction, not create more of it.",
        "Start with power organization, then improve ergonomics, then optimize peripherals. This order gives the highest impact per shilling.",
        "Reliable charging points, cable discipline, and a comfortable keyboard layout improve consistency and reduce fatigue over long sessions.",
        "Treat your desk like a production system: small improvements compound over time."
      ]
    },
    {
      slug: "camera-support-basics",
      title: "Camera Support Basics: Tripods, Rigs, and Stable Shots",
      excerpt: "Stability is one of the fastest quality upgrades for mobile and camera creators.",
      category: "Cameras",
      date: "2026-01-17",
      author: "R-Tech Team",
      image: "assets/img/promo-1.jpg",
      gallery: ["assets/img/hero-2.jpg", "assets/img/promo-2.jpg"],
      quote: "Stability makes product visuals look more premium before any editing begins.",
      tags: ["Cameras", "Tripods", "Guide"],
      content: [
        "Viewers notice shaky footage immediately. Stable footage raises trust and perceived quality instantly.",
        "If you shoot while moving, choose compact rigs. If you shoot product scenes, choose stable tripods with quick angle adjustment.",
        "Keep one grab-and-go setup prepared so you can start recording quickly when ideas come.",
        "Fast setup plus stable framing means more content published with less stress."
      ]
    },
    {
      slug: "phone-accessories-worth-buying",
      title: "Phone Accessories Worth Buying First",
      excerpt: "Not every accessory pays off. These are the ones that bring immediate day-to-day value.",
      category: "Phones",
      date: "2026-01-10",
      author: "R-Tech Team",
      image: "assets/img/hero-3.jpg",
      gallery: ["assets/img/hero-1.jpg", "assets/img/promo-2.jpg"],
      quote: "Reliable accessories reduce replacement cost and improve daily consistency.",
      tags: ["Phones", "Accessories", "Guide"],
      content: [
        "When buying accessories, start with durability and reliability before aesthetics.",
        "A strong charger, durable cable, and practical stand bring value every single day.",
        "For people filming with phones, add a compact tripod and clip light early. This improves output far more than novelty add-ons.",
        "The right accessories reduce replacement costs and improve device lifespan."
      ]
    },
    {
      slug: "gaming-gear-for-starters",
      title: "Gaming Gear for Starters: Clean Setup, Better Sessions",
      excerpt: "You do not need a full premium setup to get a better gaming experience.",
      category: "Gaming",
      date: "2026-01-02",
      author: "R-Tech Team",
      image: "assets/img/hero-1.jpg",
      gallery: ["assets/img/hero-2.jpg", "assets/img/hero-3.jpg"],
      quote: "Comfort and stable performance matter more than flashy accessories.",
      tags: ["Gaming", "Setup", "Accessories"],
      content: [
        "Good gaming setups are built around comfort, clarity, and consistency.",
        "Start with low-latency peripherals and a reliable power path. Add extras only when the basics are solved.",
        "A clean desk and ergonomic arrangement reduce fatigue during long sessions.",
        "Performance gains often come from setup quality, not only expensive upgrades."
      ]
    }
  ];

  function formatDate(dateStr) {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function byNewest(a, b) {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  }

  function groupArchives(items) {
    const bucket = {};
    items.forEach((item) => {
      const d = new Date(item.date + "T00:00:00");
      const label = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      bucket[label] = (bucket[label] || 0) + 1;
    });
    return Object.keys(bucket).map((key) => ({ label: key, count: bucket[key] }));
  }

  function allTags(items) {
    const seen = new Set();
    const tags = [];
    items.forEach((item) => {
      (item.tags || []).forEach((tag) => {
        if (seen.has(tag)) return;
        seen.add(tag);
        tags.push(tag);
      });
    });
    return tags.sort();
  }

  function postCard(post) {
    const safeTitle = escapeHtml(post.title);
    const safeExcerpt = escapeHtml(post.excerpt);
    return `
      <article class="blogCard">
        <a class="blogCardMedia" href="blog-single.html?slug=${encodeURIComponent(post.slug)}" style="background-image:url('${post.image}')"></a>
        <div class="blogCardBody">
          <div class="blogCardMeta">${escapeHtml(post.author)} | ${formatDate(post.date)} | ${escapeHtml(post.category)}</div>
          <a class="blogCardTitle" href="blog-single.html?slug=${encodeURIComponent(post.slug)}">${safeTitle}</a>
          <p class="blogCardExcerpt">${safeExcerpt}</p>
          <a class="blogReadMore" href="blog-single.html?slug=${encodeURIComponent(post.slug)}">Read article</a>
        </div>
      </article>
    `;
  }

  function recentItem(post) {
    return `
      <a class="recentItem" href="blog-single.html?slug=${encodeURIComponent(post.slug)}">
        <span class="recentThumb" style="background-image:url('${post.image}')"></span>
        <span>
          <span class="recentTitle">${escapeHtml(post.title)}</span>
          <span class="recentDate">${formatDate(post.date)}</span>
        </span>
      </a>
    `;
  }

  function fillSharedWidgets(list) {
    const recents = document.getElementById("blogRecent");
    if (recents) recents.innerHTML = list.slice(0, 5).map(recentItem).join("");

    const cats = document.getElementById("blogCategories");
    if (cats) {
      const counts = {};
      list.forEach((p) => { counts[p.category] = (counts[p.category] || 0) + 1; });
      cats.innerHTML = Object.keys(counts).sort().map((c) => {
        const href = `blog.html?q=${encodeURIComponent(c)}`;
        return `<li><a href="${href}">${escapeHtml(c)} <span>${counts[c]}</span></a></li>`;
      }).join("");
    }

    const archivesEl = document.getElementById("blogArchives");
    if (archivesEl) {
      archivesEl.innerHTML = groupArchives(list).map((a) => {
        return `<li><a href="blog.html?q=${encodeURIComponent(a.label)}">${escapeHtml(a.label)} <span>${a.count}</span></a></li>`;
      }).join("");
    }

    const tagsEl = document.getElementById("blogTags");
    if (tagsEl) {
      tagsEl.innerHTML = allTags(list).map((tag) => {
        return `<a href="blog.html?q=${encodeURIComponent(tag)}">${escapeHtml(tag)}</a>`;
      }).join("");
    }

    const searchForm = document.getElementById("blogSearchForm");
    const searchInput = document.getElementById("blogSearchInput");
    if (searchInput) {
      const q = new URLSearchParams(window.location.search).get("q") || "";
      searchInput.value = q;
    }
    if (searchForm && !searchForm.dataset.bound) {
      searchForm.dataset.bound = "1";
      searchForm.addEventListener("submit", function (e) {
        e.preventDefault();
        const value = searchInput ? searchInput.value.trim() : "";
        window.location.href = `blog.html${value ? `?q=${encodeURIComponent(value)}` : ""}`;
      });
    }
  }

  function renderBlogList() {
    const grid = document.getElementById("blogPostsGrid");
    if (!grid) return;

    const list = posts.slice().sort(byNewest);
    const q = (new URLSearchParams(window.location.search).get("q") || "").toLowerCase();
    const filtered = !q ? list : list.filter((p) => {
      const searchable = [p.title, p.excerpt, p.category, p.tags.join(" "), p.date].join(" ").toLowerCase();
      const archiveLabel = new Date(p.date + "T00:00:00").toLocaleDateString("en-US", { month: "long", year: "numeric" }).toLowerCase();
      return searchable.includes(q) || archiveLabel.includes(q);
    });

    grid.innerHTML = filtered.map(postCard).join("");

    const listMeta = document.getElementById("blogListMeta");
    if (listMeta) {
      const suffix = q ? ` for "${q}"` : "";
      listMeta.textContent = `${filtered.length} post(s)${suffix}`;
    }

    fillSharedWidgets(list);
  }

  function renderBlogSingle() {
    const root = document.getElementById("blogSingle");
    if (!root) return;

    const list = posts.slice().sort(byNewest);
    const slug = new URLSearchParams(window.location.search).get("slug");
    const post = list.find((p) => p.slug === slug) || list[0];

    const titleEl = document.getElementById("blogSingleTitle");
    const catEl = document.getElementById("blogSingleCategory");
    const crumbEl = document.getElementById("blogSingleCrumbTitle");
    const bodyEl = document.getElementById("blogSingleBody");
    const metaEl = document.getElementById("blogSingleMeta");
    const mediaEl = document.getElementById("blogSingleMedia");
    const quoteEl = document.getElementById("blogSingleQuote");
    const galleryEl = document.getElementById("blogSingleGallery");
    const imageTagsEl = document.getElementById("blogSingleImageTags");
    const tagsRowEl = document.getElementById("blogSingleTags");
    if (!titleEl || !catEl || !bodyEl || !metaEl || !mediaEl) return;

    document.title = `${post.title} | R-Tech Gear Blog`;
    titleEl.textContent = post.title;
    catEl.textContent = post.category;
    if (crumbEl) crumbEl.textContent = post.title;
    metaEl.textContent = `${post.author} | ${formatDate(post.date)} | ${post.category}`;
    mediaEl.style.backgroundImage = `url('${post.image}')`;
    bodyEl.innerHTML = post.content.map((p) => `<p>${escapeHtml(p)}</p>`).join("");

    if (quoteEl) quoteEl.textContent = post.quote || "";
    if (galleryEl) {
      galleryEl.innerHTML = (post.gallery || []).slice(0, 2).map((img) => {
        return `<div class="blogInlineMedia" style="background-image:url('${img}')"></div>`;
      }).join("");
    }
    if (imageTagsEl) {
      imageTagsEl.innerHTML = (post.tags || []).slice(0, 6).map((t) => `<a href="blog.html?q=${encodeURIComponent(t)}">${escapeHtml(t)}</a>`).join("");
    }
    if (tagsRowEl) {
      tagsRowEl.innerHTML = (post.tags || []).map((t) => `<a href="blog.html?q=${encodeURIComponent(t)}">${escapeHtml(t)}</a>`).join("");
    }

    fillSharedWidgets(list);

    const related = document.getElementById("blogRelated");
    if (related) {
      const rel = list.filter((p) => p.slug !== post.slug).slice(0, 4);
      related.innerHTML = rel.map(postCard).join("");
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderBlogList();
    renderBlogSingle();
  });
})();
