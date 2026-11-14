/**
 * INTERACTIVE DIAGNOSTIC TERMINAL (js/hero3d.js)
 * Powers the hero obsidian terminal on index.html:
 * - Pre-loaded jacob@omaha:~ status snapshot
 * - Real live DNS & SSL lookups via /api/dns-lookup.php (`dig`, `ssl`)
 * - Simulated Snowflake/Mode SQL payload check (`sql`), `heyyo`, `horse`, `carl`, `help`, `clear`
 */

(function () {
  "use strict";

  function initHeroTerminal() {
    const outputEl = document.getElementById("term-output");
    const formEl = document.getElementById("term-form");
    const inputEl = document.getElementById("term-input");
    const chips = document.querySelectorAll("[data-term-cmd]");

    if (!outputEl || !formEl || !inputEl) return;

    let bootTimers = [];

    function clearBootTimers() {
      bootTimers.forEach((t) => clearTimeout(t));
      bootTimers = [];
    }

    function appendLine(text, cls) {
      const line = document.createElement("div");
      line.className = cls ? `term-line term-line--enter ${cls}` : "term-line term-line--enter";
      line.textContent = text;
      outputEl.appendChild(line);
      outputEl.scrollTop = outputEl.scrollHeight;
      return line;
    }

    function appendBlock(lines, cls) {
      lines.forEach((l, i) => {
        if (i === 0) {
          appendLine(l, cls);
        } else {
          const timer = setTimeout(() => appendLine(l, cls), i * 55);
          bootTimers.push(timer);
        }
      });
    }

    function renderBoot(immediate) {
      clearBootTimers();
      outputEl.innerHTML = "";
      const reduced =
        immediate ||
        (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

      const steps = [
        { delay: 0, text: "jacob@omaha:~$ whoami", cls: "term-cmd" },
        { delay: 130, text: "Jacob Davis · Online Ordering Support Specialist @ DoorDash", cls: "term-out" },
        { delay: 300, text: "jacob@omaha:~$ status --check", cls: "term-cmd" },
        { delay: 470, text: "✓ DNS resolved   ✓ SSL valid   ✓ Menu synced   ✓ Top CSAT", cls: "term-ok" },
        {
          delay: 640,
          text: "Heyyo! 👋 Click a command chip below or type 'help' to run live diagnostics.",
          cls: "term-muted"
        }
      ];

      if (reduced) {
        steps.forEach((s) => appendLine(s.text, s.cls));
        return;
      }

      steps.forEach((s) => {
        const timer = setTimeout(() => appendLine(s.text, s.cls), s.delay);
        bootTimers.push(timer);
      });
    }

    async function runDnsCommand(mode, rawDomain) {
      const domain =
        (rawDomain || "jacobdavis.tech")
          .replace(/^https?:\/\//i, "")
          .split("/")[0]
          .trim() || "jacobdavis.tech";
      const pending = appendLine(`Querying /api/dns-lookup.php for ${domain}...`, "term-muted");

      try {
        const res = await fetch(`/api/dns-lookup.php?domain=${encodeURIComponent(domain)}`);
        const data = await res.json();
        if (!res.ok || data.error) {
          pending.textContent = `⚠ ${data.error || "Live lookup requires PHP hosting (Bluehost)."}`;
          pending.className = "term-line term-line--enter term-warn";
          return;
        }

        pending.remove();
        const recs = data.records || {};
        const ssl = data.ssl || {};

        if (mode === "ssl") {
          appendLine(`TLS Handshake (${domain}:443):`, "term-ok");
          appendLine(
            `  Status : ${ssl.valid ? "✓ Valid" : "✕ Invalid / Not Found"}`,
            ssl.valid ? "term-out" : "term-warn"
          );
          if (ssl.issuer) appendLine(`  Issuer : ${ssl.issuer}`, "term-out");
          if (ssl.validTo) appendLine(`  Expires: ${ssl.validTo}`, "term-out");
        } else {
          const a = (recs.A || []).slice(0, 2).map((r) => r.ip || r.target || r).join(", ") || "—";
          const ns = (recs.NS || []).slice(0, 2).map((r) => r.target || r).join(", ") || "—";
          const mx = (recs.MX || []).slice(0, 2).map((r) => r.target || r).join(", ") || "—";
          appendLine(`Authoritative DNS (${domain}):`, "term-ok");
          appendLine(`  A  : ${a}`, "term-out");
          appendLine(`  NS : ${ns}`, "term-out");
          appendLine(`  MX : ${mx}`, "term-out");
        }
      } catch (_err) {
        pending.textContent = "⚠ Live lookup unavailable in local preview — works live on jacobdavis.tech/tools!";
        pending.className = "term-line term-line--enter term-warn";
      }
    }

    function runCommand(raw) {
      const trimmed = raw.trim();
      if (!trimmed) return;

      clearBootTimers();
      const parts = trimmed.split(/\s+/);
      const cmd = parts[0].toLowerCase();
      const arg = parts.slice(1).join(" ");

      if (cmd === "clear" || cmd === "cls") {
        renderBoot(true);
        return;
      }

      appendLine(`jacob@omaha:~$ ${trimmed}`, "term-cmd");

      if (cmd === "help" || cmd === "?") {
        appendBlock(
          [
            "Available commands:",
            "  dig [domain]   Run live DNS lookup (default: jacobdavis.tech)",
            "  ssl [domain]   Inspect live port 443 TLS certificate",
            "  sql            Inspect sample Snowflake menu ingestion JSON",
            "  heyyo          Say hi + Culture Committee note",
            "  horse          🐴 Check on the rooftop CNAME",
            "  carl           Open Carl AI support chat",
            "  clear          Reset terminal"
          ],
          "term-out"
        );
      } else if (cmd === "dig") {
        runDnsCommand("dig", arg || "jacobdavis.tech");
      } else if (cmd === "ssl") {
        runDnsCommand("ssl", arg || "jacobdavis.tech");
      } else if (cmd === "sql") {
        appendBlock(
          [
            "SELECT location_id, status, payload:menu_sync FROM menu_ingestion LIMIT 1;",
            '-> { "location_id": "unit_04", "status": 200, "menu_sync": "OK", "modifiers": "valid" }'
          ],
          "term-ok"
        );
      } else if (cmd === "heyyo" || cmd === "hi" || cmd === "hello") {
        appendBlock(
          [
            "Heyyo! 👋 Good to see you here.",
            "Fun fact: I open work cases with 'Heyyo!' + a GIF, and co-lead Culture Committee before department-wide MSO training."
          ],
          "term-out"
        );
      } else if (cmd === "horse") {
        const reactions = [
          [
            "🐴 [Reaction: Side-Eye Horse]",
            "  Me watching a registrar overwrite a working CNAME",
            "  with a default parking page 10 minutes before lunch."
          ],
          [
            "🐴 [Reaction: Awkward Tooth-Grin Horse]",
            "  Opening an escalated ticket with 'Heyyo!' and a GIF",
            "  before diving into the Snowflake JSON payload."
          ],
          [
            "🐴 [Reaction: Staring Into Your Soul Horse]",
            "  Waiting for DNS TTL 86400 to expire on a Friday at 4:55 PM."
          ],
          [
            "🐴 [Reaction: Horse in a Suit]",
            "  Logging into Culture Committee before department-wide MSO training."
          ]
        ];
        window._horseIdx = ((window._horseIdx || 0) + 1) % reactions.length;
        appendBlock(reactions[window._horseIdx], "term-gold");
      } else if (cmd === "carl") {
        const fab = document.getElementById("ai-assistant-fab");
        const drawer = document.getElementById("ai-assistant-drawer");
        if (fab && drawer && !drawer.classList.contains("open")) {
          fab.click();
        }
        appendLine("Opened Carl in the bottom right! 👋", "term-ok");
      } else if (cmd === "whoami") {
        appendLine("Jacob Davis · Online Ordering Support Specialist @ DoorDash (Omaha, NE)", "term-out");
      } else {
        appendLine(`command not found: ${cmd}. Try 'help', 'dig jacobdavis.tech', 'ssl', 'sql', or 'horse'.`, "term-warn");
      }
    }

    chips.forEach((chip) => {
      chip.addEventListener("click", () => {
        const cmd = chip.getAttribute("data-term-cmd");
        if (!cmd) return;
        chip.classList.add("is-active");
        setTimeout(() => chip.classList.remove("is-active"), 260);
        runCommand(cmd);
      });
    });

    formEl.addEventListener("submit", (e) => {
      e.preventDefault();
      const val = inputEl.value;
      inputEl.value = "";
      runCommand(val);
    });

    renderBoot(false);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initHeroTerminal);
  } else {
    initHeroTerminal();
  }
})();
