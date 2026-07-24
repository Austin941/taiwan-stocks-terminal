const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, '..', 'public', 'stocks.csv');
let content = fs.readFileSync(csvPath, 'utf-8');

const lines = content.split(/\r?\n/);
const newLines = lines.map(line => {
  if (line.startsWith('6285,')) {
    return '6285,啟碁,通信網路業,上市,2003/09/22,TW0006285000,5G通訊、企業網通設備、低軌衛星、無線網路設備系統(WLAN)、網通設備、衛星通訊設備、車用電子、通訊設備零組件,8';
  }
  return line;
});

fs.writeFileSync(csvPath, newLines.join('\n'), 'utf-8');
console.log('Successfully fixed 6285 啟碁 in public/stocks.csv');
