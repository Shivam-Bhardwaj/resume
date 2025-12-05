const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const ARCHIVE = path.join(ROOT, 'archive');

// Get current date in YYYY-MM-DD format
function getDateStamp() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

// Archive existing PDFs
function archivePDFs() {
  const dateStamp = getDateStamp();

  // Ensure archive directory exists
  if (!fs.existsSync(ARCHIVE)) {
    fs.mkdirSync(ARCHIVE, { recursive: true });
  }

  // Find all PDFs in root
  const files = fs.readdirSync(ROOT).filter(f => f.endsWith('.pdf'));

  if (files.length === 0) {
    console.log('No PDFs to archive.');
    return;
  }

  console.log(`Archiving ${files.length} PDF(s) with date: ${dateStamp}`);

  files.forEach(file => {
    const srcPath = path.join(ROOT, file);
    const baseName = path.basename(file, '.pdf');
    const destPath = path.join(ARCHIVE, `${baseName}_${dateStamp}.pdf`);

    // If archive already exists for today, add a counter
    let finalDest = destPath;
    let counter = 1;
    while (fs.existsSync(finalDest)) {
      finalDest = path.join(ARCHIVE, `${baseName}_${dateStamp}_${counter}.pdf`);
      counter++;
    }

    fs.copyFileSync(srcPath, finalDest);
    console.log(`  -> ${path.relative(ROOT, finalDest)}`);
  });

  console.log('\nArchive complete!');
}

archivePDFs();
