const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// Project root (two levels up from src/scripts/)
const ROOT = path.join(__dirname, '..', '..');
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');

// Get version from command line args (default to 'all')
const version = process.argv[2] || 'all';

// Determine which versions to generate
function getVersionsToGenerate(version) {
  if (version === 'all') {
    return ['recruiter', 'founder'];
  }
  return [version];
}

function loadConfig(configName) {
  const configPath = path.join(SRC, 'data', `config-${configName}.json`);
  if (!fs.existsSync(configPath)) return null;
  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

// Load config to get output filename
function getOutputFilename(configName) {
  const config = loadConfig(configName);
  if (config) return config.outputFile || `Shivam_Bhardwaj_Resume_${configName}`;
  return `Shivam_Bhardwaj_Resume_${configName}`;
}

function countPdfPages(pdfBuffer) {
  // A lightweight page counter: count `/Type /Page` occurrences (but not `/Pages`).
  const buf = Buffer.isBuffer(pdfBuffer) ? pdfBuffer : Buffer.from(pdfBuffer);
  const s = buf.toString('latin1');
  const matches = s.match(/\/Type\s*\/Page\b/g);
  return matches ? matches.length : 0;
}

async function upsertFitStyle(page, layout) {
  await page.evaluate(layout => {
    const id = 'fit-style';
    let style = document.getElementById(id);
    if (!style) {
      style = document.createElement('style');
      style.id = id;
      document.head.appendChild(style);
    }

    const marginTB = layout.marginTBIn.toFixed(3);
    const marginLR = layout.marginLRIn.toFixed(3);
    const baseFontPt = layout.baseFontPt.toFixed(2);
    const lineHeight = layout.lineHeight.toFixed(3);
    const containerGapPx = Math.round(layout.containerGapPx);
    const jobGapPx = Math.round(layout.jobGapPx);

    style.textContent = `
@page { margin: ${marginTB}in ${marginLR}in; size: letter; }
:root {
  --base-font-size: ${baseFontPt}pt;
  --base-line-height: ${lineHeight};
  --container-gap: ${containerGapPx}px;
  --job-gap: ${jobGapPx}px;
}
`;
  }, layout);
}

async function setOptionalVisibleCount(page, visibleCount) {
  await page.evaluate(visibleCount => {
    const nodes = Array.from(document.querySelectorAll('li.fit-optional'));
    const scored = nodes
      .map(el => {
        const score = parseFloat(el.getAttribute('data-fit-score') || '0');
        const rank = parseInt(el.getAttribute('data-fit-rank') || '999', 10);
        return { el, score, rank };
      })
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.rank - b.rank;
      });

    scored.forEach((item, idx) => {
      if (idx < visibleCount) {
        item.el.style.display = 'list-item';
      } else {
        item.el.style.display = 'none';
      }
    });
  }, visibleCount);
}

async function getOptionalTotal(page) {
  return await page.evaluate(() => document.querySelectorAll('li.fit-optional').length);
}

function getFitLayouts() {
  // Baseline is close to current template defaults; tweaks are small (mm-level).
  return [
    { baseFontPt: 8.90, lineHeight: 1.22, marginTBIn: 0.38, marginLRIn: 0.48, containerGapPx: 4, jobGapPx: 4 },
    { baseFontPt: 8.95, lineHeight: 1.23, marginTBIn: 0.39, marginLRIn: 0.49, containerGapPx: 4, jobGapPx: 4 },
    { baseFontPt: 9.00, lineHeight: 1.25, marginTBIn: 0.40, marginLRIn: 0.50, containerGapPx: 5, jobGapPx: 5 },
    { baseFontPt: 9.05, lineHeight: 1.26, marginTBIn: 0.41, marginLRIn: 0.51, containerGapPx: 5, jobGapPx: 5 },
    { baseFontPt: 9.10, lineHeight: 1.27, marginTBIn: 0.43, marginLRIn: 0.53, containerGapPx: 6, jobGapPx: 6 },
    { baseFontPt: 9.20, lineHeight: 1.28, marginTBIn: 0.45, marginLRIn: 0.55, containerGapPx: 6, jobGapPx: 6 }
  ];
}

async function renderPdfBuffer(page) {
  return await page.pdf({
    format: 'Letter',
    printBackground: true,
    margin: {
      top: '0in',
      right: '0in',
      bottom: '0in',
      left: '0in'
    }
  });
}

