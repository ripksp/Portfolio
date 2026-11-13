/**
 * INTERACTIVE 3D GLASS SERVER STACK (js/hero3d.js)
 * Shaded 3D translucent glass prisms (DNS -> TLS -> SQL -> POS) with:
 * - True 3D perspective & depth-sorted translucent faces + specular edge highlights
 * - Live vertical fiber conduit + animated data packets
 * - Tap/click any layer to elevate & inspect diagnostics
 * - "Stress Test" (Friday Dinner Rush surge) + "Juan." easter egg
 */

(function () {
  "use strict";

  function showToast(message, isGold) {
    let toast = document.getElementById("horse-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "horse-toast";
      toast.className = "horse-toast";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.toggle("is-emerald", !isGold);
    toast.classList.add("is-visible");
    clearTimeout(toast._hideTimer);
    toast._hideTimer = setTimeout(() => {
      toast.classList.remove("is-visible");
    }, 4200);
  }

  function initHero3D() {
    const canvas = document.getElementById("hero-3d-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let targetTiltX = 0.52;
    let targetTiltY = -0.58;
    let tiltX = 0.52;
    let tiltY = -0.58;
    let time = 0;
    let rafId = null;

    let selectedIdx = 0;
    let stressTimer = 0;
    let juanMode = false;

    const layers = [
      {
        id: "dns",
        name: "DNS EDGE",
        sub: "A · CNAME · MX · CAA",
        readout: "DNS EDGE · CNAME verified · 14ms",
        yBase: -0.96,
        hue: "52, 211, 153",
        accent: "#34d399"
      },
      {
        id: "tls",
        name: "TLS 1.3",
        sub: "ACME · Port 443 · SANs",
        readout: "TLS 1.3 · Handshake OK · Auto-Renew",
        yBase: -0.32,
        hue: "239, 230, 210",
        accent: "#efe6d2"
      },
      {
        id: "sql",
        name: "SQL / JSON",
        sub: "Snowflake · Mode · Webhooks",
        readout: "SQL / JSON · Payload 200 OK · Synced",
        yBase: 0.32,
        hue: "52, 211, 153",
        accent: "#34d399"
      },
      {
        id: "pos",
        name: "POS / VLAN",
        sub: "Android · Epson · VLAN 20",
        readout: "POS / VLAN 20 · 0 dropped tickets",
        yBase: 0.96,
        hue: "245, 197, 107",
        accent: "#f5c56b"
      }
    ];

    // Smooth elevation state per layer
    const layerElev = layers.map(() => 0);
    const layerScreenCenters = layers.map(() => ({ x: 0, y: 0 }));

    // Light packets flowing along the central fiber conduit
    const packets = Array.from({ length: 14 }, (_, i) => ({
      t: i / 14,
      speed: 0.0055 + (i % 3) * 0.0018,
      dir: i % 2 === 0 ? 1 : -1,
      gold: i % 4 === 0
    }));

    function resize() {
      const rect = canvas.parentElement.getBoundingClientRect();
      width = Math.max(240, rect.width);
      height = Math.max(300, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function rotate([x, y, z], ax, ay) {
      const cy = Math.cos(ay), sy = Math.sin(ay);
      const x1 = x * cy - z * sy;
      const z1 = x * sy + z * cy;
      const cx = Math.cos(ax), sx = Math.sin(ax);
      const y2 = y * cx - z1 * sx;
      const z2 = y * sx + z1 * cx;
      return [x1, y2, z2];
    }

    function project([x, y, z], scale, cx, cy) {
      const fov = 4.6;
      const k = fov / (fov - z);
      return [cx + x * scale * k, cy + y * scale * k, z, k];
    }

    function drawPoly(pts, fill, stroke, lineWidth = 1.1) {
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.closePath();
      if (fill) {
        ctx.fillStyle = fill;
        ctx.fill();
      }
      if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
      }
    }

    function drawGlassPrism(layer, idx, scale, cx, cy, ax, ay) {
      const isSelected = idx === selectedIdx;
      const targetElev = isSelected ? -0.14 : 0;
      layerElev[idx] += (targetElev - layerElev[idx]) * 0.14;

      const floatOffset = Math.sin(time * 1.4 + idx * 0.9) * 0.025;
      const yCenter = layer.yBase + layerElev[idx] + floatOffset;

      const w = 0.88;
      const d = 0.88;
      const h = 0.12;

      const corners = [
        [-w, yCenter - h, -d],
        [w, yCenter - h, -d],
        [w, yCenter - h, d],
        [-w, yCenter - h, d],
        [-w, yCenter + h, -d],
        [w, yCenter + h, -d],
        [w, yCenter + h, d],
        [-w, yCenter + h, d]
      ];

      const proj = corners.map((c) => project(rotate(c, ax, ay), scale, cx, cy));
      const centerP = project(rotate([0, yCenter, 0], ax, ay), scale, cx, cy);
      layerScreenCenters[idx] = { x: centerP[0], y: centerP[1] };

      const faces = [
        { idx: [4, 5, 6, 7], type: "bottom" },
        { idx: [0, 1, 5, 4], type: "side" },
        { idx: [1, 2, 6, 5], type: "side" },
        { idx: [2, 3, 7, 6], type: "side" },
        { idx: [3, 0, 4, 7], type: "side" },
        { idx: [0, 1, 2, 3], type: "top" }
      ].map((f) => ({
        ...f,
        z: f.idx.reduce((acc, vi) => acc + proj[vi][2], 0) / 4
      }));

      faces.sort((a, b) => a.z - b.z);

      const isStressed = stressTimer > 0;
      const baseAlpha = isSelected ? 0.24 : 0.11;
      const edgeAlpha = isSelected ? 0.92 : isStressed ? 0.72 : 0.38;

      for (const f of faces) {
        const pts = f.idx.map((vi) => proj[vi]);
        if (f.type === "top") {
          const grad = ctx.createLinearGradient(pts[0][0], pts[0][1], pts[2][0], pts[2][1]);
          grad.addColorStop(0, `rgba(${layer.hue}, ${(baseAlpha + 0.08).toFixed(2)})`);
          grad.addColorStop(1, `rgba(13, 21, 18, 0.72)`);
          drawPoly(pts, grad, `rgba(${layer.hue}, ${edgeAlpha})`, isSelected ? 1.8 : 1.05);
        } else if (f.type === "side") {
          drawPoly(
            pts,
            `rgba(${layer.hue}, ${(baseAlpha * 0.65).toFixed(2)})`,
            `rgba(${layer.hue}, ${(edgeAlpha * 0.55).toFixed(2)})`,
            0.9
          );
        } else {
          drawPoly(pts, `rgba(6, 10, 8, 0.45)`, null);
        }
      }

      // Draw crisp floating label on the top face center
      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `700 ${Math.max(10, Math.round(scale * 0.125))}px "JetBrains Mono", monospace`;
      ctx.fillStyle = isSelected ? layer.accent : "rgba(236, 244, 239, 0.88)";
      ctx.fillText(layer.name, centerP[0], centerP[1] - 4);

      ctx.font = `500 ${Math.max(8, Math.round(scale * 0.09))}px "Plus Jakarta Sans", sans-serif`;
      ctx.fillStyle = isSelected ? "rgba(236, 244, 239, 0.85)" : "rgba(168, 187, 177, 0.65)";
      ctx.fillText(layer.sub, centerP[0], centerP[1] + 9);
      ctx.restore();
    }

    function updateReadout() {
      const labelEl = document.getElementById("hero-3d-label");
      if (!labelEl) return;
      if (juanMode) {
        labelEl.textContent = "JUAN. · Stray CNAME on the roof";
      } else if (stressTimer > 0) {
        labelEl.textContent = "⚡ FRIDAY RUSH · Stress testing 4 layers...";
      } else {
        labelEl.textContent = layers[selectedIdx].readout;
      }
    }

    function render() {
      ctx.clearRect(0, 0, width, height);

      const cx = width * 0.5;
      const cy = height * 0.47;
      const scale = Math.min(width, height) * 0.25;

      // Ambient emerald aura
      const glow = ctx.createRadialGradient(cx, cy, scale * 0.1, cx, cy, scale * 2.1);
      glow.addColorStop(0, stressTimer > 0 ? "rgba(245, 197, 107, 0.22)" : "rgba(52, 211, 153, 0.2)");
      glow.addColorStop(0.55, "rgba(16, 185, 129, 0.06)");
      glow.addColorStop(1, "rgba(6, 10, 8, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, scale * 2.1, 0, Math.PI * 2);
      ctx.fill();

      tiltX += (targetTiltX - tiltX) * 0.08;
      tiltY += (targetTiltY - tiltY) * 0.08;

      const autoYaw = reduceMotion ? 0 : Math.sin(time * 0.45) * 0.12;
      const ax = tiltX;
      const ay = tiltY + autoYaw;

      // Central vertical fiber conduit
      const topConduit = project(rotate([0, -1.25, 0], ax, ay), scale, cx, cy);
      const botConduit = project(rotate([0, 1.25, 0], ax, ay), scale, cx, cy);
      ctx.beginPath();
      ctx.moveTo(topConduit[0], topConduit[1]);
      ctx.lineTo(botConduit[0], botConduit[1]);
      ctx.strokeStyle = stressTimer > 0 ? "rgba(245, 197, 107, 0.45)" : "rgba(52, 211, 153, 0.3)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw prisms bottom-to-top for clean painter's order
      for (let i = layers.length - 1; i >= 0; i--) {
        drawGlassPrism(layers[i], i, scale, cx, cy, ax, ay);
      }

      // Animated data packets along conduit
      const speedMult = stressTimer > 0 ? 3.4 : 1;
      for (const p of packets) {
        if (!reduceMotion) {
          p.t += p.speed * p.dir * speedMult;
          if (p.t > 1) p.t = 0;
          if (p.t < 0) p.t = 1;
        }
        const py = -1.15 + p.t * 2.3;
        const pt = project(rotate([0, py, 0], ax, ay), scale, cx, cy);
        ctx.fillStyle = p.gold || stressTimer > 0 ? "#f5c56b" : "#34d399";
        ctx.beginPath();
        ctx.arc(pt[0], pt[1], (stressTimer > 0 ? 3.5 : 2.6) * pt[3], 0, Math.PI * 2);
        ctx.fill();
      }

      // Optional Juan easter egg badge on top prism
      if (juanMode) {
        const jPt = project(rotate([0, -1.42, 0], ax, ay), scale, cx, cy);
        ctx.save();
        ctx.font = '700 13px "JetBrains Mono", monospace';
        ctx.textAlign = "center";
        ctx.fillStyle = "#f5c56b";
        ctx.fillText("🐴 JUAN.", jPt[0], jPt[1]);
        ctx.restore();
      }

      if (stressTimer > 0) {
        stressTimer--;
        if (stressTimer === 0) {
          updateReadout();
          showToast("⚡ Friday Rush Stress Test: 1,240 req/s · 0 dropped tickets · VLAN 20 holding!", false);
        }
      }

      if (!reduceMotion) {
        time += 0.016;
        rafId = requestAnimationFrame(render);
      }
    }

    const host = canvas.parentElement;
    if (!reduceMotion && host) {
      host.addEventListener("pointermove", (e) => {
        const r = host.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5;
        const ny = (e.clientY - r.top) / r.height - 0.5;
        targetTiltY = -0.58 + nx * 0.55;
        targetTiltX = 0.52 + ny * 0.32;
      });
      host.addEventListener("pointerleave", () => {
        targetTiltX = 0.52;
        targetTiltY = -0.58;
      });
    }

    // Tap/click on canvas to select nearest glass layer
    canvas.addEventListener("click", (e) => {
      const r = canvas.getBoundingClientRect();
      const clickY = e.clientY - r.top;
      let bestIdx = 0;
      let bestDist = Infinity;
      layerScreenCenters.forEach((c, idx) => {
        const d = Math.abs(c.y - clickY);
        if (d < bestDist) {
          bestDist = d;
          bestIdx = idx;
        }
      });
      selectedIdx = bestIdx;
      updateReadout();
      if (reduceMotion) render();
    });

    function triggerStressTest() {
      stressTimer = 210;
      updateReadout();
      if (reduceMotion) {
        stressTimer = 0;
        showToast("⚡ Friday Rush Stress Test: 1,240 req/s · 0 dropped tickets · VLAN 20 holding!", false);
      }
    }

    function setJuanMode(nextState) {
      juanMode = typeof nextState === "boolean" ? nextState : !juanMode;
      const toggleBtn = document.getElementById("hero-juan-toggle");
      if (toggleBtn) {
        toggleBtn.setAttribute("aria-pressed", String(juanMode));
      }
      updateReadout();
      if (juanMode) {
        showToast("🐴 Juan mode activated. Nobody knows how that CNAME record got on the roof either.", true);
      } else {
        showToast("⚡ Back to normal stack diagnostics.", false);
      }
      if (reduceMotion) render();
    }

    const stressBtn = document.getElementById("hero-stress-btn");
    if (stressBtn) stressBtn.addEventListener("click", triggerStressTest);

    const juanBtn = document.getElementById("hero-juan-toggle");
    if (juanBtn) juanBtn.addEventListener("click", () => setJuanMode());

    let keyBuffer = "";
    document.addEventListener("keydown", (e) => {
      const tag = (e.target && e.target.tagName) || "";
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
        keyBuffer = (keyBuffer + e.key.toLowerCase()).slice(-8);
        if (keyBuffer.endsWith("horse") || keyBuffer.endsWith("juan")) {
          keyBuffer = "";
          setJuanMode();
        }
      }
    });

    window.toggleJuanMode = setJuanMode;

    resize();
    updateReadout();
    window.addEventListener("resize", resize);
    render();

    document.addEventListener("visibilitychange", () => {
      if (reduceMotion) return;
      if (document.hidden && rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      } else if (!document.hidden && !rafId) {
        rafId = requestAnimationFrame(render);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initHero3D);
  } else {
    initHero3D();
  }
})();
