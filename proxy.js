// api/proxy.js
import fetch from 'node-fetch';

export default async function handler(req, res) {
  const target = req.query.u;
  if (!target) {
    res.status(400).send('Missing ?u=');
    return;
  }

  let url;
  try {
    url = new URL(target);
  } catch {
    res.status(400).send('Invalid URL');
    return;
  }

  // whitelist nếu muốn bảo mật
  const allowedHosts = ['wellnessnest.co'];
  if (!allowedHosts.includes(url.hostname)) {
    res.status(403).send('Not allowed domain');
    return;
  }

  const upstream = await fetch(target, {
    headers: {
      'User-Agent': 'Mozilla/5.0'
    },
    redirect: 'follow'
  });

  // sao chép header ngoại trừ header chặn iframe
  res.status(upstream.status);
  upstream.headers.forEach((v, k) => {
    const lower = k.toLowerCase();
    if (lower === 'x-frame-options' || lower === 'content-security-policy' || lower === 'frame-ancestors') {
      // skip
    } else {
      res.setHeader(k, v);
    }
  });

  const body = await upstream.arrayBuffer();
  res.send(Buffer.from(body));
}
