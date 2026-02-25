(function () {
  function openWishlist() {
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
    const btn = document.getElementById("wishlistBtn");
    const drawer = document.getElementById("wishlistDrawer");
    const closeBtn = document.getElementById("wishlistCloseBtn");

    if (!btn) return false;
    btn.addEventListener("click", openWishlist);
    if (closeBtn) closeBtn.addEventListener("click", closeWishlist);
    if (drawer) {
      drawer.addEventListener("click", (e) => {
        if (e.target === drawer) closeWishlist();
      });
    }
    return true;
  }

  window.openWishlist = openWishlist;
  window.closeWishlist = closeWishlist;

  document.addEventListener("DOMContentLoaded", () => {
    const tryAttach = () => {
      if (!connectWishlistButtons()) setTimeout(tryAttach, 150);
    };
    tryAttach();
  });
})();
