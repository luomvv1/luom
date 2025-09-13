export default async function handler(req, res) {
  const q = req.query.u || new URL(req.url, `http://${req.headers.host}`).searchParams.get('u');
  if (!q) return res.status(400).send('Missing ?u=');

  let target;
  try { target = new URL(q); } catch { return res.status(400).send('Invalid URL'); }

  // whitelist nhiều biến thể
  const allowed = ['wellnessnest.co', 'www.wellnessnest.co'];
  if (!allowed.includes(target.hostname)) return res.status(403).send('Domain not allowed');

  try {
    const upstream = await fetch(target.toString(), {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      redirect: 'follow'
    });

    // chuyển header (trừ header chặn iframe)
    upstream.headers.forEach((v,k) => {
      const key = k.toLowerCase();
      if (['x-frame-options','content-security-policy','frame-ancestors'].includes(key)) return;
      res.setHeader(k, v);
    });

    const buf = await upstream.arrayBuffer();
    res.status(upstream.status).send(Buffer.from(buf));
  } catch (err) {
    console.error('proxy error', err);
    res.status(502).send('Bad gateway');
  }
}
