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

// Load config to get output filename
function getOutputFilename(configName) {
  const configPath = path.join(SRC, 'data', `config-${configName}.json`);
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return config.outputFile || `Shivam_Bhardwaj_Resume_${configName}`;
  }
  return `Shivam_Bhardwaj_Resume_${configName}`;
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

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Open the local HTML file
  const fileUrl = 'file://' + htmlPath;
  await page.goto(fileUrl, { waitUntil: 'networkidle0' });

  // Generate PDF
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
