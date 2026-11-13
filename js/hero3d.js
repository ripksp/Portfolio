/**
 * HERO 3D ORBITAL CORE (js/hero3d.js)
 * Pure Canvas 3D-projected geodesic core, orbital rings, and telemetry nodes
 * in Obsidian & Emerald — zero external dependencies, 60fps, HiDPI-crisp.
 */

(function () {
  "use strict";

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
    let targetTiltX = 0.25;
    let targetTiltY = 0;
    let tiltX = 0.25;
    let tiltY = 0;
    let angle = 0;
    let rafId = null;

    // Golden ratio icosahedron vertices + subdivided edges for a crisp 3D geodesic core
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

    // Orbital telemetry nodes (DNS, TLS, SQL, POS, API, SOP)
    const nodes = [
      { label: "DNS", r: 1.48, speed: 0.7, phase: 0.0, inc: 0.55, color: "#34d399" },
      { label: "TLS 1.3", r: 1.56, speed: -0.52, phase: 1.8, inc: -0.65, color: "#efe6d2" },
      { label: "SQL", r: 1.42, speed: 0.62, phase: 3.1, inc: 0.95, color: "#34d399" },
      { label: "API", r: 1.62, speed: -0.45, phase: 4.5, inc: -0.35, color: "#f5c56b" },
      { label: "POS", r: 1.5, speed: 0.55, phase: 5.2, inc: -0.88, color: "#34d399" }
    ];

    // Ambient star/packet field
    const stars = Array.from({ length: 42 }, (_, i) => ({
      x: (Math.sin(i * 12.9898) * 43758.5453) % 1,
      y: (Math.sin(i * 78.233) * 19341.123) % 1,
      r: 0.7 + (i % 3) * 0.55,
      a: 0.15 + (i % 5) * 0.08
    })).map((s) => ({
      x: Math.abs(s.x),
      y: Math.abs(s.y),
      r: s.r,
      a: s.a
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
      // Rotate Y
      const cy = Math.cos(ay);
      const sy = Math.sin(ay);
      const x1 = x * cy - z * sy;
      const z1 = x * sy + z * cy;
      // Rotate X
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
        // Tilt ring
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

      // Ambient stars
      for (const s of stars) {
        ctx.fillStyle = `rgba(167, 243, 208, ${s.a})`;
        ctx.beginPath();
        ctx.arc(s.x * width, s.y * height, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Inner emerald core glow
      const glow = ctx.createRadialGradient(cx, cy, scale * 0.1, cx, cy, scale * 1.9);
      glow.addColorStop(0, "rgba(52, 211, 153, 0.28)");
      glow.addColorStop(0.45, "rgba(16, 185, 129, 0.09)");
      glow.addColorStop(1, "rgba(6, 10, 8, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, scale * 1.9, 0, Math.PI * 2);
      ctx.fill();

      // Smoothly ease tilt
      tiltX += (targetTiltX - tiltX) * 0.06;
      tiltY += (targetTiltY - tiltY) * 0.06;

      // Orbital rings
      drawOrbitRing(1.48, 0.55, 0.35, angle, scale, cx, cy, "rgba(52, 211, 153, 0.28)");
      drawOrbitRing(1.56, -0.65, -0.4, -angle, scale, cx, cy, "rgba(239, 230, 210, 0.16)");
      drawOrbitRing(1.38, 1.15, -0.2, angle * 0.6, scale, cx, cy, "rgba(52, 211, 153, 0.14)");

      // Geodesic icosahedron
      const rotVerts = rawVerts.map((v) => rotatePoint(v, tiltX + Math.sin(angle * 0.5) * 0.25, angle + tiltY));
      const projVerts = rotVerts.map((v) => project(v, scale, cx, cy));

      // Sort edges back-to-front by avg z
      const sortedEdges = edges
        .map(([a, b]) => ({
          a,
          b,
          z: (projVerts[a][2] + projVerts[b][2]) * 0.5
        }))
        .sort((e1, e2) => e1.z - e2.z);

      for (const e of sortedEdges) {
        const [x1, y1] = projVerts[e.a];
        const [x2, y2] = projVerts[e.b];
        const depth = Math.max(0.14, Math.min(0.95, (e.z + 1) * 0.45));
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = `rgba(52, 211, 153, ${depth.toFixed(2)})`;
        ctx.lineWidth = e.z > 0 ? 1.6 : 0.9;
        ctx.stroke();
      }

      // Vertices
      for (const [vx, vy, vz, vk] of projVerts) {
        const alpha = Math.max(0.25, Math.min(1, (vz + 1) * 0.52));
        ctx.fillStyle = vz > 0.2 ? `rgba(236, 244, 239, ${alpha})` : `rgba(52, 211, 153, ${alpha})`;
        ctx.beginPath();
        ctx.arc(vx, vy, 2.2 * vk, 0, Math.PI * 2);
        ctx.fill();
      }

      // Satellite nodes + labels
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
        angle += 0.0085;
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
        targetTiltX = 0.25 + ny * 0.7;
      });
      host.addEventListener("pointerleave", () => {
        targetTiltX = 0.25;
        targetTiltY = 0;
      });
    }

    resize();
    window.addEventListener("resize", resize);
    render();

    // Pause when tab is hidden
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
