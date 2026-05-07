const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const SECRET = process.env.SECRET_KEY || 'changeme';

const FORM_URL = 'https://hld555.infusionsoft.com/app/form/process/8eee5f6c3f44d738b4416cd1f4c8b8c3';
const FORM_PAGE_URL = 'https://hld555.infusionsoft.com'; // Base URL to establish session

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

    // Navigate to base URL first to establish session/cookies
    await page.goto(FORM_PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Now POST the form data directly
    const result = await page.evaluate(async (formUrl, email, firstName) => {
      const params = new URLSearchParams();
      params.append('inf_form_xid', '8eee5f6c3f44d738b4416cd1f4c8b8c3');
      params.append('inf_form_name', 'Web Form submitted');
      params.append('infusionsoft_version', '1.70.0.939939');
      params.append('inf_field_FirstName', firstName || '');
      params.append('inf_field_Email', email);
      params.append('inf-sbt', '');

      const response = await fetch(formUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
        redirect: 'follow'
      });

      return {
        status: response.status,
        ok: response.ok,
        url: response.url
      };
    }, FORM_URL, email, first_name || '');

    console.log(`[${new Date().toISOString()}] Result for ${email}: HTTP ${result.status}`);

    await browser.close();

    if (result.status === 200) {
      return res.json({ success: true, email, status: result.status });
    } else {
      return res.status(500).json({ success: false, email, status: result.status, url: result.url });
    }

  } catch (err) {
    console.error(`[${new Date().toISOString()}] Error for ${email}:`, err.message);
    if (browser) await browser.close();
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Keap Resubscribe Service listening on port ${PORT}`);
});
