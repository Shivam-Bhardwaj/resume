# Resume (as Code) — Shivam Bhardwaj

**Download PDFs**

- Recruiter: [`Shivam_Bhardwaj_Resume_Recruiter.pdf`](Shivam_Bhardwaj_Resume_Recruiter.pdf)
- Founder: [`Shivam_Bhardwaj_Resume_Founder.pdf`](Shivam_Bhardwaj_Resume_Founder.pdf)

**Links**

- Website: [`https://shivambhardwaj.com`](https://shivambhardwaj.com)
- LinkedIn: [`https://linkedin.com/in/shivambdj`](https://linkedin.com/in/shivambdj)
- Resume source code: [`https://github.com/Shivam-Bhardwaj/resume`](https://github.com/Shivam-Bhardwaj/resume)

---

## How it works

- **Source of truth**: `src/codex/` (profile, skills, summaries, experience)
- **Build**: `src/scripts/build.js` compiles Handlebars + Markdown into `dist/html/resume-*.html`
- **PDF**: `src/scripts/generate-pdf.js` uses Puppeteer to print HTML to PDF

---

## Quickstart (local)

```bash
npm ci

# Build + generate PDFs
npm run build:recruiter
npm run build:founder
```

---

## Checks

- **Formatting / structure (DRC)**:

```bash
npm run drc:check
```

- **Content sanity (optional heuristics; non-blocking by default)**:

```bash
npm run sanity:content
```

---

## Tailor to a job description (optional)

This repo includes an optional `tailor` script that reads a JD and generates a tailored config + summary, then builds a PDF. If the `claude` CLI is installed, it will be used for a best-effort rewrite; otherwise it falls back to rules-only.

```bash
# From a JD file
npm run tailor -- --jd /path/to/jd.txt

# Paste a JD via stdin (Ctrl+D to end)
npm run tailor:stdin
```

---

## Repo layout

- `src/templates/resume-template.html`: the resume HTML/CSS template
- `src/data/config-*.json`: per-variant config (ordering, layout knobs)
- `assets/experiences/`: mirrored experience notes (human-readable)

