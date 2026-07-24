const axios = require('axios');
const fs = require('fs');
const path = require('path');

/**
 * 對接 Yahoo 奇摩股市 (https://tw.stock.yahoo.com/class) 類股與概念題材報價分類資料庫
 */

async function fetchYahooClassData() {
  console.log('[Yahoo Class Crawler] Connecting to https://tw.stock.yahoo.com/class ...');

  try {
    // Fetch Yahoo Finance TW classes HTML / JSON
    const url = 'https://tw.stock.yahoo.com/class';
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7'
      },
      timeout: 10000
    });

    const html = res.data || '';
    
    // Extract category names and urls from html
    const categoryMatches = [];
    const catRegex = /href="\/class-quote\?sectorId=([^"]+)"[^>]*>(.*?)<\/a>/g;
    let m;
    while ((m = catRegex.exec(html)) !== null) {
      categoryMatches.push({ sectorId: m[1], name: m[2].replace(/<[^>]+>/g, '').trim() });
    }

    console.log(`[Yahoo Class Crawler] Successfully parsed ${categoryMatches.length} Yahoo categories!`);
    
    const output = {
      source: 'https://tw.stock.yahoo.com/class',
      updated_at: new Date().toISOString(),
      categories: categoryMatches
    };

    const targetPath = path.join(__dirname, '..', 'stock_dictionary', 'yahoo_classes.json');
    fs.writeFileSync(targetPath, JSON.stringify(output, null, 2), 'utf-8');
    console.log(`[Yahoo Class Crawler] Saved to ${targetPath}`);

    return output;
  } catch (err) {
    console.error('[Yahoo Class Crawler] Error:', err.message);
    return null;
  }
}

if (require.main === module) {
  fetchYahooClassData();
}

module.exports = { fetchYahooClassData };
