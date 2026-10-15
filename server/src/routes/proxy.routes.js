const express = require('express');
const axios = require('axios');
const router = express.Router();

function getCustomReferer(url) {
  if (url.includes('jasamarga.com') || url.includes('jmlive')) {
    return 'https://binamarga.pu.go.id/';
  }
  if (url.includes('balitower.co.id')) {
    return 'https://jakcctv.jakarta.go.id/';
  }
  if (url.includes('binamarga.pu.go.id')) {
    return 'https://binamarga.pu.go.id/';
  }
  return new URL(url).origin + '/';
}

/**
 * Proxy streaming HLS (m3u8 & ts segments) to overcome CORS, Referer, and header issues.
 * Automatically rewrites relative URLs in .m3u8 playlists.
 */
router.get('/stream', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).send('Query parameter "url" is required');
  }

  try {
    const isM3U8 = targetUrl.includes('.m3u8');
    const referer = getCustomReferer(targetUrl);

    const response = await axios({
      method: 'get',
      url: targetUrl,
      responseType: isM3U8 ? 'text' : 'stream',
      timeout: 10000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Referer': referer,
        'Origin': new URL(referer).origin,
      },
    });

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    if (isM3U8 && typeof response.data === 'string') {
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      const lines = response.data.split('\n');
      const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);

      const rewrittenLines = lines.map((line) => {
        const trimmed = line.trim();
        if (!trimmed) return line;

        // Check for URI in tags like #EXT-X-MAP:URI="init.mp4"
        if (trimmed.startsWith('#')) {
          if (trimmed.includes('URI="')) {
            return line.replace(/URI="([^"]+)"/, (match, uri) => {
              let absolute = uri;
              if (!uri.startsWith('http://') && !uri.startsWith('https://')) {
                absolute = new URL(uri, baseUrl).href;
              }
              return `URI="/api/proxy/stream?url=${encodeURIComponent(absolute)}"`;
            });
          }
          return line;
        }

        // Regular segment or sub-playlist URL
        let absoluteSegmentUrl = trimmed;
        if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
          absoluteSegmentUrl = new URL(trimmed, baseUrl).href;
        }

        return `/api/proxy/stream?url=${encodeURIComponent(absoluteSegmentUrl)}`;
      });

      return res.send(rewrittenLines.join('\n'));
    }

    // For video chunks (.ts, .m4s, etc.), forward content type and pipe stream
    if (response.headers['content-type']) {
      res.setHeader('Content-Type', response.headers['content-type']);
    }
    response.data.pipe(res);
  } catch (error) {
    console.error(`Proxy error for ${targetUrl}:`, error.message);
    res.status(502).json({
      error: 'Failed to fetch video stream',
      message: error.message,
    });
  }
});

module.exports = router;
