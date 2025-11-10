const express = require('express');
const request = require('request');
const app = express();

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
      'Referer': 'https://myco.io/',
    },
  };

  // Forward the request
  request(options)
    .on('error', (error) => {
      res.status(500).send('Error fetching the stream');
    })
    .pipe(res);
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Proxy server is running on port ${PORT}`);
});
