/**
 * JACOB DAVIS — PORTFOLIO APPLICATION LOGIC (js/app.js)
 * Renders from window.PORTFOLIO_DATA (data/profile.js) so a single file edit
 * updates the homepage, the /resume Living Resume, and shared UI on subpages.
 *
 * NOTE: The site CSP blocks inline <script> and inline style attributes,
 * so never emit style="" in templates below — use classes in css/styles.css.
 */

(function () {
  "use strict";

  document.documentElement.classList.add("js");

  const data = window.PORTFOLIO_DATA || null;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function escapeHtml(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  const tags = (list) =>
    (list || []).map((t) => `<span class="tech-tag">${escapeHtml(t)}</span>`).join("");

  /* ------------------------------------------------------------------------
     1. HOMEPAGE RENDERERS
     ------------------------------------------------------------------------ */
  function renderMarquee() {
    const track = $("#marquee-track");
    if (!track || !data.marquee) return;
    const group = data.marquee
      .map((item) => `<span class="marquee-item">${escapeHtml(item)}</span>`)
      .join("");
    // Two identical groups → seamless -50% loop. Second copy hidden from AT.
    track.innerHTML = `
      <div class="marquee-group">${group}</div>
      <div class="marquee-group" aria-hidden="true">${group}</div>
    `;
  }

  function renderStats() {
    const el = $("#hero-metrics-grid");
    if (!el) return;
    el.innerHTML = data.hero.metrics
      .map(
        (m) => `
        <div class="stat-tile">
          <div class="stat-value">${escapeHtml(m.value)}</div>
          <div class="stat-label">${escapeHtml(m.label)}</div>
          <div class="stat-detail">${escapeHtml(m.detail)}</div>
        </div>`
      )
      .join("");
  }

  function renderStory() {
    const el = $("#philosophy-paragraphs");
    if (!el) return;
    el.innerHTML = data.summary.philosophyParagraphs
      .map((p) => `<p>${escapeHtml(p)}</p>`)
      .join("");
  }

  function renderPillars() {
    const el = $("#pillars-grid");
    if (!el) return;
    el.innerHTML = data.pillars
      .map((p) => {
        const num = String(p.code || "").split("//")[0].trim();
        return `
        <article class="pillar-card reveal" id="${escapeHtml(p.id)}">
          <span class="pillar-num">${escapeHtml(num)}</span>
          <h3 class="pillar-title">${escapeHtml(p.title)}</h3>
          <p class="pillar-desc">${escapeHtml(p.description)}</p>
          <div class="tag-row">${tags(p.tags.slice(0, 3))}</div>
        </article>`;
      })
      .join("");
  }

  const CARD_ART = {
    "case-dns": { glyph: "DNS", code: "order  CNAME  edge\napex   A      ✕ loop\nTLS    1.3    ✓" },
    "case-api": { glyph: "API", code: "POST /authorize\n→ 504 timeout\n→ 200 OK  ✓" },
    "case-network": { glyph: "VLAN", code: "VLAN 20  POS_PROD\nDHCP     .20–.39\nGuest →  VLAN 99" },
    orderflow: { glyph: "ESC/POS", code: "queue  idem_9f2a\nretry  2  ✓\nprint  TM-T88VI" },
    omniorder: { glyph: "KDS", code: "hmac   sha256 ✓\nschema canonical-v1\n86'd   → 3 targets" },
    brandsync: { glyph: "SSL", code: "cname  verified ✓\nacme   issued\ntheme  #10b981" }
  };

  function renderWork() {
    const grid = $("#work-grid");
    if (!grid) return;

    const caseCards = data.caseStudies.map((cs, idx) => {
      const art = CARD_ART[cs.id] || { glyph: "FIX", code: "" };
      return `
      <article class="menu-card kind-case reveal" id="${escapeHtml(cs.id)}" data-kind="case">
        <div class="menu-art" aria-hidden="true">
          <span class="menu-badge">Case study</span>
          <span class="menu-art-code">${escapeHtml(art.code)}</span>
          <span class="menu-art-glyph">${escapeHtml(art.glyph)}<span>.</span></span>
        </div>
        <div class="menu-body">
          <span class="menu-org">${escapeHtml(cs.organization)}</span>
          <h3 class="menu-title">
            <button type="button" class="menu-link" data-case-index="${idx}">${escapeHtml(cs.title)}</button>
          </h3>
          <p class="menu-desc">${escapeHtml(cs.problem)}</p>
          <div class="menu-foot">
            <span class="menu-impact">${escapeHtml(cs.category)}</span>
            <span class="menu-cta" aria-hidden="true">Incident → Fix <span>→</span></span>
          </div>
        </div>
      </article>`;
    });

    const projectCards = data.projects.map((p) => {
      const art = CARD_ART[p.id] || { glyph: "SYS", code: "" };
      return `
      <article class="menu-card kind-project reveal" id="${escapeHtml(p.sandboxId || p.id)}" data-kind="project">
        <div class="menu-art" aria-hidden="true">
          <span class="menu-badge">System</span>
          <span class="menu-art-code">${escapeHtml(art.code)}</span>
          <span class="menu-art-glyph">${escapeHtml(art.glyph)}<span>.</span></span>
        </div>
        <div class="menu-body">
          <span class="menu-org">${escapeHtml(p.category)}</span>
          <h3 class="menu-title">
            <a class="menu-link" href="/projects#${encodeURIComponent(p.id)}">${escapeHtml(p.name)}</a>
          </h3>
          <p class="menu-desc">${escapeHtml(p.challenge)}</p>
          <div class="menu-foot">
            <span class="menu-impact">${escapeHtml(p.badge)}</span>
            <span class="menu-cta" aria-hidden="true">Breakdown <span>→</span></span>
          </div>
        </div>
      </article>`;
    });

    grid.innerHTML = caseCards.concat(projectCards).join("");
    setupWorkFilters();
    setupCaseDialog();
  }

  function setupWorkFilters() {
    const chips = $$(".filter-chip");
    chips.forEach((chip) => {
      chip.addEventListener("click", () => {
        const filter = chip.getAttribute("data-filter");
        chips.forEach((c) => c.setAttribute("aria-pressed", String(c === chip)));
        $$("#work-grid .menu-card").forEach((card) => {
          const show = filter === "all" || card.getAttribute("data-kind") === filter;
          card.hidden = !show;
          if (show) card.classList.add("is-visible");
        });
      });
    });
  }

  function setupCaseDialog() {
    const dialog = $("#case-dialog");
    if (!dialog || typeof dialog.showModal !== "function") return;

    const orgEl = $("#case-dialog-org");
    const titleEl = $("#case-dialog-title");
    const panelEl = $("#case-dialog-panel");
    const impactEl = $("#case-dialog-impact");
    const tagsEl = $("#case-dialog-tags");
    const tabs = $$(".step-tab", dialog);
    let current = null;
    let opener = null;

    function selectStage(stage) {
      tabs.forEach((t) => t.setAttribute("aria-selected", String(t.dataset.stage === stage)));
      if (current) panelEl.textContent = current[stage] || "";
    }

    tabs.forEach((tab, i) => {
      tab.addEventListener("click", () => selectStage(tab.dataset.stage));
      tab.addEventListener("keydown", (e) => {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        e.preventDefault();
        const next = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
        next.focus();
        selectStage(next.dataset.stage);
      });
    });

    $$("[data-case-index]").forEach((btn) => {
      btn.addEventListener("click", () => {
        current = data.caseStudies[Number(btn.dataset.caseIndex)];
        if (!current) return;
        opener = btn;
        orgEl.textContent = `${current.organization} · ${current.category}`;
        titleEl.textContent = current.title;
        impactEl.textContent = current.metrics;
        tagsEl.innerHTML = tags(current.tags);
        selectStage("problem");
        dialog.showModal();
      });
    });

    $("[data-dialog-close]", dialog).addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (e) => {
      if (e.target === dialog) dialog.close();
    });
    dialog.addEventListener("close", () => {
      if (opener) opener.focus();
    });
  }

  function renderExperience() {
    const list = $("#experience-list");
    if (!list) return;
    list.innerHTML = data.experience
      .map(
        (exp) => `
        <li class="role reveal${exp.current ? " is-current" : ""}" id="${escapeHtml(exp.id)}">
          <span class="role-dot" aria-hidden="true"></span>
          <details${exp.current ? " open" : ""}>
            <summary>
              <h3 class="role-title">${escapeHtml(exp.role)}${
                exp.current ? `<span class="current-chip"><span class="live-dot" aria-hidden="true"></span>Now</span>` : ""
              }</h3>
              <span class="role-period">${escapeHtml(exp.period)}<span class="chev" aria-hidden="true">▾</span></span>
              <span class="role-meta"><strong>${escapeHtml(exp.company)}</strong> · ${escapeHtml(exp.location)}</span>
            </summary>
            <div class="role-body">
              <p class="role-summary">${escapeHtml(exp.summary)}</p>
              <ul class="bullets">${exp.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}</ul>
              <div class="tag-row">${tags(exp.skills)}</div>
            </div>
          </details>
        </li>`
      )
      .join("");
  }

  function renderRecognition() {
    const grid = $("#recognition-grid");
    if (!grid) return;
    grid.innerHTML = data.recognitionAndCommunity
      .map(
        (r) => `
        <article class="review-card reveal" id="${escapeHtml(r.id)}">
          <div class="review-type">${escapeHtml(r.type)}</div>
          <h3 class="review-title">${escapeHtml(r.title)}</h3>
          <p class="review-desc">${escapeHtml(r.description)}</p>
          <div class="review-by">${escapeHtml(r.org)} · ${escapeHtml(r.period)}</div>
        </article>`
      )
      .join("");
  }

  function renderToolkit() {
    const grid = $("#stack-grid");
    if (!grid) return;
    grid.innerHTML = data.skillsCategories
      .map(
        (cat) => `
        <div class="toolkit-col reveal">
          <h3>${escapeHtml(cat.category)}</h3>
          <ul>${cat.items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>
        </div>`
      )
      .join("");
  }

  function renderFaq() {
    const list = $("#faq-list");
    if (!list || !data.faq) return;
    list.innerHTML = data.faq
      .map(
        (f, idx) => `
        <details class="faq-item reveal" name="faq"${idx === 0 ? " open" : ""}>
          <summary>${escapeHtml(f.q)}<span class="chev" aria-hidden="true">▾</span></summary>
          <div class="faq-answer">
            <p>${escapeHtml(f.a)}</p>
            ${f.link ? `<a href="${escapeHtml(f.link.href)}">${escapeHtml(f.link.label)} →</a>` : ""}
          </div>
        </details>`
      )
      .join("");
  }

  /* ------------------------------------------------------------------------
     2. LIVING RESUME (/resume)
     ------------------------------------------------------------------------ */
  function renderLivingResume() {
    const target = $("#resume-sheet-content");
    if (!target) return;
    const m = data.meta;

    const skills = data.skillsCategories
      .map(
        (cat) => `
        <div class="resume-skill-cat">${escapeHtml(cat.category)}</div>
        <div class="resume-skill-items">${cat.items.map(escapeHtml).join(" · ")}</div>`
      )
      .join("");

    const experience = data.experience
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
          <ul class="resume-exp-bullets">${exp.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}</ul>
        </div>`
      )
      .join("");

    const awards = data.recognitionAndCommunity
      .map(
        (r) =>
          `<li><strong>${escapeHtml(r.title)} (${escapeHtml(r.org)}, ${escapeHtml(r.period)}):</strong> ${escapeHtml(r.description)}</li>`
      )
      .join("");

    const education = data.education
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
          <div><a href="${escapeHtml(m.websiteUrl)}">${escapeHtml(m.domain)}</a> · <a href="mailto:${escapeHtml(m.email)}">${escapeHtml(m.email)}</a></div>
          <div><a href="${escapeHtml(m.linkedinUrl)}" target="_blank" rel="noopener">${escapeHtml(m.linkedinLabel)}</a> · <a href="${escapeHtml(m.githubUrl)}" target="_blank" rel="noopener">${escapeHtml(m.githubHandle)}</a></div>
        </div>
      </header>
      <section class="resume-section">
        <h2 class="resume-section-heading">Professional Summary</h2>
        <p class="resume-summary-text">${escapeHtml(data.summary.resumeSummary)}</p>
      </section>
      <section class="resume-section">
        <h2 class="resume-section-heading">Core Technical Competencies</h2>
        <div class="resume-skills-table">${skills}</div>
      </section>
      <section class="resume-section">
        <h2 class="resume-section-heading">Professional Experience</h2>
        ${experience}
      </section>
      <section class="resume-section">
        <h2 class="resume-section-heading">Awards, KPI Recognition &amp; Community Leadership</h2>
        <ul class="resume-exp-bullets">${awards}</ul>
      </section>
      <section class="resume-section">
        <h2 class="resume-section-heading">Education</h2>
        <ul class="resume-exp-bullets">${education}</ul>
      </section>`;

    const printBtn = $("#resume-print-btn");
    if (printBtn) printBtn.addEventListener("click", () => window.print());
  }

  /* ------------------------------------------------------------------------
     3. SHARED UI (all pages)
     ------------------------------------------------------------------------ */
  function setupHeader() {
    const header = $("[data-header]");
    if (!header) return;
    const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  function setupMobileNav() {
    const toggle = $("[data-menu-toggle]");
    const panel = $("#mobile-nav");
    if (!toggle || !panel) return;

    const setOpen = (open) => {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      panel.hidden = !open;
      const header = $("[data-header]");
      if (header) header.classList.toggle("is-solid", open);
    };

    toggle.addEventListener("click", () => setOpen(panel.hidden));
    $$("a", panel).forEach((a) => a.addEventListener("click", () => setOpen(false)));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !panel.hidden) {
        setOpen(false);
        toggle.focus();
      }
    });
    window.addEventListener("resize", () => {
      if (window.innerWidth > 940 && !panel.hidden) setOpen(false);
    });
  }

  function setupScrollSpy() {
    const links = $$(".nav-link[data-spy]");
    if (!links.length || !("IntersectionObserver" in window)) return;
    const byId = new Map(links.map((l) => [l.dataset.spy, l]));
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          links.forEach((l) => l.classList.remove("is-active"));
          const link = byId.get(entry.target.id);
          if (link) link.classList.add("is-active");
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    byId.forEach((_l, id) => {
      const section = document.getElementById(id);
      if (section) io.observe(section);
    });
  }

  function setupReveal() {
    const items = $$(".reveal");
    if (!("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
    );
    items.forEach((el) => io.observe(el));
  }

  function setupEmailCopy() {
    const email = (data && data.meta && data.meta.email) || "jacobdavissupport@gmail.com";
    $$("[data-copy-email]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const original = btn.textContent;
        try {
          await navigator.clipboard.writeText(email);
          btn.textContent = "✓ Copied!";
          setTimeout(() => (btn.textContent = original), 2200);
        } catch (_err) {
          window.location.href = `mailto:${email}`;
        }
      });
    });
  }

  function setupAssistantOpeners() {
    $$("[data-open-assistant]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const fab = document.getElementById("ai-assistant-fab");
        const drawer = document.getElementById("ai-assistant-drawer");
        if (fab && drawer && !drawer.classList.contains("open")) fab.click();
      });
    });
  }

  function setupYear() {
    $$("[data-year]").forEach((el) => (el.textContent = String(new Date().getFullYear())));
  }

  /* ------------------------------------------------------------------------
     4. INIT
     ------------------------------------------------------------------------ */
  function init() {
    if (data) {
      renderMarquee();
      renderStats();
      renderStory();
      renderPillars();
      renderWork();
      renderExperience();
      renderRecognition();
      renderToolkit();
      renderFaq();
      renderLivingResume();
    } else {
      console.error("PORTFOLIO_DATA not found. Check data/profile.js.");
    }
    setupHeader();
    setupMobileNav();
    setupScrollSpy();
    setupEmailCopy();
    setupAssistantOpeners();
    setupYear();
    setupReveal();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Expose escapeHtml for page scripts (projects/tools/stellar)
  window.JD = Object.assign(window.JD || {}, { escapeHtml });
})();
