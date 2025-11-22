const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  // Open the local HTML file
  const fileUrl = 'file://' + path.join(__dirname, 'resume.html');
  await page.goto(fileUrl, { waitUntil: 'networkidle0' });

  // Generate PDF
  await page.pdf({
    path: 'Shivam_Bhardwaj_Resume.pdf',
    format: 'Letter',
    printBackground: true,
    margin: {
      top: '0px',
      right: '0px',
      bottom: '0px',
      left: '0px'
    }
  });

  await browser.close();
  console.log('PDF generated successfully: Shivam_Bhardwaj_Resume.pdf');
})();
