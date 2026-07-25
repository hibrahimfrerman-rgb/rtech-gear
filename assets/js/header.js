(function () {
  function applyDeviceClass() {
    const w = window.innerWidth || document.documentElement.clientWidth || 0;
    let device = "desktop";
    if (w <= 760) device = "phone";
    else if (w <= 1024) device = "tablet";
    document.documentElement.setAttribute("data-device", device);
  }


  function attachHeaderScroll() {
    const header = document.getElementById("siteHeaderRoot");
    if (!header) return false;



    function onScroll() {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    }


    document.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return true;
  }


  function waitForHeader() {
    if (attachHeaderScroll()) return;
    setTimeout(waitForHeader, 120);
  }


  /* =====================================================
     MOBILE BOTTOM NAV — ACTIVE STATE — Sprint 3.3
     Highlights whichever bottom-nav link matches the current
     page, so the floating dock behaves like a real app tab bar.


     WHAT IT DOES:
     - Compares each bottom-nav link's href to the current page
     - Adds ".active" to the matching link (styling lives in
       header.css, search ".mobile-bottom-nav a.active")


     WHERE TO EDIT:
     - To add/remove a tab, edit the <nav class="mobile-bottom-nav">
       links in header.html — this script needs no changes.
  ===================================================== */
  function highlightActiveBottomNavLink() {
    const links = document.querySelectorAll(".mobile-bottom-nav a");
    if (!links.length) return false;


    // "index.html" and "" (site root) both count as the home page.
    const currentPage = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();
    const isHome = currentPage === "" || currentPage === "index.html";


    links.forEach((link) => {
      const linkPage = (link.getAttribute("href") || "").toLowerCase();
      const matches = isHome ? linkPage === "index.html" : linkPage === currentPage;
      link.classList.toggle("active", matches);
    });


    return true;
  }


  function waitForBottomNav() {
    if (highlightActiveBottomNavLink()) return;
    setTimeout(waitForBottomNav, 120);
  }


  document.addEventListener("DOMContentLoaded", () => {
    applyDeviceClass();
    waitForHeader();
    waitForBottomNav();
  });
  window.addEventListener("resize", applyDeviceClass);
})();





