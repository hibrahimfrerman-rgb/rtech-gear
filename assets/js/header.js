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

  document.addEventListener("DOMContentLoaded", () => {
    applyDeviceClass();
    waitForHeader();
  });
  window.addEventListener("resize", applyDeviceClass);

  // Mega menu removed (nav back to simple links).
})();
