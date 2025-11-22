const express = require('express');
const request = require('request');
const app = express();

const append = 'https://stream.app/';

// Middleware to allow CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); // Allow all origins
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Proxy route for handling full URLs and headers
app.get('/*', (req, res) => {
  const targetUrl = req.path.slice(1); // Extract the full target URL from the path

  if (!targetUrl.startsWith('http')) { // Allow both HTTP and HTTPS
    return res.status(400).send('Bad Request: Invalid URL');
  }

  // Set the required headers (User-Agent and Referer)
  const options = {
    url: targetUrl + (req._parsedUrl.search || ''), // Append query string if available
    headers: {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Mobile/15E148 Safari/604.1',
      'Referer': 'https://www.patreon.com/',
    },
  };

  request(options, (error, response, body) => {
    if (error) {
      return res.status(500).send('Error fetching the stream');
    }

    const contentType = (response && response.headers && response.headers['content-type']) || '';
    const isM3U8 = contentType.includes('application/vnd.apple.mpegurl') || targetUrl.endsWith('.m3u8');

    if (isM3U8) {
      const original = typeof body === 'string' ? body : (body ? body.toString('utf8') : '');
      const eol = original.includes('\r\n') ? '\r\n' : '\n';
      const rewritten = original
        .split(/\r?\n/)
        .map((line) => {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) return line;
          return append + trimmed;
        })
        .join(eol);

      res.status(response.statusCode || 200);
      res.set('Content-Type', contentType || 'application/vnd.apple.mpegurl');
      return res.send(rewritten);
    }

    res.status(response.statusCode || 200);
    if (response && response.headers) {
      Object.entries(response.headers).forEach(([k, v]) => {
        if (k.toLowerCase() === 'content-length') return;
        res.set(k, v);
      });
    }
    return res.send(body);
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Proxy server is running on port ${PORT}`);
});
