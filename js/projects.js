/**
 * PROJECTS PAGE LOGIC (js/projects.js)
 * Renders OrderFlow, OmniOrder, and BrandSync from window.PORTFOLIO_DATA
 * and wires the interactive BrandSync White-Label Storefront Customizer.
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

  function initProjects() {
    const data = window.PORTFOLIO_DATA || {};
    const container = document.getElementById("projects-container");
    const projects = data.projects || [];

    if (container && projects.length) {
      container.innerHTML = projects
        .map(
          (p) => `
        <article class="project-card reveal" id="${escapeHtml(p.id)}">
          <div class="project-head">
            <div>
              <h2 class="project-name">${escapeHtml(p.name)}</h2>
              <div class="project-cat">${escapeHtml(p.category)}</div>
            </div>
            <span class="status-pill">${escapeHtml(p.badge)}</span>
          </div>
          <div class="grid-2">
            <div class="project-block">
              <div class="mono-eyebrow">The Operational Challenge</div>
              <h3>${escapeHtml(p.challengeTitle)}</h3>
              <p>${escapeHtml(p.challenge)}</p>
            </div>
            <div class="project-block">
              <div class="mono-eyebrow">Architectural Solution</div>
              <h3>${escapeHtml(p.solutionTitle)}</h3>
              <p>${escapeHtml(p.solution)}</p>
              <ul class="bullets">
                ${(p.highlights || []).map((h) => `<li>${escapeHtml(h)}</li>`).join("")}
              </ul>
            </div>
          </div>
          <div class="tag-row">
            ${(p.stack || []).map((s) => `<span class="tech-tag">${escapeHtml(s)}</span>`).join("")}
          </div>
        </article>`
        )
        .join("");
    }

    const previewBox = document.getElementById("bs-preview-box");
    const brandInput = document.getElementById("bs-brand-input");
    const domainInput = document.getElementById("bs-domain-input");
    const nameEl = document.getElementById("bs-preview-name");
    const urlEl = document.getElementById("bs-preview-url");
    const badgeEl = document.getElementById("bs-preview-badge");
    const taglineEl = document.getElementById("bs-preview-tagline");
    const itemsEl = document.getElementById("bs-preview-items");
    const swatchesEl = document.getElementById("bs-swatches");

    const brandSync = data.brandSync || {};
    const presets = brandSync.themePresets || [
      { name: "Emerald", hex: "#10b981" },
      { name: "Crimson", hex: "#dc2626" },
      { name: "Sky", hex: "#0ea5e9" },
      { name: "Amber", hex: "#f59e0b" }
    ];

    function renderItems(items) {
      if (!itemsEl || !Array.isArray(items)) return;
      itemsEl.innerHTML = items
        .slice(0, 3)
        .map(
          (item) => `
          <div class="sp-item">
            <h4>${escapeHtml(item.name)}</h4>
            <p>${escapeHtml(item.description)}</p>
            <span>${escapeHtml(item.price)}</span>
          </div>`
        )
        .join("");
    }

    if (brandSync.defaultStorefront) {
      renderItems(brandSync.defaultStorefront.items);
    }

    if (swatchesEl) {
      swatchesEl.innerHTML = presets
        .map(
          (p, i) => `
          <button type="button" class="swatch" data-color="${escapeHtml(p.hex)}" aria-label="Theme color: ${escapeHtml(p.name)}" aria-pressed="${i === 0 ? "true" : "false"}"></button>`
        )
        .join("");

      swatchesEl.querySelectorAll(".swatch").forEach((btn) => {
        btn.style.backgroundColor = btn.getAttribute("data-color");
        btn.addEventListener("click", () => {
          const hex = btn.getAttribute("data-color");
          swatchesEl.querySelectorAll(".swatch").forEach((s) => s.setAttribute("aria-pressed", String(s === btn)));
          if (previewBox && hex) previewBox.style.setProperty("--brand", hex);
        });
      });
    }

    window.applyBrandSyncSandbox = function (opts) {
      const o = opts || {};
      const name = o.brandName || "Custom Storefront";
      const domain = o.customDomain || "order." + name.toLowerCase().replace(/[^a-z0-9]/g, "") + ".com";

      if (brandInput) brandInput.value = name;
      if (domainInput) domainInput.value = domain;
      if (nameEl) nameEl.textContent = name;
      if (urlEl) urlEl.textContent = `https://${domain} · TLS 1.3 Active`;
      if (badgeEl && o.statusBadge) badgeEl.textContent = o.statusBadge;
      if (taglineEl && o.tagline) taglineEl.textContent = o.tagline;
      if (previewBox && o.primaryColor) {
        previewBox.style.setProperty("--brand", o.primaryColor);
      }
      if (Array.isArray(o.items) && o.items.length) {
        renderItems(o.items);
      }

      const target = document.getElementById("sandbox-brandsync");
      if (target) target.scrollIntoView({ behavior: "smooth" });
    };

    const applyBtn = document.getElementById("bs-apply-btn");
    if (applyBtn) {
      applyBtn.addEventListener("click", () => {
        window.applyBrandSyncSandbox({
          brandName: brandInput ? brandInput.value.trim() : "",
          customDomain: domainInput ? domainInput.value.trim() : ""
        });
      });
    }

    const pending = sessionStorage.getItem("brandsync_pending");
    if (pending) {
      sessionStorage.removeItem("brandsync_pending");
      try {
        window.applyBrandSyncSandbox(JSON.parse(pending));
      } catch (_e) {}
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initProjects);
  } else {
    initProjects();
  }
})();
