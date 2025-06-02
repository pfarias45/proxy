const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Inject iframe ONLY on this path
app.use('/workday/d/iframepage', async (req, res, next) => {
  // Fetch original Workday page via proxy
  const proxyRes = await fetch(`https://yourtenant.workday.com${req.originalUrl}`, {
    headers: req.headers  // includes browser cookies
  });
  let body = await proxyRes.text();

  if (proxyRes.headers.get('content-type')?.includes('text/html')) {
    body = body.replace('</body>', `
      <iframe src="https://youriframe.azurewebsites.net"
              style="position:fixed;bottom:20px;right:20px;width:400px;height:300px;z-index:9999;border:2px solid red;">
      </iframe></body>`);
  }

  res.status(proxyRes.status).set('content-type', proxyRes.headers.get('content-type')).send(body);
});

// Proxy everything else to Workday normally
app.use('/workday', createProxyMiddleware({
  target: 'https://yourtenant.workday.com',
  changeOrigin: true,
  cookieDomainRewrite: "localhost",  // or your proxy domain
  secure: false
}));

const PORT = 3000;
app.listen(PORT, () => console.log(`Proxy running at http://localhost:${PORT}`));
