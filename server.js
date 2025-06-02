const express = require('express');
const { createProxyMiddleware, responseInterceptor } = require('http-proxy-middleware');

const app = express();
const WORKDAY_BASE = 'https://wcpdev.wd101.myworkday.com';

// ✅ Inject iframe on the Extend time entry app page
app.use(
  '/huronsrv_wcpdev2/d/wday/app/timeEntryApplication_xqscgx/timeEntryApplication_xqscgx.htmld',
  createProxyMiddleware({
    target: WORKDAY_BASE,
    changeOrigin: true,
    selfHandleResponse: true, // lets us edit the HTML response
    secure: false,
    logLevel: 'debug',
    cookieDomainRewrite: 'localhost',
    onProxyRes: responseInterceptor(async (responseBuffer, proxyRes, req, res) => {
      const contentType = proxyRes.headers['content-type'] || '';

      if (contentType.includes('text/html')) {
        let body = responseBuffer.toString('utf8');

        // Inject the iframe before </body>
        body = body.replace('</body>', `
          <iframe src="https://youriframe.azurewebsites.net"
                  style="position:fixed;bottom:20px;right:20px;width:400px;height:300px;
                         z-index:9999;border:2px solid red;border-radius:8px;background:white;">
          </iframe></body>`);

        return body;
      }

      // Return the unmodified response for non-HTML
      return responseBuffer;
    }),
    onError(err, req, res) {
      console.error('❌ Proxy error:', err.message);
      res.writeHead(503, { 'Content-Type': 'text/plain' });
      res.end('Service Unavailable: Failed to reach Workday');
    }
  })
);

// ✅ Proxy login route (no changes)
app.use('/wday/authgwy/huronsrv_wcpdev2/login.htmld',
  createProxyMiddleware({
    target: WORKDAY_BASE,
    changeOrigin: true,
    cookieDomainRewrite: 'localhost',
    secure: false,
    logLevel: 'debug',
    onError(err, req, res) {
      console.error('❌ Login proxy error:', err.message);
      res.status(503).send('Login unavailable');
    }
  })
);

// ✅ Catch-all for everything else in huronsrv_wcpdev2
app.use('/huronsrv_wcpdev2',
  createProxyMiddleware({
    target: WORKDAY_BASE,
    changeOrigin: true,
    cookieDomainRewrite: 'localhost',
    secure: false,
    logLevel: 'debug',
    onError(err, req, res) {
      console.error('❌ Catch-all proxy error:', err.message);
      res.status(503).send('Service unavailable');
    }
  })
);

// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Proxy server running at http://localhost:${PORT}`);
});
