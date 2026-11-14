document.addEventListener("DOMContentLoaded", () => {
  const launchBtn = document.getElementById("launchViewscreenBtn");
  const pinField = document.getElementById("pinField");

  if (launchBtn && pinField) {
    launchBtn.addEventListener("click", () => {
      const pin = (pinField.value || "AEGS")
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 4) || "AEGS";
      window.location.href = `./bridge-viewscreen.html?pin=${encodeURIComponent(pin)}`;
    });
  }

  const canvas = document.getElementById("bgCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const stars = Array.from({ length: 55 }, () => ({
    x: Math.random(),
    y: Math.random(),
    r: Math.random() * 1.4 + 0.4,
    s: Math.random() * 0.0003 + 0.0001
  }));
  let angle = 0;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resize);
  resize();

  function draw() {
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    ctx.strokeStyle = "rgba(29, 107, 50, 0.16)";
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 64) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += 64) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    ctx.fillStyle = "rgba(51, 255, 102, 0.45)";
    stars.forEach(st => {
      st.y = (st.y + st.s) % 1;
      ctx.beginPath();
      ctx.arc(st.x * w, st.y * h, st.r, 0, Math.PI * 2);
      ctx.fill();
    });

    angle += 0.008;
    const cx = w * 0.82;
    const cy = h * 0.25;
    const mr = Math.min(w, h) * 0.35;
    ctx.strokeStyle = "rgba(51, 255, 102, 0.12)";
    ctx.beginPath(); ctx.arc(cx, cy, mr, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, mr * 0.6, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(angle) * mr, cy + Math.sin(angle) * mr);
    ctx.stroke();

    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
});
