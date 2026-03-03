(function () {
  function ensureDrawersReady() {
    if (typeof window.ensureGlobalDrawers === "function") {
      window.ensureGlobalDrawers();
    }
  }

  function openWishlist() {
    ensureDrawersReady();
    const drawer = document.getElementById("wishlistDrawer");
    if (drawer) {
      drawer.classList.add("isOpen");
    }
  }

  function closeWishlist() {
    const drawer = document.getElementById("wishlistDrawer");
    if (drawer) drawer.classList.remove("isOpen");
  }

  function connectWishlistButtons() {
    if (document.body.dataset.wishlistEventsBound === "1") return;
    document.body.dataset.wishlistEventsBound = "1";

    document.addEventListener("click", (e) => {
      if (e.target.closest("#wishlistBtn")) {
        openWishlist();
        return;
      }
      if (e.target.closest("#wishlistCloseBtn")) {
        closeWishlist();
        return;
      }
      const drawer = document.getElementById("wishlistDrawer");
      if (drawer && e.target === drawer) {
        closeWishlist();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeWishlist();
    });
  }

  window.openWishlist = openWishlist;
  window.closeWishlist = closeWishlist;

  document.addEventListener("DOMContentLoaded", () => {
    connectWishlistButtons();
  });
})();
