// This file lives in your NEW Vercel project, in the /api folder.
import puppeteer from 'puppeteer-core';
import chrome from '@sparticuz/chromium';

export default async function handler(req, res) {
  // Get the URL from the query: /api/scrape?url=...
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  let browser = null;
  
  try {
    // Launch a browser optimized for Vercel
    browser = await puppeteer.launch({
      args: chrome.args,
      defaultViewport: chrome.defaultViewport,
      executablePath: await chrome.executablePath(),
      headless: chrome.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    
    // Go to the URL
    await page.goto(url, { waitUntil: 'networkidle2' });

    // --- YOUR SELECTORS ---
    // You MUST update these by inspecting the job sites
    const titleSelector = '.top-card-layout__title, .top-card__title, h1';
    const companySelector = '.top-card-layout__second-subline, .topcard__org-name-link, .job-company-name';

    // Wait for the elements to exist
    await page.waitForSelector(titleSelector, { timeout: 10000 });
    
    // Extract the text
    const title = await page.$eval(titleSelector, (el) => el.innerText.trim());
    
    // Company selector is optional; some sites might not have it clearly
    let company = '';
    try {
      await page.waitForSelector(companySelector, { timeout: 5000 }); // Shorter wait
      company = await page.$eval(companySelector, (el) => el.innerText.trim());
    } catch (e) {
      console.log('Could not find company selector, skipping.');
    }
    
    // Send the data back
    res.status(200).json({ title: title, company: company });

  } catch (error) {
    console.error('Scrape Error:', error.message);
    res.status(500).json({ error: 'Scraping failed. The site may be protected or the selector is wrong.' });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
