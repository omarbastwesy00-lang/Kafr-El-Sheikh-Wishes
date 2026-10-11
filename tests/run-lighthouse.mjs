import { writeFileSync } from 'node:fs';
import lighthouse from 'lighthouse';
import { launch } from 'chrome-launcher';
import { chromium } from '@playwright/test';

const url = process.env.LIGHTHOUSE_URL || 'http://127.0.0.1:4173/';
const chrome = await launch({
  chromePath: chromium.executablePath(),
  chromeFlags: ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage']
});

try {
  const result = await lighthouse(url, {
    port: chrome.port,
    output: 'html',
    formFactor: 'mobile',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo']
  });
  writeFileSync('lighthouse-report.html', result.report);
  const scores = Object.fromEntries(Object.entries(result.lhr.categories).map(([name, category]) => [name, Math.round(category.score * 100)]));
  console.log(`Mobile Lighthouse scores: ${JSON.stringify(scores)}`);
  console.log('Report written to lighthouse-report.html');
} finally {
  await chrome.kill();
}
