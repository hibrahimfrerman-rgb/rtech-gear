(function () {
  function openCart() {
    const drawer = document.getElementById("cartDrawer");
    if (drawer) drawer.classList.add("isOpen");
  }

  function closeCart() {
    const drawer = document.getElementById("cartDrawer");
    if (drawer) drawer.classList.remove("isOpen");
  }

  function connectCartButtons() {
    const cartBtn = document.getElementById("cartBtn");
    if (!cartBtn) return false;
    cartBtn.addEventListener("click", openCart);

    const closeBtn = document.getElementById("cartCloseBtn");
    if (closeBtn) closeBtn.addEventListener("click", closeCart);

    const clearBtn = document.getElementById("clearCartBtn");
    if (clearBtn) clearBtn.addEventListener("click", clearCart);

    const drawer = document.getElementById("cartDrawer");
    if (drawer) {
      drawer.addEventListener("click", (e) => {
        if (e.target === drawer) closeCart();
      });
    }
    return true;
  }

  window.openCart = openCart;
  window.closeCart = closeCart;

  document.addEventListener("DOMContentLoaded", () => {
    const tryAttach = () => {
      if (!connectCartButtons()) setTimeout(tryAttach, 150);
    };
    tryAttach();
  });
})();