async function fitToTargetPages({ page, targetPages }) {
  const layouts = getFitLayouts();
  const baselineIdx = 2;
  const optionalTotal = await getOptionalTotal(page);

  // Cache pages counts for (layoutIdx, optionalCount)
  const cache = new Map();
  async function pagesFor(layoutIdx, optionalCount) {
    const key = `${layoutIdx}:${optionalCount}`;
    if (cache.has(key)) return cache.get(key);
    await upsertFitStyle(page, layouts[layoutIdx]);
    await setOptionalVisibleCount(page, optionalCount);
    const buf = await renderPdfBuffer(page);
    const pages = countPdfPages(buf);
    cache.set(key, pages);
    return pages;
  }

  // For each layout, binary-search optional bullets to hit targetPages (or best effort).
  const candidates = [];
  for (let layoutIdx = 0; layoutIdx < layouts.length; layoutIdx++) {
    const pages0 = await pagesFor(layoutIdx, 0);
    const pagesAll = await pagesFor(layoutIdx, optionalTotal);

    // If target is outside achievable range for this layout, skip.
    if (pages0 > targetPages) continue;
    if (pagesAll < targetPages) continue;

    // Binary search minimal optionalCount such that pages >= targetPages.
    let lo = 0;
    let hi = optionalTotal;
    let best = optionalTotal;
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      const p = await pagesFor(layoutIdx, mid);
      if (p >= targetPages) {
        best = mid;
        hi = mid - 1;
      } else {
        lo = mid + 1;
      }
    }

    const neighborhood = [best, best - 1, best + 1, best - 2, best + 2]
      .filter(x => x >= 0 && x <= optionalTotal);

    for (const optionalCount of neighborhood) {
      const p = await pagesFor(layoutIdx, optionalCount);
      if (p === targetPages) {
        // Cost: prefer baseline-ish layouts and fewer optional bullets (more relevant-only).
        const cost = Math.abs(layoutIdx - baselineIdx) * 100 + optionalCount;
        candidates.push({ layoutIdx, optionalCount, pages: p, cost });
      }
    }
  }

  if (candidates.length > 0) {
    candidates.sort((a, b) => a.cost - b.cost);
    const best = candidates[0];
    await upsertFitStyle(page, layouts[best.layoutIdx]);
    await setOptionalVisibleCount(page, best.optionalCount);
    return { ...best, baselineIdx, optionalTotal };
  }

  // Fallback: pick the closest we can get with baseline layout and all optional bullets.
  const fallbackPages = await pagesFor(baselineIdx, optionalTotal);
  await upsertFitStyle(page, layouts[baselineIdx]);
  await setOptionalVisibleCount(page, optionalTotal);
  return { layoutIdx: baselineIdx, optionalCount: optionalTotal, pages: fallbackPages, cost: Infinity, baselineIdx, optionalTotal };
}

async function generatePDF(configName) {
  const htmlPath = path.join(DIST, 'html', `resume-${configName}.html`);

  if (!fs.existsSync(htmlPath)) {
    console.error(`HTML file not found: ${htmlPath}`);
    console.error(`Run 'npm run build:html' first to generate HTML files.`);
    return;
  }

  const outputFilename = getOutputFilename(configName);
  const pdfPath = path.join(ROOT, `${outputFilename}.pdf`);

  console.log(`Generating PDF for ${configName}...`);

  const config = loadConfig(configName) || {};
  const targetPages = typeof config.fitToPages === 'number' ? config.fitToPages : (configName === 'tailored' ? 2 : null);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Open the local HTML file
  const fileUrl = 'file://' + htmlPath;
  await page.goto(fileUrl, { waitUntil: 'networkidle0' });

  // If target pages specified, fit content/layout before writing the final PDF.
  if (targetPages) {
    const fit = await fitToTargetPages({ page, targetPages });
    console.log(
      `  Fit: target=${targetPages} pages, actual=${fit.pages}, optionalShown=${fit.optionalCount}/${fit.optionalTotal}, layoutIdx=${fit.layoutIdx}`
    );
  }

  // Generate final PDF (with any fit styles applied)
  await page.pdf({
    path: pdfPath,
    format: 'Letter',
    printBackground: true,
    margin: {
      top: '0in',
      right: '0in',
      bottom: '0in',
      left: '0in'
    }
  });

  await browser.close();
  console.log(`  -> ${pdfPath}`);
}

(async () => {
  const versions = getVersionsToGenerate(version);

  for (const v of versions) {
    await generatePDF(v);
  }

  console.log(`\nPDF generation complete!`);
})();
