export default async function handler(req, res) {
  const target = req.query.u || new URL(req.url, `http://${req.headers.host}`).searchParams.get('u');
  if (!target) return res.status(400).send('Missing ?u=');

  let targetUrl;
  try {
    targetUrl = new URL(target);
  } catch {
    return res.status(400).send('Invalid URL');
  }

  // Chỉ cho phép domain cần proxy để tránh open proxy
  const allowed = ['wellnessnest.co'];
  if (!allowed.includes(targetUrl.hostname)) {
    return res.status(403).send('Domain not allowed');
  }

  try {
    const upstream = await fetch(target, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      redirect: 'follow'
    });

    // Sao chép header nhưng xóa các header chặn iframe
    upstream.headers.forEach((v, k) => {
      const lower = k.toLowerCase();
      if (lower === 'x-frame-options' || lower === 'content-security-policy' || lower === 'frame-ancestors') return;
      res.setHeader(k, v);
    });

    const buffer = await upstream.arrayBuffer();
    res.status(upstream.status).send(Buffer.from(buffer));
  } catch (err) {
    console.error(err);
    res.status(502).send('Bad gateway');
  }
}
