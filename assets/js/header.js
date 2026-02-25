(function () {
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

  document.addEventListener("DOMContentLoaded", waitForHeader);

  // Mega menu removed (nav back to simple links).
})();
