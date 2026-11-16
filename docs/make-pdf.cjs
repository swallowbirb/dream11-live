// Renders docs/submission.html to SUBMISSION.pdf with Playwright's Chromium (installed in spike/).
// Usage: node docs/make-pdf.cjs [demo-video-url]
const path = require('path');
const { chromium } = require(path.join(__dirname, '../spike/node_modules/playwright'));

(async () => {
  const video = process.argv[2];
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('file://' + path.join(__dirname, 'submission.html'));
  await page.evaluate((url) => {
    const el = [...document.querySelectorAll('.todo')].find((e) => e.textContent === 'DEMO_VIDEO_LINK');
    if (!el) return;
    if (url) el.outerHTML = `<a href="${url}">${url}</a>`;
    else el.textContent = 'Link to be added';
  }, video);
  await page.pdf({
    path: path.join(__dirname, '../SUBMISSION.pdf'),
    format: 'A4',
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<span></span>',
    footerTemplate:
      '<div style="font-size:8px;color:#888;width:100%;text-align:center">Dream11 Live · <span class="pageNumber"></span> / <span class="totalPages"></span></div>',
    margin: { top: '16mm', bottom: '18mm', left: '16mm', right: '16mm' },
  });
  await browser.close();
})();
