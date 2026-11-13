/**
 * CARL — RELAXED AI SUPPORT AGENT (js/assistant.js)
 * Clean, minimal UI connected to /api/chat.php with multi-turn memory and
 * inline cards for DNS/SSL checks, Skill X-Ray, and Escalating to Jacob.
 */

(function () {
  "use strict";

  const chatHistory = [];

  function esc(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function randomTicketId() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 4; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return `JD-${code}`;
  }

  function createAssistantUI() {
    if (document.getElementById("ai-assistant-fab")) return;

    const fab = document.createElement("button");
    fab.type = "button";
    fab.id = "ai-assistant-fab";
    fab.className = "ai-fab";
    fab.setAttribute("aria-label", "Chat with Carl");
    fab.innerHTML = `
      <span class="ai-fab-avatar-wrap">
        <img src="/assets/jacob-davis.png" alt="" class="ai-fab-avatar" width="26" height="26" />
        <span class="ai-online-dot" aria-hidden="true"></span>
      </span>
      <span class="ai-fab-label">Ask Carl</span>
    `;

    const drawer = document.createElement("aside");
    drawer.id = "ai-assistant-drawer";
    drawer.className = "ai-drawer";
    drawer.setAttribute("aria-label", "Chat with Carl");
    drawer.innerHTML = `
      <div class="ai-drawer-header">
        <div class="ai-drawer-brand">
          <div class="ai-avatar-wrap">
            <img src="/assets/jacob-davis.png" alt="Carl" class="ai-avatar" width="38" height="38" />
            <span class="ai-online-dot" aria-hidden="true"></span>
          </div>
          <div>
            <div class="ai-drawer-title">Carl</div>
            <div class="ai-drawer-sub">Online</div>
          </div>
        </div>
        <div class="ai-header-actions">
          <button type="button" class="btn btn-ghost btn-sm" id="ai-reset-btn" title="New conversation">Clear</button>
          <button type="button" class="btn btn-secondary btn-sm" id="ai-close-btn">Close</button>
        </div>
      </div>
      <div class="ai-messages" id="ai-messages"></div>
      <form class="ai-input-form" id="ai-input-form">
        <label for="ai-input-field" class="visually-hidden">Message Carl</label>
        <input type="text" class="text-input" id="ai-input-field" placeholder="Message Carl..." autocomplete="off" />
        <button type="submit" class="btn btn-primary btn-sm" id="ai-send-btn">Send</button>
      </form>
    `;

    document.body.appendChild(fab);
    document.body.appendChild(drawer);

    const closeBtn = document.getElementById("ai-close-btn");
    const resetBtn = document.getElementById("ai-reset-btn");
    const form = document.getElementById("ai-input-form");
    const input = document.getElementById("ai-input-field");
    const messagesEl = document.getElementById("ai-messages");

    function renderWelcome() {
      messagesEl.innerHTML = "";
      appendMessage("model", "Heyyo! 👋 I'm Carl. How can I help?");
    }

    renderWelcome();

    fab.addEventListener("click", () => {
      drawer.classList.toggle("open");
      if (drawer.classList.contains("open")) {
        input.focus();
      }
    });

    closeBtn.addEventListener("click", () => {
      drawer.classList.remove("open");
    });

    resetBtn.addEventListener("click", () => {
      chatHistory.length = 0;
      renderWelcome();
      input.focus();
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      input.value = "";
      sendMessage(text);
    });

    function appendMessage(role, text) {
      const div = document.createElement("div");
      div.className = `ai-msg ${role}`;
      div.textContent = text;
      messagesEl.appendChild(div);
      messagesEl.scrollTop = messagesEl.scrollHeight;
      return div;
    }

    function appendCard(cardEl) {
      messagesEl.appendChild(cardEl);
      messagesEl.scrollTop = messagesEl.scrollHeight;
      return cardEl;
    }

    async function sendMessage(text) {
      appendMessage("user", text);
      const thinkingEl = appendMessage("model", "...");

      try {
        const res = await fetch("/api/chat.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            history: chatHistory.slice(-8),
            currentPage: window.location.pathname || "/"
          })
        });

        const payload = await res.json();
        if (!res.ok || payload.error) {
          thinkingEl.textContent =
            payload.error ||
            "Live chat isn't available right here, but you can still email Jacob at jacobdavissupport@gmail.com or explore the site!";
          if (/escalate|hire|contact|bug|help/i.test(text)) {
            appendCard(
              buildEscalationCard({
                reason: "Direct Handoff Request",
                priority: "Hiring",
                summary: text
              })
            );
          }
          return;
        }

        const reply = payload.reply || "Got it!";
        thinkingEl.textContent = reply;
        chatHistory.push({ role: "user", text });
        chatHistory.push({ role: "model", text: reply });

        if (Array.isArray(payload.tool_calls)) {
          handleToolCalls(payload.tool_calls, appendMessage, appendCard);
        }
      } catch (_err) {
        thinkingEl.textContent =
          "Can't reach /api/chat.php in this preview, but you can still reach Jacob at jacobdavissupport@gmail.com!";
        if (/escalate|hire|contact|bug|help/i.test(text)) {
          appendCard(
            buildEscalationCard({
              reason: "Direct Handoff Request",
              priority: "Hiring",
              summary: text
            })
          );
        }
      }
    }
  }

  function buildEscalationCard(args) {
    const ticketId = randomTicketId();
    const reason = args.reason || "Handoff to Jacob";
    const priority = args.priority || "Normal";
    const summary = args.summary || "Visitor requested follow-up from Jacob Davis.";

    const card = document.createElement("div");
    card.className = "ai-ticket-card";
    card.innerHTML = `
      <div class="ai-ticket-top">
        <span class="ai-ticket-id">#${esc(ticketId)}</span>
        <span class="ai-ticket-badge ai-ticket-badge--${esc(priority.toLowerCase())}">${esc(priority)}</span>
      </div>
      <div class="ai-ticket-title">${esc(reason)}</div>
      <p class="ai-ticket-summary">${esc(summary)}</p>
      <div class="ai-ticket-fields">
        <input type="text" class="text-input ai-ticket-name" placeholder="Your name (optional)" aria-label="Your name" />
        <input type="email" class="text-input ai-ticket-email" placeholder="Your email for Jacob's reply" aria-label="Your email" />
        <textarea class="text-input ai-ticket-notes" rows="2" placeholder="Extra details..." aria-label="Additional notes"></textarea>
      </div>
      <div class="ai-ticket-actions">
        <button type="button" class="btn btn-primary btn-sm ai-ticket-send">Send to Jacob</button>
        <button type="button" class="btn btn-secondary btn-sm ai-ticket-copy">Copy</button>
        <a class="btn btn-ghost btn-sm ai-ticket-mailto" href="#">Open Email</a>
      </div>
      <div class="ai-ticket-status" aria-live="polite"></div>
    `;

    const nameEl = card.querySelector(".ai-ticket-name");
    const emailEl = card.querySelector(".ai-ticket-email");
    const notesEl = card.querySelector(".ai-ticket-notes");
    const sendBtn = card.querySelector(".ai-ticket-send");
    const copyBtn = card.querySelector(".ai-ticket-copy");
    const mailtoLink = card.querySelector(".ai-ticket-mailto");
    const statusEl = card.querySelector(".ai-ticket-status");

    function buildPayloadText() {
      return [
        `Case ID: #${ticketId}`,
        `Priority: ${priority}`,
        `Reason: ${reason}`,
        `From: ${nameEl.value.trim() || "Portfolio Visitor"} (${emailEl.value.trim() || "No email provided"})`,
        `Summary: ${summary}`,
        notesEl.value.trim() ? `Notes: ${notesEl.value.trim()}` : ""
      ]
        .filter(Boolean)
        .join("\n");
    }

    function updateMailto() {
      const subject = encodeURIComponent(`[#${ticketId}] ${reason}`);
      const body = encodeURIComponent(buildPayloadText());
      mailtoLink.href = `mailto:jacobdavissupport@gmail.com?subject=${subject}&body=${body}`;
    }

    updateMailto();
    [nameEl, emailEl, notesEl].forEach((el) => el.addEventListener("input", updateMailto));

    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(buildPayloadText());
        copyBtn.textContent = "✓ Copied";
        setTimeout(() => (copyBtn.textContent = "Copy"), 2000);
      } catch (_e) {
        statusEl.textContent = "Copy blocked — use Open Email.";
      }
    });

    sendBtn.addEventListener("click", async () => {
      sendBtn.disabled = true;
      sendBtn.textContent = "Sending...";
      statusEl.textContent = "";
      try {
        const res = await fetch("/api/escalate.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ticketId,
            priority,
            reason,
            summary,
            visitorName: nameEl.value.trim(),
            visitorEmail: emailEl.value.trim(),
            notes: notesEl.value.trim()
          })
        });
        const data = await res.json();
        if (!res.ok || data.error) {
          statusEl.textContent = data.error || "Could not send automatically — use Open Email or Copy.";
          sendBtn.disabled = false;
          sendBtn.textContent = "Send to Jacob";
          return;
        }
        statusEl.textContent = data.delivered
          ? `✓ Sent #${ticketId} to Jacob!`
          : `✓ Logged #${ticketId} — use Open Email or Copy to send directly.`;
        sendBtn.textContent = data.delivered ? "✓ Sent" : "Logged ✓";
      } catch (_err) {
        statusEl.textContent = "Offline/preview mode — use Open Email or Copy.";
        sendBtn.disabled = false;
        sendBtn.textContent = "Send to Jacob";
      }
    });

    return card;
  }

  function buildDnsCard(domain) {
    const card = document.createElement("div");
    card.className = "ai-tool-card";
    card.innerHTML = `
      <div class="ai-tool-head">
        <span class="mono-eyebrow">DNS &amp; SSL CHECK</span>
        <span class="ai-tool-domain">${esc(domain)}</span>
      </div>
      <div class="ai-tool-body">Checking DNS records &amp; TLS...</div>
      <div class="ai-tool-foot">
        <a href="/tools?domain=${encodeURIComponent(domain)}" class="ai-tool-link">Open full DNS Inspector →</a>
      </div>
    `;

    const bodyEl = card.querySelector(".ai-tool-body");
    fetch(`/api/dns-lookup.php?domain=${encodeURIComponent(domain)}`)
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (!ok || d.error) {
          bodyEl.textContent = d.error || "Live DNS lookup requires PHP hosting.";
          return;
        }
        const recs = d.records || {};
        const aList = (recs.A || []).slice(0, 2).map((r) => r.ip || r.target || r).join(", ") || "—";
        const mxList = (recs.MX || []).slice(0, 2).map((r) => r.target || r).join(", ") || "—";
        const nsList = (recs.NS || []).slice(0, 2).map((r) => r.target || r).join(", ") || "—";
        const ssl = d.ssl || {};
        const sslText = ssl.valid
          ? `Valid (${ssl.issuer || "TLS 1.3"}${ssl.validTo ? ` · exp ${ssl.validTo}` : ""})`
          : ssl.error || "Not detected / HTTP only";

        bodyEl.innerHTML = `
          <div class="ai-dns-grid">
            <span><strong>A:</strong> ${esc(aList)}</span>
            <span><strong>NS:</strong> ${esc(nsList)}</span>
            <span><strong>MX:</strong> ${esc(mxList)}</span>
            <span><strong>SSL:</strong> ${esc(sslText)}</span>
          </div>
        `;
      })
      .catch(() => {
        bodyEl.textContent = "Live DNS check unavailable in local preview. Try it at /tools!";
      });

    return card;
  }

  function buildSkillXrayCard(args) {
    const card = document.createElement("div");
    card.className = "ai-tool-card";
    const matches = Array.isArray(args.matches) ? args.matches : [];
    const rows = matches
      .map(
        (m) => `
        <button type="button" class="ai-xray-row" data-evidence-id="${esc(m.evidenceId || "")}">
          <span class="ai-xray-comp">${esc(m.competency || "")}</span>
          <span class="ai-xray-score">${esc(m.score || 95)}%</span>
        </button>`
      )
      .join("");

    card.innerHTML = `
      <div class="ai-tool-head">
        <span class="mono-eyebrow">SKILL X-RAY</span>
        <span class="ai-xray-overall">${esc(args.overallScore || 96)}% Match</span>
      </div>
      <div class="ai-tool-domain">${esc(args.targetRole || "Technical Support Role")}</div>
      <div class="ai-xray-list">${rows}</div>
    `;

    card.querySelectorAll(".ai-xray-row").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-evidence-id");
        const el = id ? document.getElementById(id) : null;
        if (el) {
          el.classList.add("xray-highlight");
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      });
    });

    return card;
  }

  function handleToolCalls(toolCalls, appendMessage, appendCard) {
    toolCalls.forEach((tc) => {
      const name = tc.name;
      const args = tc.args || {};

      if (name === "escalate_to_jacob") {
        if (appendCard) appendCard(buildEscalationCard(args));
      } else if (name === "toggle_juan_mode") {
        if (typeof window.toggleJuanMode === "function") {
          window.toggleJuanMode(Boolean(args.enabled));
        } else {
          sessionStorage.setItem("juan_pending", args.enabled ? "1" : "0");
          window.location.href = "/#top";
        }
      } else if (name === "navigate_portfolio") {
        const target = args.section || args.target || "";
        const map = {
          hero: "/#top",
          experience: "/#experience",
          projects: "/projects",
          skills: "/#toolkit",
          resume: "/resume",
          tools: "/tools",
          contact: "/#contact",
          tab_orderflow: "/projects#orderflow",
          tab_omniorder: "/projects#omniorder",
          tab_brandsync: "/projects#brandsync"
        };
        const dest = map[target];
        if (dest) {
          if (dest.startsWith("/#") && window.location.pathname === "/") {
            const el = document.querySelector(dest.slice(1));
            if (el) el.scrollIntoView({ behavior: "smooth" });
          } else {
            window.location.href = dest;
          }
        }
      } else if (name === "run_dns_audit") {
        const domain = args.domain || "jacobdavis.tech";
        if (typeof window.runLiveDnsLookup === "function") {
          window.runLiveDnsLookup(domain);
        }
        if (appendCard) {
          appendCard(buildDnsCard(domain));
        }
      } else if (name === "evaluate_skill_match") {
        const matches = Array.isArray(args.matches) ? args.matches : [];
        document.querySelectorAll(".xray-highlight").forEach((el) => {
          el.classList.remove("xray-highlight");
        });
        let firstHighlighted = null;
        matches.forEach((m) => {
          const id = m.evidenceId || "";
          const el = document.getElementById(id);
          if (el) {
            el.classList.add("xray-highlight");
            if (!firstHighlighted) firstHighlighted = el;
          }
        });
        if (appendCard) appendCard(buildSkillXrayCard(args));
        if (firstHighlighted) {
          firstHighlighted.scrollIntoView({ behavior: "smooth", block: "center" });
        } else if (appendMessage && args.summary) {
          appendMessage("model", args.summary);
        }
      } else if (name === "customize_storefront") {
        const brand = args.brandName || "Custom Storefront";
        const accent = args.primaryColor || args.themeColor || "#10b981";
        if (typeof window.applyBrandSyncSandbox === "function") {
          window.applyBrandSyncSandbox({ brandName: brand, primaryColor: accent, ...args });
        } else {
          sessionStorage.setItem("brandsync_pending", JSON.stringify(args));
          window.location.href = "/projects#brandsync";
        }
      }
    });
  }

  document.addEventListener("DOMContentLoaded", createAssistantUI);
})();
