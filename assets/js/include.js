/* include.js
   This file loads the header and footer into every page.
*/

async function loadPartial(targetId, filePath) {
  const el = document.getElementById(targetId);
  if (!el) return;

  try {
    const res = await fetch(filePath);
    if (!res.ok) throw new Error("Failed to load: " + filePath);
    el.innerHTML = await res.text();
  } catch (err) {
    console.error(err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadPartial("siteHeader", "partials/header.html");
  loadPartial("siteFooter", "partials/footer.html");
});