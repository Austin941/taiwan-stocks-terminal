// api/proxy.js — TWSE 即時報價代理 (帶 Edge Cache)
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=15');

  const { symbols } = req.query;

  if (!symbols) {
    return res.status(400).json({ error: 'Missing symbols parameter' });
  }

  try {
    const url = `https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=${symbols}&json=1&delay=0`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
    });

    if (!response.ok) {
      throw new Error(`TWSE returned status ${response.status}`);
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Proxy API Error:', error.message);
    res.status(502).json({ error: 'Failed to fetch from TWSE' });
  }
}
