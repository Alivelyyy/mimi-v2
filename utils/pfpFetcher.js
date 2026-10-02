const https = require('https');
const http = require('http');

const ANIME_ENDPOINTS = {
  neko: [
    { url: 'https://nekos.best/api/v2/neko', parse: (d) => d.results?.[0]?.url },
    { url: 'https://api.waifu.pics/sfw/neko', parse: (d) => d.url },
  ],
  waifu: [
    { url: 'https://nekos.best/api/v2/waifu', parse: (d) => d.results?.[0]?.url },
    { url: 'https://api.waifu.pics/sfw/waifu', parse: (d) => d.url },
  ],
  husbando: [
    { url: 'https://nekos.best/api/v2/husbando', parse: (d) => d.results?.[0]?.url },
  ],
  kitsune: [
    { url: 'https://nekos.best/api/v2/kitsune', parse: (d) => d.results?.[0]?.url },
  ],
};

const API_ENDPOINTS = {
  anime: [
    { url: 'https://nekos.best/api/v2/neko', parse: (d) => d.results?.[0]?.url },
    { url: 'https://api.waifu.pics/sfw/waifu', parse: (d) => d.url },
    { url: 'https://nekos.best/api/v2/waifu', parse: (d) => d.results?.[0]?.url },
  ],
  girls: [
    { url: 'https://nekos.best/api/v2/waifu', parse: (d) => d.results?.[0]?.url },
    { url: 'https://api.waifu.pics/sfw/waifu', parse: (d) => d.url },
    { url: 'https://nekos.best/api/v2/neko', parse: (d) => d.results?.[0]?.url },
  ],
  boys: [
    { url: 'https://nekos.best/api/v2/husbando', parse: (d) => d.results?.[0]?.url },
    { url: 'https://nekos.best/api/v2/kitsune', parse: (d) => d.results?.[0]?.url },
  ],
  couples: [
    { url: 'https://nekos.best/api/v2/waifu', parse: (d) => d.results?.[0]?.url },
    { url: 'https://api.waifu.pics/sfw/waifu', parse: (d) => d.url },
  ],
  pic: [
    { url: 'https://nekos.best/api/v2/neko', parse: (d) => d.results?.[0]?.url },
    { url: 'https://api.waifu.pics/sfw/neko', parse: (d) => d.url },
    { url: 'https://nekos.best/api/v2/kitsune', parse: (d) => d.results?.[0]?.url },
  ],
};

function fetchJSON(url, timeout = 8000) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, { headers: { 'User-Agent': 'MimiBot/6.0' } }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          reject(new Error('Invalid JSON'));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(timeout, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

async function fetchPfp(category) {
  const endpoints = API_ENDPOINTS[category] || API_ENDPOINTS.pic;
  const shuffled = [...endpoints].sort(() => Math.random() - 0.5);

  for (const endpoint of shuffled) {
    try {
      const data = await fetchJSON(endpoint.url);
      const imageUrl = endpoint.parse(data);
      if (imageUrl) {
        return { url: imageUrl, source: new URL(endpoint.url).hostname };
      }
    } catch {
      continue;
    }
  }

  return null;
}

async function fetchAnimePfp(category) {
  const endpoints = ANIME_ENDPOINTS[category] || ANIME_ENDPOINTS.neko;
  const shuffled = [...endpoints].sort(() => Math.random() - 0.5);

  for (const endpoint of shuffled) {
    try {
      const data = await fetchJSON(endpoint.url);
      const imageUrl = endpoint.parse(data);
      if (imageUrl) {
        return { url: imageUrl, source: new URL(endpoint.url).hostname, category };
      }
    } catch {
      continue;
    }
  }

  return null;
}

module.exports = { fetchPfp, fetchAnimePfp, API_ENDPOINTS };
