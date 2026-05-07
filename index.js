const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const SECRET = process.env.SECRET_KEY || 'changeme';

const FORM_PAGE_URL = 'https://hld555.infusionsoft.app/app/form/web-form-submitted31';

app.get('/', (req, res) => {
  res.json({ status: 'Keap Resubscribe Service Running' });
});

app.post('/resubscribe', async (req, res) => {
  // Security check
  const secret = req.headers['x-secret'] || req.query.secret;
  if (secret !== SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { email, first_name } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  console.log(`[${new Date().toISOString()}] Resubscribing: ${email}`);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();

    // Set a real browser user agent
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // Navigate to the form page directly
    console.log(`[${new Date().toISOString()}] Navigating to form page...`);
    await page.goto(FORM_PAGE_URL, { 
      waitUntil: 'networkidle2', 
      timeout: 30000 
    });

    // Wait for email field to be available
    await page.waitForSelector('#inf_field_Email', { timeout: 10000 });

    // Fill in the form fields
    await page.type('#inf_field_FirstName', first_name || 'Customer');
    await page.type('#inf_field_Email', email);

    console.log(`[${new Date().toISOString()}] Submitting form for ${email}...`);

    // Click submit and wait for navigation
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }),
      page.click('button[type="submit"]')
    ]);

    const finalUrl = page.url();
    console.log(`[${new Date().toISOString()}] Final URL after submit: ${finalUrl}`);

    await browser.close();

    return res.json({ 
      success: true, 
      email, 
      final_url: finalUrl 
    });

  } catch (err) {
    console.error(`[${new Date().toISOString()}] Error for ${email}:`, err.message);
    if (browser) await browser.close();
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Keap Resubscribe Service listening on port ${PORT}`);
});
