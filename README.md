# Jacob Davis — Portfolio & Living Resume (`jacobdavis.tech`)

State-of-the-art **Obsidian & Emerald** portfolio website and **Single-Source Living Resume** for **Jacob Davis** (*Technical Support Specialist & Systems IT Professional*).

---

## Architecture: How the "Living Resume" Works

This repository is engineered so you **never have to maintain your website and resume separately**:

```
Portfolio/
├── index.html                    # Main application shell (Portfolio View + Living Resume View)
├── CNAME                         # Custom domain binding (jacobdavis.tech)
├── css/
│   └── styles.css                # Obsidian & Emerald design system + Print/ATS stylesheet
├── data/
│   └── profile.js                # ★ SINGLE SOURCE OF TRUTH for all career, skill & case study data
├── js/
│   └── app.js                    # Renders both views + spotlight cards + interactive case studies
├── assets/
│   └── Jacob_Davis_Resume.pdf    # Pre-built 1-page ATS-friendly emerald-accented PDF resume
└── scripts/
    └── generate_resume_pdf.py    # Script to regenerate assets/Jacob_Davis_Resume.pdf
```

### Updating Your Site & Resume in One Step
1. Open [`data/profile.js`](data/profile.js) (or ask Antigravity to update it for you).
2. Add or edit any bullet point, skill badge, metric, or case study.
3. Both the **Interactive Portfolio View** and the **Living Resume View** (`#resume`) update automatically.
4. To regenerate the downloadable 1-page PDF file (`assets/Jacob_Davis_Resume.pdf`), run:
   ```bash
   uv run --with reportlab python3 scripts/generate_resume_pdf.py
   ```

---

## Connecting `jacobdavis.tech` (Bluehost) to GitHub for 1-Click Deployment

To make Antigravity + GitHub your **one-stop shop** where every `git push` automatically updates `jacobdavis.tech`, you can choose either of these two workflows:

### Option A (Recommended): Host for Free on GitHub Pages + Bluehost DNS
Since you already manage DNS lifecycles daily, this is the cleanest setup:
1. In GitHub, open **`ripksp/Portfolio` → Settings → General** and set repository visibility to **Public** (or use GitHub Pro for private Pages).
2. Go to **Settings → Pages**:
   - Under **Build and deployment**, select **Deploy from a branch** → Branch: **`main`** (`/(root)`).
   - Under **Custom domain**, enter `jacobdavis.tech` and check **Enforce HTTPS**.
3. In your **Bluehost DNS Zone Editor** for `jacobdavis.tech`:
   - Point `@` (**A records**) to GitHub Pages' four IPv4 addresses:
     - `185.199.108.153`
     - `185.199.109.153`
     - `185.199.110.153`
     - `185.199.111.153`
   - Point `www` (**CNAME record**) to `ripksp.github.io`.

### Option B: Keep Bluehost Web Hosting + Auto-Deploy via GitHub Actions (FTP)
If you want the files to stay hosted on your Bluehost cPanel server while still updating automatically whenever Antigravity pushes to GitHub:
1. Create an FTP account in Bluehost cPanel pointed to your `public_html` directory.
2. Add `FTP_SERVER`, `FTP_USERNAME`, and `FTP_PASSWORD` under **`ripksp/Portfolio` → Settings → Secrets and variables → Actions**.
3. Ask Antigravity to enable a `.github/workflows/deploy-bluehost.yml` workflow using `SamKirkland/FTP-Deploy-Action`—every commit to `main` will sync straight to Bluehost automatically.

---

## Upcoming Lab / AI Micro-Tools Roadmap

Preserved from the *AI Project Ideas & Learning Roadmap*:

| Micro-Tool | Focus & Functionality |
| :--- | :--- |
| **Merchant Domain & DNS Diagnostic Script** | Lightweight utility to verify CNAME, A-record, SSL certificate chain, and CDN propagation for custom restaurant storefront domains. |
| **Order Payload & Webhook Inspector** | Interactive validator for simulated online ordering JSON webhook payloads against target POS schema requirements to flag missing modifier or payment fields. |
| **Menu-to-JSON Structurer** | Uses LLM vision/text structured outputs to convert raw restaurant menu PDFs or photos into nested JSON with modifiers, categories, and prices. |
| **AI Menu Item & Local SEO Generator** | Generates localized dish descriptions with `schema.org/Menu` metadata for local restaurant search rankings. |
