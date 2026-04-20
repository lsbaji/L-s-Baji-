const https = require('https');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => { resolve(data); });
    }).on('error', reject);
  });
}

async function main() {
  const urls = ['https://ibb.co.com/fzCbCwSn', 'https://ibb.co.com/TBTVnzwH', 'https://ibb.co.com/sdQyBcZw'];
  for (const url of urls) {
    const html = await fetchUrl(url);
    const match = html.match(/<meta property="og:image" content="([^"]+)"/);
    if (match) {
      console.log(match[1]);
    } else {
      console.log('Not found for', url);
    }
  }
}

main();
