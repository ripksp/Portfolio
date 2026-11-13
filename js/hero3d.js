/**
 * HERO 3D ORBITAL CORE + JUAN. EASTER EGG (js/hero3d.js)
 * Pure Canvas 3D-projected geodesic core, orbital rings, and telemetry nodes
 * in Obsidian & Emerald — plus an interactive "Juan. / Horsin' Around" 3D wireframe
 * horse-on-a-balcony mode!
 */

(function () {
  "use strict";

  function showHorseToast(message) {
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
    let targetTiltX = 0.22;
    let targetTiltY = 0;
    let tiltX = 0.22;
    let tiltY = 0;
    let angle = 0;
    let rafId = null;
    let juanMode = false;

    // Golden ratio icosahedron vertices + edges for normal Systems Core
    const phi = (1 + Math.sqrt(5)) / 2;
    const rawVerts = [
      [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
      [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
      [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1]
    ].map(([x, y, z]) => {
      const len = Math.hypot(x, y, z);
      return [x / len, y / len, z / len];
    });

    const edges = [
      [0, 11], [0, 5], [0, 1], [0, 7], [0, 10],
      [1, 5], [5, 11], [11, 10], [10, 7], [7, 1],
      [3, 9], [3, 4], [3, 2], [3, 6], [3, 8],
      [4, 9], [2, 4], [6, 2], [8, 6], [9, 8],
      [1, 9], [5, 4], [11, 2], [10, 6], [7, 8],
      [4, 11], [2, 10], [6, 7], [8, 1], [9, 5]
    ];

    // 3D wireframe horse standing on a balcony ("JUAN.")
    // Coordinates roughly normalized to [-1, 1]
    const juanVerts = [
      // Balcony slab (0..3)
      [-1.05, 0.72, -0.45], [1.05, 0.72, -0.45], [1.05, 0.72, 0.45], [-1.05, 0.72, 0.45],
      // Balcony railing top (4..7)
      [-1.05, 0.34, 0.45], [1.05, 0.34, 0.45], [-1.05, 0.34, -0.45], [1.05, 0.34, -0.45],
      // Horse torso box / ribs (8..15)
      [-0.48, -0.05, -0.18], [0.42, -0.05, -0.18], [0.42, -0.05, 0.18], [-0.48, -0.05, 0.18],
      [-0.45, 0.24, -0.16], [0.38, 0.24, -0.16], [0.38, 0.24, 0.16], [-0.45, 0.24, 0.16],
      // Hooves on balcony (16..19)
      [-0.42, 0.70, -0.14], [-0.42, 0.70, 0.14], [0.36, 0.70, -0.14], [0.36, 0.70, 0.14],
      // Neck & Chest (20..21)
      [0.54, -0.42, 0.0], [0.38, -0.12, 0.0],
      // Head & Snout & Ears (22..25)
      [0.78, -0.52, 0.0], [0.92, -0.34, 0.0], [0.56, -0.64, -0.08], [0.56, -0.64, 0.08],
      // Tail (26..27)
      [-0.68, 0.08, 0.0], [-0.78, 0.36, 0.0]
    ];

    const juanEdges = [
      // Balcony floor + front/side railing
      [0, 1], [1, 2], [2, 3], [3, 0],
      [4, 5], [3, 4], [2, 5], [0, 6], [1, 7], [6, 4], [7, 5],
      [-1, -1], // skipped if invalid; keep clean pairs below
      // Horse torso
      [8, 9], [9, 10], [10, 11], [11, 8],
      [12, 13], [13, 14], [14, 15], [15, 12],
      [8, 12], [9, 13], [10, 14], [11, 15],
      // Legs
      [12, 16], [15, 17], [13, 18], [14, 19],
      // Neck + Head + Ears
      [9, 20], [10, 20], [13, 21], [14, 21], [21, 20],
      [20, 22], [22, 23], [23, 20],
      [20, 24], [20, 25], [22, 24], [22, 25],
      // Tail
      [8, 26], [11, 26], [26, 27]
    ].filter(([a, b]) => a >= 0 && b >= 0);

    const normalNodes = [
      { label: "DNS", r: 1.48, speed: 0.7, phase: 0.0, inc: 0.55, color: "#34d399" },
      { label: "TLS 1.3", r: 1.56, speed: -0.52, phase: 1.8, inc: -0.65, color: "#efe6d2" },
      { label: "SQL", r: 1.42, speed: 0.62, phase: 3.1, inc: 0.95, color: "#34d399" },
      { label: "API", r: 1.62, speed: -0.45, phase: 4.5, inc: -0.35, color: "#f5c56b" },
      { label: "POS", r: 1.5, speed: 0.55, phase: 5.2, inc: -0.88, color: "#34d399" }
    ];

    const juanNodes = [
      { label: "JUAN.", r: 1.48, speed: 0.75, phase: 0.0, inc: 0.55, color: "#f5c56b" },
      { label: "CNAME?", r: 1.56, speed: -0.52, phase: 1.8, inc: -0.65, color: "#efe6d2" },
      { label: "HAY", r: 1.42, speed: 0.62, phase: 3.1, inc: 0.95, color: "#34d399" },
      { label: "BALCONY", r: 1.62, speed: -0.45, phase: 4.5, inc: -0.35, color: "#f5c56b" },
      { label: "HOOF", r: 1.5, speed: 0.55, phase: 5.2, inc: -0.88, color: "#34d399" }
    ];

    const stars = Array.from({ length: 42 }, (_, i) => ({
      x: Math.abs((Math.sin(i * 12.9898) * 43758.5453) % 1),
      y: Math.abs((Math.sin(i * 78.233) * 19341.123) % 1),
      r: 0.7 + (i % 3) * 0.55,
      a: 0.15 + (i % 5) * 0.08
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

    function rotatePoint([x, y, z], ax, ay) {
      const cy = Math.cos(ay);
      const sy = Math.sin(ay);
      const x1 = x * cy - z * sy;
      const z1 = x * sy + z * cy;
      const cx = Math.cos(ax);
      const sx = Math.sin(ax);
      const y2 = y * cx - z1 * sx;
      const z2 = y * sx + z1 * cx;
      return [x1, y2, z2];
    }

    function project([x, y, z], scale, cx, cy) {
      const fov = 3.4;
      const k = fov / (fov - z);
      return [cx + x * scale * k, cy + y * scale * k, z, k];
    }

    function drawOrbitRing(radius, tiltA, tiltB, phaseShift, scale, cx, cy, strokeStyle) {
      const steps = 64;
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const t = (i / steps) * Math.PI * 2;
        let p = [Math.cos(t) * radius, 0, Math.sin(t) * radius];
        const c1 = Math.cos(tiltA), s1 = Math.sin(tiltA);
        p = [p[0], p[1] * c1 - p[2] * s1, p[1] * s1 + p[2] * c1];
        const c2 = Math.cos(tiltB), s2 = Math.sin(tiltB);
        p = [p[0] * c2 - p[1] * s2, p[0] * s2 + p[1] * c2, p[2]];
        p = rotatePoint(p, tiltX, tiltY + phaseShift * 0.15);
        const [sx, sy] = project(p, scale, cx, cy);
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = 1.1;
      ctx.stroke();
    }

    function render() {
      ctx.clearRect(0, 0, width, height);

      const cx = width * 0.5;
      const cy = height * 0.48;
      const scale = Math.min(width, height) * 0.255;

      for (const s of stars) {
        ctx.fillStyle = juanMode
          ? `rgba(245, 197, 107, ${s.a})`
          : `rgba(167, 243, 208, ${s.a})`;
        ctx.beginPath();
        ctx.arc(s.x * width, s.y * height, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      const glow = ctx.createRadialGradient(cx, cy, scale * 0.1, cx, cy, scale * 1.9);
      if (juanMode) {
        glow.addColorStop(0, "rgba(245, 197, 107, 0.26)");
        glow.addColorStop(0.45, "rgba(52, 211, 153, 0.10)");
      } else {
        glow.addColorStop(0, "rgba(52, 211, 153, 0.28)");
        glow.addColorStop(0.45, "rgba(16, 185, 129, 0.09)");
      }
      glow.addColorStop(1, "rgba(6, 10, 8, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, scale * 1.9, 0, Math.PI * 2);
      ctx.fill();

      tiltX += (targetTiltX - tiltX) * 0.06;
      tiltY += (targetTiltY - tiltY) * 0.06;

      drawOrbitRing(1.48, 0.55, 0.35, angle, scale, cx, cy, juanMode ? "rgba(245, 197, 107, 0.3)" : "rgba(52, 211, 153, 0.28)");
      drawOrbitRing(1.56, -0.65, -0.4, -angle, scale, cx, cy, "rgba(239, 230, 210, 0.16)");
      drawOrbitRing(1.38, 1.15, -0.2, angle * 0.6, scale, cx, cy, "rgba(52, 211, 153, 0.14)");

      const activeVerts = juanMode ? juanVerts : rawVerts;
      const activeEdges = juanMode ? juanEdges : edges;
      const rotX = juanMode ? tiltX * 0.55 : tiltX + Math.sin(angle * 0.5) * 0.25;

      const rotVerts = activeVerts.map((v) => rotatePoint(v, rotX, angle + tiltY));
      const projVerts = rotVerts.map((v) => project(v, scale, cx, cy));

      const sortedEdges = activeEdges
        .map(([a, b], idx) => ({
          a,
          b,
          isBalcony: juanMode && idx < 11,
          z: (projVerts[a][2] + projVerts[b][2]) * 0.5
        }))
        .sort((e1, e2) => e1.z - e2.z);

      for (const e of sortedEdges) {
        const [x1, y1] = projVerts[e.a];
        const [x2, y2] = projVerts[e.b];
        const depth = Math.max(0.18, Math.min(0.95, (e.z + 1) * 0.48));
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        if (juanMode) {
          ctx.strokeStyle = e.isBalcony
            ? `rgba(239, 230, 210, ${(depth * 0.7).toFixed(2)})`
            : `rgba(245, 197, 107, ${depth.toFixed(2)})`;
        } else {
          ctx.strokeStyle = `rgba(52, 211, 153, ${depth.toFixed(2)})`;
        }
        ctx.lineWidth = e.z > 0 ? 1.7 : 1.0;
        ctx.stroke();
      }

      for (const [vx, vy, vz, vk] of projVerts) {
        const alpha = Math.max(0.25, Math.min(1, (vz + 1) * 0.52));
        ctx.fillStyle = juanMode
          ? `rgba(245, 197, 107, ${alpha})`
          : vz > 0.2
          ? `rgba(236, 244, 239, ${alpha})`
          : `rgba(52, 211, 153, ${alpha})`;
        ctx.beginPath();
        ctx.arc(vx, vy, (juanMode ? 1.8 : 2.2) * vk, 0, Math.PI * 2);
        ctx.fill();
      }

      if (juanMode) {
        ctx.save();
        ctx.font = '700 13px "JetBrains Mono", monospace';
        ctx.textAlign = "center";
        ctx.fillStyle = "#f5c56b";
        ctx.fillText("JUAN.", cx, cy - scale * 0.92);
        ctx.restore();
      }

      const nodes = juanMode ? juanNodes : normalNodes;
      ctx.font = '600 10px "JetBrains Mono", monospace';
      ctx.textBaseline = "middle";
      for (const n of nodes) {
        const t = n.phase + angle * n.speed;
        let p = [Math.cos(t) * n.r, 0, Math.sin(t) * n.r];
        const c1 = Math.cos(n.inc), s1 = Math.sin(n.inc);
        p = [p[0], p[1] * c1 - p[2] * s1, p[1] * s1 + p[2] * c1];
        p = rotatePoint(p, tiltX, tiltY);
        const [nx, ny, nz, nk] = project(p, scale, cx, cy);
        const alpha = Math.max(0.25, Math.min(1, (nz + 1.5) * 0.42));

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = n.color;
        ctx.beginPath();
        ctx.arc(nx, ny, 3.6 * nk, 0, Math.PI * 2);
        ctx.fill();

        if (nz > -0.35) {
          ctx.fillStyle = "rgba(236, 244, 239, 0.85)";
          ctx.fillText(n.label, nx + 7, ny);
        }
        ctx.restore();
      }

      if (!reduceMotion) {
        angle += juanMode ? 0.011 : 0.0085;
        rafId = requestAnimationFrame(render);
      }
    }

    const host = canvas.parentElement;
    if (!reduceMotion && host) {
      host.addEventListener("pointermove", (e) => {
        const r = host.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5;
        const ny = (e.clientY - r.top) / r.height - 0.5;
        targetTiltY = nx * 0.9;
        targetTiltX = 0.22 + ny * 0.7;
      });
      host.addEventListener("pointerleave", () => {
        targetTiltX = 0.22;
        targetTiltY = 0;
      });
    }

    function setJuanMode(nextState) {
      juanMode = typeof nextState === "boolean" ? nextState : !juanMode;
      const toggleBtn = document.getElementById("hero-juan-toggle");
      const labelEl = document.getElementById("hero-3d-label");
      if (toggleBtn) {
        toggleBtn.setAttribute("aria-pressed", String(juanMode));
        toggleBtn.textContent = juanMode ? "🐴 Back to Core" : "🐴 Horsin' Around";
      }
      if (labelEl) {
        labelEl.textContent = juanMode ? "Juan. · Balcony Diagnostics" : "Systems & Storefront Core";
      }
      if (juanMode) {
        showHorseToast("🐴 Juan mode activated. Nobody knows how that CNAME record got up on the balcony either.");
      } else {
        showHorseToast("⚡ Back to Systems & Storefront Core. No more horsing around.");
      }
      if (reduceMotion) render();
    }

    const toggleBtn = document.getElementById("hero-juan-toggle");
    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => setJuanMode());
    }

    // Keyboard easter egg: type "horse" or "juan" anywhere outside inputs
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
