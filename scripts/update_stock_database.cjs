const { crawlFinancialNews } = require('./crawl_financial_news.js');
const { execSync } = require('child_process');
const path = require('path');

async function updateAll() {
  console.log('=== [Stock Database Auto-Updater] Starting complete update ===');

  try {
    // 1. Crawl news & hot themes
    console.log('\n[Step 1/3] Crawling financial news (EDN & Yahoo)...');
    await crawlFinancialNews();

    // 2. Regenerate stock dictionary & group taxonomy
    console.log('\n[Step 2/3] Generating stock_dictionary & group taxonomy...');
    execSync('node scripts/generate_stock_dict.cjs', { stdio: 'inherit', cwd: path.join(__dirname, '..') });

    // 3. Re-calculate historical rankings
    console.log('\n[Step 3/3] Fetching historical rankings...');
    execSync('node scripts/fetch_historical_ranking.js', { stdio: 'inherit', cwd: path.join(__dirname, '..') });

    console.log('\n=== [Stock Database Auto-Updater] Complete update SUCCESS! ===');
  } catch (err) {
    console.error('=== [Stock Database Auto-Updater] Update FAILED ===', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  updateAll();
}

module.exports = { updateAll };
