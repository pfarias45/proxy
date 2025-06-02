const express = require('express');
const fetch = require('node-fetch');
const app = express();

// Change this to the real or test Workday URL
const WORKDAY_URL = 'https://wcpdev.wd101.myworkday.com/huronsrv_wcpdev2/d/home.htmld'; 

// Intercept all requests to proxy Workday
app.use('*', async (req, res) => {
  const targetUrl = WORKDAY_URL + req.originalUrl;

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: req.headers
    });

    const contentType = response.headers.get('content-type') || '';
    let body = await response.text();

    // Only inject iframe if response is HTML
    if (contentType.includes('text/html')) {
      const iframe = `
        <iframe src="https://neverssl.com"
          style="position:fixed;
                 bottom:20px;
                 right:20px;
                 width:400px;
                 height:300px;
                 border:2px solid red;
                 z-index:9999;
                 border-radius:8px;
                 background:white;">
        </iframe>`;
      body = body.replace('</body>', iframe + '</body>');
    }

    res.set('content-type', contentType);
    res.status(response.status).send(body);
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).send('Proxy error');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Proxy server running at http://localhost:${PORT}`);
});
