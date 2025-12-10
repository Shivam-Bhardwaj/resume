const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const DIST_HTML = path.join(__dirname, '../../dist/html');
const SNAPSHOTS_DIR = path.join(__dirname, '../../snapshots');

if (!fs.existsSync(SNAPSHOTS_DIR)) {
    fs.mkdirSync(SNAPSHOTS_DIR);
}

async function takeSnapshot(filename) {
    const htmlPath = path.join(DIST_HTML, filename);
    if (!fs.existsSync(htmlPath)) {
        console.log(`HTML file not found: ${htmlPath}`);
        return;
    }

    console.log(`Taking snapshot of ${filename}...`);
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    // Set viewport to Letter size at 96 DPI (approx) or higher for quality
    await page.setViewport({
        width: 816, // 8.5in * 96
        height: 1056, // 11in * 96
        deviceScaleFactor: 2 // Retina quality
    });

    await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });

    const imageName = filename.replace('.html', '.png');
    const imagePath = path.join(SNAPSHOTS_DIR, imageName);

    await page.screenshot({
        path: imagePath,
        fullPage: true
    });

    console.log(`  -> Saved to ${imagePath}`);
    await browser.close();
}

(async () => {
    const files = fs.readdirSync(DIST_HTML).filter(f => f.endsWith('.html'));
    for (const file of files) {
        await takeSnapshot(file);
    }
})();
