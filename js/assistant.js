/**
 * JACOB DAVIS — GLOBAL GEMINI AI ASSISTANT DRAWER (js/assistant.js)
 * Connects to /api/chat.php with multi-turn memory and executes tool calls:
 * - navigate_portfolio
 * - run_dns_audit
 * - evaluate_skill_match
 * - customize_storefront
 */

(function () {
  "use strict";

  const chatHistory = [];

  function createAssistantUI() {
    if (document.getElementById("ai-assistant-fab")) return;

    const fab = document.createElement("button");
    fab.type = "button";
    fab.id = "ai-assistant-fab";
    fab.className = "ai-fab";
    fab.setAttribute("aria-label", "Open Jacob Davis AI Assistant");
    fab.innerHTML = `<span>✦</span><span>Ask AI Assistant</span>`;

    const drawer = document.createElement("aside");
    drawer.id = "ai-assistant-drawer";
    drawer.className = "ai-drawer";
    drawer.setAttribute("aria-label", "Gemini AI Portfolio Assistant");
    drawer.innerHTML = `
      <div class="ai-drawer-header">
        <div>
          <div class="ai-drawer-title">Portfolio AI Assistant</div>
          <div class="ai-drawer-sub">Gemini · Function Calling Ready</div>
        </div>
        <button type="button" class="btn btn-secondary btn-sm" id="ai-close-btn">Close</button>
      </div>
      <div class="ai-messages" id="ai-messages">
        <div class="ai-msg model">
          Hi! I'm Jacob's AI Portfolio Assistant. Ask about his DoorDash/Toast experience, run a live DNS audit, request a Skill X-Ray match, or customize a BrandSync storefront.
        </div>
      </div>
      <div class="ai-suggestions">
        <button type="button" class="ai-chip" data-prompt="Run a live DNS audit on jacobdavis.tech">DNS Audit: jacobdavis.tech</button>
        <button type="button" class="ai-chip" data-prompt="Evaluate Jacob's skill match for a Tier II Support Engineer role">Skill X-Ray Match</button>
        <button type="button" class="ai-chip" data-prompt="Summarize Jacob's work at DoorDash and Toast">DoorDash &amp; Toast Summary</button>
      </div>
      <form class="ai-input-form" id="ai-input-form">
        <input type="text" class="text-input" id="ai-input-field" placeholder="Ask a question or trigger a tool..." autocomplete="off" />
        <button type="submit" class="btn btn-primary btn-sm" id="ai-send-btn">Send</button>
      </form>
    `;

    document.body.appendChild(fab);
    document.body.appendChild(drawer);

    const closeBtn = document.getElementById("ai-close-btn");
    const form = document.getElementById("ai-input-form");
    const input = document.getElementById("ai-input-field");
    const messagesEl = document.getElementById("ai-messages");

    fab.addEventListener("click", () => {
      drawer.classList.toggle("open");
      if (drawer.classList.contains("open")) {
        input.focus();
      }
    });

    closeBtn.addEventListener("click", () => {
      drawer.classList.remove("open");
    });

    drawer.querySelectorAll(".ai-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        const prompt = chip.getAttribute("data-prompt");
        if (prompt) sendMessage(prompt);
      });
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

    async function sendMessage(text) {
      appendMessage("user", text);
      const thinkingEl = appendMessage("model", "Thinking...");

      try {
        const res = await fetch("/api/chat.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            history: chatHistory.slice(-8)
          })
        });

        const payload = await res.json();
        if (!res.ok || payload.error) {
          thinkingEl.textContent =
            payload.error ||
            "AI endpoint requires live PHP hosting (Bluehost). You can still explore all portfolio sections, /projects, /tools, /stellar, and /resume!";
          return;
        }

        const reply = payload.reply || "Done!";
        thinkingEl.textContent = reply;
        chatHistory.push({ role: "user", text });
        chatHistory.push({ role: "model", text: reply });

        if (Array.isArray(payload.tool_calls)) {
          handleToolCalls(payload.tool_calls, appendMessage);
        }
      } catch (_err) {
        thinkingEl.textContent =
          "Unable to reach /api/chat.php in this preview environment. Once deployed to Bluehost with api/config.php, live Gemini chat & tool calling run automatically.";
      }
    }
  }

  function handleToolCalls(toolCalls, appendMessage) {
    toolCalls.forEach((tc) => {
      const name = tc.name;
      const args = tc.args || {};

      if (name === "navigate_portfolio") {
        const target = args.section || args.target || "";
        const map = {
          hero: "/#top",
          experience: "/#experience",
          projects: "/projects",
          terminal: "/tools",
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
        } else {
          window.location.href = `/tools?domain=${encodeURIComponent(domain)}`;
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
        if (firstHighlighted) {
          firstHighlighted.scrollIntoView({ behavior: "smooth", block: "center" });
        } else if (appendMessage && args.summary) {
          appendMessage("model", args.summary);
        }
      } else if (name === "customize_storefront") {
        const brand = args.brandName || "Custom Storefront";
        const accent = args.primaryColor || "#10b981";
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
