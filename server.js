// Import the required libraries
const express = require('express'); // Express is the web framework
const fetch = require('node-fetch'); // Lets us make HTTP requests (like axios)
const { createProxyMiddleware } = require('http-proxy-middleware'); // Used to forward requests

// Create the Express app
const app = express();

// This is the base URL of your Workday environment
const WORKDAY_BASE = 'https://wcpdev.wd101.myworkday.com/huronsrv_wcpdev2';

// Special route where you want to inject your iframe
app.use('/workday/d/iframepage', async (req, res) => {
  try {
    // Build the full URL to fetch from Workday
    const targetUrl = WORKDAY_BASE + req.originalUrl;

    // Send the HTTP request to Workday, forwarding user headers (cookies, etc.)
    const proxyRes = await fetch(targetUrl, {
      headers: {
        ...req.headers,
        host: undefined // Remove host header so it doesn’t confuse Workday
      }
    });

    // Get the content type (HTML, JSON, etc.)
    const contentType = proxyRes.headers.get('content-type') || '';

    // Read the response body (HTML text)
    let body = await proxyRes.text();

    // If it's an HTML page, inject the iframe before the </body> tag
    if (contentType.includes('text/html')) {
      body = body.replace('</body>', `
        <iframe src="https://youriframe.azurewebsites.net"
                style="position:fixed;bottom:20px;right:20px;width:400px;height:300px;z-index:9999;border:2px solid red;">
        </iframe></body>`);
    }

    // Send the modified HTML back to the browser
    res.status(proxyRes.status)
       .set('content-type', contentType)
       .send(body);
  } catch (error) {
    // If something goes wrong, show an error
    console.error('Error injecting iframe:', error);
    res.status(500).send('Proxy error while injecting iframe');
  }
});

// Catch-all proxy: for all other /workday requests
// This passes everything through to Workday without changing it
app.use('/workday', createProxyMiddleware({
  target: WORKDAY_BASE,         // Where to send requests
  changeOrigin: true,           // Needed for virtual hosts (Workday expects this)
  cookieDomainRewrite: 'localhost', // Allows local cookies to work while testing
  secure: false,                // If you're using self-signed certs in dev, skip security checks
  logLevel: 'debug'             // Optional: logs each proxied request (helpful for debugging)
}));

// Start the server on port 3000 or whatever Azure tells it to use
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Proxy running at http://localhost:${PORT}`);
});
