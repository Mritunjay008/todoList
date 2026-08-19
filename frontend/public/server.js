const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const PUBLIC_DIR = __dirname;
// Backend Private Endpoint URL (configured in Azure App Settings)
const BACKEND_API_URL = process.env.BACKEND_API_URL || process.env.VITE_API_BASE_URL || '';

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

const server = http.createServer((req, res) => {
  const reqUrl = new URL(req.url, `http://${req.headers.host}`);
  const reqPath = reqUrl.pathname;

  // 1. REVERSE PROXY: Forward /api requests to Private Backend Endpoint
  if (reqPath.startsWith('/api') && BACKEND_API_URL) {
    const targetUrl = new URL(req.url, BACKEND_API_URL);
    const isHttps = targetUrl.protocol === 'https:';
    const client = isHttps ? https : http;

    const proxyHeaders = { ...req.headers, host: targetUrl.host };
    delete proxyHeaders['content-length'];

    const proxyReq = client.request(
      targetUrl,
      {
        method: req.method,
        headers: proxyHeaders,
        rejectUnauthorized: false
      },
      (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res, { end: true });
      }
    );

    proxyReq.on('error', (err) => {
      console.error('API Proxy Error:', err.message);
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Bad Gateway: Unable to reach private backend', details: err.message }));
    });

    req.pipe(proxyReq, { end: true });
    return;
  }

  // 2. STATIC FILES SERVING (React SPA)
  let filePath = path.join(PUBLIC_DIR, reqPath);

  if (reqPath === '/' || !path.extname(reqPath)) {
    filePath = path.join(PUBLIC_DIR, 'index.html');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      filePath = path.join(PUBLIC_DIR, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Server Error');
        return;
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  });
});

server.listen(PORT, () => {
  console.log(`TaskFlow Server running on port ${PORT}`);
  if (BACKEND_API_URL) {
    console.log(`Proxying /api calls internally to: ${BACKEND_API_URL}`);
  }
});
