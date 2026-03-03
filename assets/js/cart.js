(function () {
  function ensureDrawersReady() {
    if (typeof window.ensureGlobalDrawers === "function") {
      window.ensureGlobalDrawers();
    }
  }

  function openCart() {
    ensureDrawersReady();
    const drawer = document.getElementById("cartDrawer");
    if (drawer) drawer.classList.add("isOpen");
  }

  function closeCart() {
    const drawer = document.getElementById("cartDrawer");
    if (drawer) drawer.classList.remove("isOpen");
  }

  function connectCartButtons() {
    if (document.body.dataset.cartEventsBound === "1") return;
    document.body.dataset.cartEventsBound = "1";

    document.addEventListener("click", (e) => {
      if (e.target.closest("#cartBtn")) {
        openCart();
        return;
      }
      if (e.target.closest("#cartCloseBtn")) {
        closeCart();
        return;
      }
      if (e.target.closest("#clearCartBtn")) {
        clearCart();
        return;
      }
      const drawer = document.getElementById("cartDrawer");
      if (drawer && e.target === drawer) {
        closeCart();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeCart();
    });
  }

  window.openCart = openCart;
  window.closeCart = closeCart;

  document.addEventListener("DOMContentLoaded", () => {
    connectCartButtons();
  });
})();
