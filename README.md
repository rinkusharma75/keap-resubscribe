# Keap Resubscribe Service

Receives a webhook from Keap campaign builder and resubscribes a contact by submitting a native Keap form via Puppeteer (headless browser).

## Files
- `index.js` — main server
- `package.json` — dependencies
- `render.yaml` — Render deployment config

## Deploy to Render

1. Push this folder to a GitHub repo
2. Go to https://render.com and create a new **Web Service**
3. Connect your GitHub repo
4. Render will auto-detect `render.yaml` and configure everything
5. After deploy, go to **Environment** in Render dashboard and note your `SECRET_KEY`

## Endpoint

**POST** `/resubscribe`

**Headers:**
- `x-secret: YOUR_SECRET_KEY`
- `Content-Type: application/json`

**Body:**
```json
{
  "email": "contact@example.com",
  "first_name": "John"
}
```

**Response (success):**
```json
{
  "success": true,
  "email": "contact@example.com",
  "status": 200
}
```

## Keap Campaign Builder Setup

1. Add a **Send a Webhook** action after purchase tag
2. URL: `https://your-render-url.onrender.com/resubscribe`
3. Method: POST
4. Headers: `x-secret: YOUR_SECRET_KEY`
5. Body (JSON):
```
{
  "email": "~Contact.Email~",
  "first_name": "~Contact.FirstName~"
}
```
