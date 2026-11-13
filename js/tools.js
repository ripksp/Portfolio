/**
 * LIVE DNS & SSL DIAGNOSTIC SUITE LOGIC (js/tools.js)
 * Connects to /api/dns-lookup.php and renders outage scenarios from window.PORTFOLIO_DATA.
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

  window.runLiveDnsLookup = async function (domainInput) {
    const domain = String(domainInput || "").trim();
    if (!domain) return;

    const input = document.getElementById("dns-domain-input");
    const pill = document.getElementById("dns-status-pill");
    const timing = document.getElementById("dns-timing");
    const dnsTableEl = document.getElementById("dns-records-table");
    const sslTableEl = document.getElementById("ssl-cert-table");
    if (!input || !pill || !timing || !dnsTableEl || !sslTableEl) return;

    const dnsTable = dnsTableEl.querySelector("tbody");
    const sslTable = sslTableEl.querySelector("tbody");

    input.value = domain;
    pill.className = "status-pill";
    pill.textContent = `Querying ${domain}...`;
    timing.textContent = "";

    try {
      const res = await fetch(`/api/dns-lookup.php?domain=${encodeURIComponent(domain)}`);
      const data = await res.json();

      if (!res.ok || data.status !== "success") {
        pill.className = "status-pill warn";
        pill.textContent = data.message || "DNS query returned an error";
        return;
      }

      pill.textContent = `✓ ${data.domain} Resolved`;
      timing.textContent = `${data.query_time_ms} ms · ${data.server_resolver || "Live Resolver"}`;

      const d = data.dns || {};
      const formatRecs = (arr, fn) =>
        arr && arr.length ? arr.map(fn).join("<br>") : "<span class=\"muted\">None</span>";

      dnsTable.innerHTML = `
        <tr><th>A</th><td>${formatRecs(d.a, (r) => `${escapeHtml(r.ip)} (TTL ${escapeHtml(r.ttl)})`)}</td></tr>
        <tr><th>AAAA</th><td>${formatRecs(d.aaaa, (r) => `${escapeHtml(r.ipv6)} (TTL ${escapeHtml(r.ttl)})`)}</td></tr>
        <tr><th>CNAME</th><td>${formatRecs(d.cname, (r) => `${escapeHtml(r.target)} (TTL ${escapeHtml(r.ttl)})`)}</td></tr>
        <tr><th>NS</th><td>${formatRecs(d.ns, (r) => escapeHtml(r.target))}</td></tr>
        <tr><th>MX</th><td>${formatRecs(d.mx, (r) => `[${escapeHtml(r.pri)}] ${escapeHtml(r.target)}`)}</td></tr>
        <tr><th>TXT</th><td>${formatRecs(d.txt, (r) => escapeHtml(r.txt))}</td></tr>
      `;

      const s = data.ssl || {};
      const badgeClass = s.status === "ACTIVE" ? "" : "warn";
      const sans = Array.isArray(s.san) && s.san.length ? s.san.map(escapeHtml).join(", ") : "None";
      sslTable.innerHTML = `
        <tr><th>Status</th><td><span class="status-pill ${badgeClass}">${escapeHtml(s.status || "NONE")}</span></td></tr>
        <tr><th>Issuer</th><td>${escapeHtml(s.issuer || "N/A")}</td></tr>
        <tr><th>Subject</th><td>${escapeHtml(s.subject || "N/A")}</td></tr>
        <tr><th>Valid</th><td>${escapeHtml(s.valid_from || "—")} → ${escapeHtml(s.valid_to || "—")} (${escapeHtml(s.days_remaining ?? "?")} days left)</td></tr>
        <tr><th>SANs</th><td>${sans}</td></tr>
      `;
    } catch (_err) {
      pill.className = "status-pill warn";
      pill.textContent = "PHP backend unavailable in static preview (live on Bluehost)";
    }
  };

  function renderOutageScenarios() {
    const grid = document.getElementById("outage-scenarios-grid");
    const scenarios = window.PORTFOLIO_DATA && window.PORTFOLIO_DATA.tools && window.PORTFOLIO_DATA.tools.outageScenarios;
    if (!grid || !Array.isArray(scenarios)) return;

    grid.innerHTML = scenarios
      .map((sc) => {
        const sev = String(sc.severity || "").toLowerCase();
        const sevClass = sev === "critical" ? "critical" : sev === "medium" ? "medium" : "";
        return `
        <article class="scenario-card" id="${escapeHtml(sc.id)}">
          <div class="scenario-head">
            <span class="mono-eyebrow">${escapeHtml(sc.category)}</span>
            <span class="sev ${sevClass}">${escapeHtml(sc.severity)}</span>
          </div>
          <h3>${escapeHtml(sc.title)}</h3>
          <p>${escapeHtml(sc.symptom)}</p>
          <div class="artifact">${escapeHtml(sc.sampleArtifact)}</div>
          <p><strong>Resolution:</strong> ${escapeHtml(sc.resolution)}</p>
        </article>`;
      })
      .join("");
  }

  function initTools() {
    const form = document.getElementById("dns-lookup-form");
    const input = document.getElementById("dns-domain-input");
    if (form && input) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        window.runLiveDnsLookup(input.value);
      });
    }

    document.querySelectorAll("[data-quick-domain]").forEach((btn) => {
      btn.addEventListener("click", () => {
        window.runLiveDnsLookup(btn.getAttribute("data-quick-domain"));
      });
    });

    renderOutageScenarios();

    const params = new URLSearchParams(window.location.search);
    if (params.get("domain")) {
      window.runLiveDnsLookup(params.get("domain"));
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTools);
  } else {
    initTools();
  }
})();
