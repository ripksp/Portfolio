/**
 * JACOB DAVIS — PORTFOLIO & LIVING RESUME APPLICATION LOGIC (js/app.js)
 * Renders from window.PORTFOLIO_DATA (data/profile.js) so a single file edit
 * updates both the interactive website and the printable Living Resume.
 */

(function () {
  "use strict";

  const data = window.PORTFOLIO_DATA;
  if (!data) {
    console.error("PORTFOLIO_DATA not found. Check data/profile.js.");
    return;
  }

  /* ------------------------------------------------------------------------
     1. RENDER PORTFOLIO SECTIONS FROM SINGLE SOURCE OF TRUTH
     ------------------------------------------------------------------------ */
  function renderHero() {
    const eyebrowEl = document.getElementById("hero-eyebrow");
    const titleEl = document.getElementById("hero-title");
    const leadEl = document.getElementById("hero-lead");
    const metricsEl = document.getElementById("hero-metrics-grid");

    if (eyebrowEl) eyebrowEl.textContent = data.hero.eyebrow;
    if (titleEl) titleEl.textContent = data.hero.headline;
    if (leadEl) leadEl.textContent = data.hero.lead;

    if (metricsEl) {
      metricsEl.innerHTML = data.hero.metrics
        .map(
          (m, idx) => `
          <article class="surface-card metric-card" id="metric-card-${idx}">
            <div class="metric-value">${escapeHtml(m.value)}</div>
            <div class="metric-label">${escapeHtml(m.label)}</div>
            <div class="metric-detail">${escapeHtml(m.detail)}</div>
          </article>
        `
        )
        .join("");
    }
  }

  function renderPillars() {
    const grid = document.getElementById("pillars-grid");
    if (!grid) return;

    grid.innerHTML = data.pillars
      .map(
        (p) => `
        <article class="surface-card" id="${escapeHtml(p.id)}">
          <span class="pillar-code">${escapeHtml(p.code)}</span>
          <h3 class="pillar-title">${escapeHtml(p.title)}</h3>
          <p class="pillar-desc">${escapeHtml(p.description)}</p>
          <div class="tag-row">
            ${p.tags
              .map((t) => `<span class="tech-tag">${escapeHtml(t)}</span>`)
              .join("")}
          </div>
        </article>
      `
      )
      .join("");
  }

  function renderCaseStudies() {
    const grid = document.getElementById("cases-grid");
    if (!grid) return;

    grid.innerHTML = data.caseStudies
      .map(
        (cs, idx) => `
        <article class="surface-card case-card" id="${escapeHtml(cs.id)}" data-case-index="${idx}">
          <div>
            <div class="case-meta">
              <span class="case-org">${escapeHtml(cs.organization)}</span>
              <span class="case-category">${escapeHtml(cs.category)}</span>
            </div>
            <h3 class="case-title">${escapeHtml(cs.title)}</h3>

            <div class="case-stage-tabs" role="tablist" aria-label="Diagnostic stages">
              <button type="button" class="stage-tab active" data-stage="problem" id="${escapeHtml(cs.id)}-tab-problem">01. Incident</button>
              <button type="button" class="stage-tab" data-stage="diagnostics" id="${escapeHtml(cs.id)}-tab-diagnostics">02. Diagnosis</button>
              <button type="button" class="stage-tab" data-stage="resolution" id="${escapeHtml(cs.id)}-tab-resolution">03. Fix</button>
            </div>

            <p class="case-stage-body" id="${escapeHtml(cs.id)}-stage-body">
              ${escapeHtml(cs.problem)}
            </p>
          </div>

          <div>
            <div class="case-impact-banner">
              ✓ ${escapeHtml(cs.metrics)}
            </div>
            <div class="tag-row">
              ${cs.tags
                .map((t) => `<span class="tech-tag">${escapeHtml(t)}</span>`)
                .join("")}
            </div>
          </div>
        </article>
      `
      )
      .join("");

    // Attach interactive stage tab listeners
    grid.querySelectorAll(".case-card").forEach((card) => {
      const idx = Number(card.getAttribute("data-case-index"));
      const cs = data.caseStudies[idx];
      const bodyEl = card.querySelector(".case-stage-body");
      const tabs = card.querySelectorAll(".stage-tab");

      tabs.forEach((tab) => {
        tab.addEventListener("click", () => {
          tabs.forEach((t) => t.classList.remove("active"));
          tab.classList.add("active");
          const stage = tab.getAttribute("data-stage");
          if (bodyEl && cs[stage]) {
            bodyEl.textContent = cs[stage];
          }
        });
      });
    });
  }

  function renderExperience() {
    const container = document.getElementById("experience-list");
    if (!container) return;

    container.innerHTML = data.experience
      .map(
        (exp) => `
        <article class="surface-card exp-card" id="${escapeHtml(exp.id)}">
          <div class="exp-header">
            <div class="exp-role-group">
              <h3 class="exp-role">${escapeHtml(exp.role)}</h3>
              <span class="exp-company">@ ${escapeHtml(exp.company)} · ${escapeHtml(exp.location)}</span>
            </div>
            <span class="exp-period">${escapeHtml(exp.period)}</span>
          </div>
          <p class="exp-summary">${escapeHtml(exp.summary)}</p>
          <ul class="exp-bullets">
            ${exp.bullets
              .map((b) => `<li>${escapeHtml(b)}</li>`)
              .join("")}
          </ul>
          <div class="tag-row">
            ${exp.skills
              .map((s) => `<span class="tech-tag">${escapeHtml(s)}</span>`)
              .join("")}
          </div>
        </article>
      `
      )
      .join("");
  }

  function renderSkillsStack() {
    const grid = document.getElementById("stack-grid");
    if (!grid) return;

    grid.innerHTML = data.skillsCategories
      .map(
        (cat, idx) => `
        <article class="surface-card" id="stack-cat-${idx}">
          <div class="stack-header">
            <h3 class="stack-title">${escapeHtml(cat.category)}</h3>
            <span class="stack-code">${escapeHtml(cat.code)}</span>
          </div>
          <div class="tag-row">
            ${cat.items
              .map((item) => `<span class="tech-tag">${escapeHtml(item)}</span>`)
              .join("")}
          </div>
        </article>
      `
      )
      .join("");
  }

  function renderRecognitionAndCommunity() {
    const grid = document.getElementById("recognition-grid");
    if (!grid) return;

    grid.innerHTML = data.recognitionAndCommunity
      .map(
        (item, idx) => `
        <article class="surface-card" id="recognition-card-${idx}">
          <span class="rec-badge">${escapeHtml(item.type)}</span>
          <h3 class="rec-title">${escapeHtml(item.title)}</h3>
          <div class="rec-org">${escapeHtml(item.org)} · ${escapeHtml(item.period)}</div>
          <p class="rec-desc">${escapeHtml(item.description)}</p>
        </article>
      `
      )
      .join("");
  }

  function renderPhilosophyAndLab() {
    const philContainer = document.getElementById("philosophy-paragraphs");
    if (philContainer) {
      philContainer.innerHTML = data.summary.philosophyParagraphs
        .map((p) => `<p>${escapeHtml(p)}</p>`)
        .join("");
    }

    const labContainer = document.getElementById("lab-preview-list");
    if (labContainer && data.roadmapPreview) {
      labContainer.innerHTML = data.roadmapPreview
        .map(
          (tool, idx) => `
          <div class="lab-item" id="lab-tool-${idx}">
            <div class="lab-item-head">
              <span class="lab-item-name">${escapeHtml(tool.name)}</span>
              <span class="lab-item-status">${escapeHtml(tool.status)}</span>
            </div>
            <p class="lab-item-desc">${escapeHtml(tool.description)}</p>
          </div>
        `
        )
        .join("");
    }
  }

  /* ------------------------------------------------------------------------
     2. RENDER LIVING RESUME VIEW FROM SINGLE SOURCE OF TRUTH
     ------------------------------------------------------------------------ */
  function renderLivingResume() {
    const target = document.getElementById("resume-sheet-content");
    if (!target) return;

    const m = data.meta;

    const skillsRowsHtml = data.skillsCategories
      .map(
        (cat) => `
        <div class="resume-skill-cat">${escapeHtml(cat.category)}</div>
        <div class="resume-skill-items">${cat.items.map(escapeHtml).join(" · ")}</div>
      `
      )
      .join("");

    const experienceHtml = data.experience
      .map(
        (exp) => `
        <div class="resume-exp-item">
          <div class="resume-exp-top">
            <div>
              <span class="resume-exp-title">${escapeHtml(exp.role)}</span>
              <span class="resume-exp-org"> — ${escapeHtml(exp.company)} (${escapeHtml(exp.location)})</span>
            </div>
            <span class="resume-exp-dates">${escapeHtml(exp.period)}</span>
          </div>
          <ul class="resume-exp-bullets">
            ${exp.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}
          </ul>
        </div>
      `
      )
      .join("");

    const awardsHtml = data.recognitionAndCommunity
      .map(
        (r) =>
          `<li><strong>${escapeHtml(r.title)} (${escapeHtml(r.org)}, ${escapeHtml(r.period)}):</strong> ${escapeHtml(r.description)}</li>`
      )
      .join("");

    const educationHtml = data.education
      .map(
        (ed) =>
          `<li><strong>${escapeHtml(ed.institution)}</strong> (${escapeHtml(ed.location)}) — ${escapeHtml(ed.credential)} · ${escapeHtml(ed.detail)}</li>`
      )
      .join("");

    target.innerHTML = `
      <header class="resume-sheet-header">
        <div>
          <h1 class="resume-name">${escapeHtml(m.name)}</h1>
          <div class="resume-role-title">${escapeHtml(m.title)}</div>
        </div>
        <div class="resume-contact-list">
          <div>${escapeHtml(m.location)} · ${escapeHtml(m.availability)}</div>
          <div><a href="mailto:${escapeHtml(m.email)}">${escapeHtml(m.email)}</a> · ${escapeHtml(m.phone)}</div>
          <div><a href="${escapeHtml(m.websiteUrl)}" target="_blank" rel="noopener">${escapeHtml(m.domain)}</a> · <a href="${escapeHtml(m.githubUrl)}" target="_blank" rel="noopener">${escapeHtml(m.githubHandle)}</a></div>
        </div>
      </header>

      <section class="resume-section">
        <h2 class="resume-section-heading">Professional Summary</h2>
        <p class="resume-summary-text">${escapeHtml(data.summary.resumeSummary)}</p>
      </section>

      <section class="resume-section">
        <h2 class="resume-section-heading">Core Technical Competencies</h2>
        <div class="resume-skills-table">
          ${skillsRowsHtml}
        </div>
      </section>

      <section class="resume-section">
        <h2 class="resume-section-heading">Professional Experience</h2>
        ${experienceHtml}
      </section>

      <section class="resume-section">
        <h2 class="resume-section-heading">Awards, KPI Recognition & Community Leadership</h2>
        <ul class="resume-exp-bullets">
          ${awardsHtml}
        </ul>
      </section>

      <section class="resume-section" style="margin-bottom: 0;">
        <h2 class="resume-section-heading">Education</h2>
        <ul class="resume-exp-bullets">
          ${educationHtml}
        </ul>
      </section>
    `;
  }

  /* ------------------------------------------------------------------------
     3. VIEW SWITCHER, SPOTLIGHT TRACKING & EMAIL COPY INTERACTIONS
     ------------------------------------------------------------------------ */
  function setupViewSwitcher() {
    const btnPortfolio = document.getElementById("switch-portfolio-btn");
    const btnResume = document.getElementById("switch-resume-btn");
    const heroResumeBtn = document.getElementById("hero-open-resume-btn");
    const printBtn = document.getElementById("resume-print-btn");

    function setView(viewName) {
      document.body.setAttribute("data-view", viewName);
      if (btnPortfolio && btnResume) {
        btnPortfolio.classList.toggle("active", viewName === "portfolio");
        btnResume.classList.toggle("active", viewName === "resume");
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    if (btnPortfolio) {
      btnPortfolio.addEventListener("click", () => {
        history.replaceState(null, "", "#portfolio");
        setView("portfolio");
      });
    }

    if (btnResume) {
      btnResume.addEventListener("click", () => {
        history.replaceState(null, "", "#resume");
        setView("resume");
      });
    }

    if (heroResumeBtn) {
      heroResumeBtn.addEventListener("click", () => {
        history.replaceState(null, "", "#resume");
        setView("resume");
      });
    }

    if (printBtn) {
      printBtn.addEventListener("click", () => {
        setView("resume");
        setTimeout(() => window.print(), 100);
      });
    }

    // Check URL hash on load
    if (window.location.hash === "#resume") {
      setView("resume");
    }
  }

  function setupCardSpotlight() {
    document.addEventListener("mousemove", (e) => {
      const cards = document.querySelectorAll(".surface-card");
      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty("--mouse-x", `${x}px`);
        card.style.setProperty("--mouse-y", `${y}px`);
      });
    });
  }

  function setupEmailCopy() {
    const copyBtns = document.querySelectorAll("[data-copy-email]");
    copyBtns.forEach((btn) => {
      btn.addEventListener("click", async () => {
        const email = data.meta.email;
        const originalText = btn.textContent;
        try {
          await navigator.clipboard.writeText(email);
          btn.textContent = "✓ Copied jacobdavissupport@gmail.com";
          setTimeout(() => {
            btn.textContent = originalText;
          }, 2400);
        } catch (_err) {
          window.location.href = `mailto:${email}`;
        }
      });
    });
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /* Initialize Application */
  document.addEventListener("DOMContentLoaded", () => {
    renderHero();
    renderPillars();
    renderCaseStudies();
    renderExperience();
    renderSkillsStack();
    renderRecognitionAndCommunity();
    renderPhilosophyAndLab();
    renderLivingResume();
    setupViewSwitcher();
    setupCardSpotlight();
    setupEmailCopy();
  });
})();
