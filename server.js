const express = require('express');
const fetch = require('node-fetch');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Base Workday domain
const WORKDAY_BASE = 'https://wcpdev.wd101.myworkday.com';

//Route that injects the iframe on the Extend time entry app page
app.use('/huronsrv_wcpdev2/d/wday/app/timeEntryApplication_xqscgx/timeEntryApplication_xqscgx.htmld', async (req, res) => {
  try {
    // Forward request to the real Workday page
    const targetUrl = WORKDAY_BASE + req.originalUrl;

    const proxyRes = await fetch(targetUrl, {
      headers: {
        ...req.headers,
        host: undefined // avoid host header issues
      }
    });

    const contentType = proxyRes.headers.get('content-type') || '';
    let body = await proxyRes.text();

    if (contentType.includes('text/html')) {
      // Inject iframe before </body>
      body = body.replace('</body>', `
        <iframe src="https://youriframe.azurewebsites.net"
                style="position:fixed;bottom:20px;right:20px;width:400px;height:300px;
                       z-index:9999;border:2px solid red;border-radius:8px;background:white;">
        </iframe></body>`);
    }

    res.status(proxyRes.status)
       .set('content-type', contentType)
       .send(body);
  } catch (error) {
    console.error('Error injecting iframe:', error);
    res.status(500).send('Proxy error while injecting iframe');
  }
});


// Proxy login route directly (no changes to response)
app.use('/wday/authgwy/huronsrv_wcpdev2/login.htmld', createProxyMiddleware({
  target: WORKDAY_BASE,
  changeOrigin: true,
  cookieDomainRewrite: 'localhost',
  secure: false,
  logLevel: 'debug'
}));


// Catch-all proxy for all other huronsrv_wcpdev2 routes (Workday app UI)
app.use('/huronsrv_wcpdev2', createProxyMiddleware({
  target: WORKDAY_BASE,
  changeOrigin: true,
  cookieDomainRewrite: 'localhost',
  secure: false,
  logLevel: 'debug'
}));


// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Proxy server running at http://localhost:${PORT}`);
});
