const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Possible Kimchi API endpoints
const ENDPOINTS = [
  'https://inference.kimchi.dev/v1/chat/completions',
  'https://api.kimchi.dev/v1/chat/completions',
  'https://inference.kimchi.dev/chat/completions',
  'https://api.kimchi.dev/chat/completions'
];

async function tryEndpoints(apiKey, messages) {
  let lastError = null;

  for (const url of ENDPOINTS) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + apiKey
        },
        body: JSON.stringify({
          messages: messages,
          stream: false
        })
      });

      if (response.ok) {
        const data = await response.json();
        return { ok: true, data, endpoint: url };
      }

      // If 401/403, key is wrong - don't try other endpoints
      if (response.status === 401 || response.status === 403) {
        const errText = await response.text();
        return { ok: false, status: response.status, error: 'API Key tidak valid: ' + errText };
      }

      lastError = { status: response.status, error: await response.text() };
    } catch (err) {
      lastError = { status: 500, error: err.message };
    }
  }

  return { ok: false, status: lastError?.status || 500, error: lastError?.error || 'Semua endpoint gagal' };
}

app.post('/api/chat', async (req, res) => {
  const { messages, apiKey } = req.body;

  if (!apiKey) {
    return res.status(400).json({ error: 'API key required' });
  }

  const result = await tryEndpoints(apiKey, messages);

  if (result.ok) {
    res.json(result.data);
  } else {
    res.status(result.status || 500).json({ error: result.error });
  }
});

// Debug endpoint to check which API works
app.post('/api/test', async (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey) return res.status(400).json({ error: 'API key required' });

  const results = [];
  for (const url of ENDPOINTS) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + apiKey
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'hi' }],
          stream: false
        })
      });
      const text = await response.text();
      results.push({ url, status: response.status, body: text.slice(0, 200) });
    } catch (err) {
      results.push({ url, status: 'error', body: err.message });
    }
  }
  res.json({ results });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log('http://localhost:' + PORT));
