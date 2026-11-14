/**
 * PROJECTS PAGE LOGIC (js/projects.js)
 * Renders portfolio projects from window.PORTFOLIO_DATA.projects, or a clean
 * workshop slate when the projects array is empty.
 */

(function () {
  "use strict";

  const escapeHtml = (str) =>
    window.JD && window.JD.escapeHtml
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
    if (!container) return;

    const projects = Array.isArray(data.projects) ? data.projects : [];

    if (projects.length) {
      container.innerHTML = projects
        .map(
          (p) => `
        <article class="project-card reveal" id="${escapeHtml(p.id)}">
          <div class="project-head">
            <div>
              <h2 class="project-name">${escapeHtml(p.name)}</h2>
              <div class="project-cat">${escapeHtml(p.category)}</div>
            </div>
            ${p.badge ? `<span class="status-pill">${escapeHtml(p.badge)}</span>` : ""}
          </div>
          <div class="grid-2">
            <div class="project-block">
              <div class="mono-eyebrow">The Operational Challenge</div>
              <h3>${escapeHtml(p.challengeTitle || "Problem")}</h3>
              <p>${escapeHtml(p.challenge)}</p>
            </div>
            <div class="project-block">
              <div class="mono-eyebrow">Architectural Solution</div>
              <h3>${escapeHtml(p.solutionTitle || "Solution")}</h3>
              <p>${escapeHtml(p.solution)}</p>
              ${
                Array.isArray(p.highlights) && p.highlights.length
                  ? `<ul class="bullets">${p.highlights.map((h) => `<li>${escapeHtml(h)}</li>`).join("")}</ul>`
                  : ""
              }
            </div>
          </div>
          ${
            Array.isArray(p.stack) && p.stack.length
              ? `<div class="tag-row">${p.stack.map((s) => `<span class="tech-tag">${escapeHtml(s)}</span>`).join("")}</div>`
              : ""
          }
        </article>`
        )
        .join("");
    } else {
      container.innerHTML = `
        <article class="panel reveal">
          <span class="mono-eyebrow">Fresh slate</span>
          <h2 class="panel-title">New portfolio builds are in the works.</h2>
          <p class="panel-sub">
            I've cleared out the older concept projects to make room for new, purpose-built support &amp; diagnostics tooling. While those are on the workbench, you can test my live DNS &amp; SSL inspector or explore real production escalations on the main page.
          </p>
          <div class="hero-cta-row">
            <a href="/tools" class="btn btn-primary">Open Live DNS &amp; SSL Tool <span class="arrow" aria-hidden="true">→</span></a>
            <a href="/#work" class="btn btn-secondary">View Production Case Studies</a>
            <a href="/" class="btn btn-ghost">← Back to Portfolio</a>
          </div>
        </article>
      `;
    }

    if (window.JD && typeof window.JD.observeReveals === "function") {
      window.JD.observeReveals(container);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initProjects);
  } else {
    initProjects();
  }
})();
