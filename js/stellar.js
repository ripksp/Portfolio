/**
 * STELLAR INDUSTRIES PAGE LOGIC (js/stellar.js)
 * Populates general features and tech stack from window.PORTFOLIO_DATA.stellar.
 */

(function () {
  "use strict";

  const escapeHtml = (str) =>
    (window.JD && window.JD.escapeHtml)
      ? window.JD.escapeHtml(str)
      : String(str == null ? "" : str)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");

  function initStellar() {
    const s = window.PORTFOLIO_DATA && window.PORTFOLIO_DATA.stellar;
    if (!s) return;

    const featuresGrid = document.getElementById("stellar-features-grid");
    if (featuresGrid && Array.isArray(s.features)) {
      featuresGrid.innerHTML = s.features
        .map(
          (f) => `
          <article class="feature-card">
            <h3>${escapeHtml(f.title)}</h3>
            <p>${escapeHtml(f.detail)}</p>
          </article>`
        )
        .join("");
    }

    const stackTags = document.getElementById("stellar-stack-tags");
    if (stackTags && Array.isArray(s.stack)) {
      stackTags.innerHTML = s.stack.map((t) => `<span class="tech-tag">${escapeHtml(t)}</span>`).join("");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initStellar);
  } else {
    initStellar();
  }
})();
