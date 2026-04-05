const cheerio = require('cheerio');
const fs = require('fs');

async function testNaver() {
  const url = 'https://m.blog.naver.com/naver_diary/223405769188';
  try {
     const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
        }
     });
     
     const html = await response.text();
     fs.writeFileSync('/tmp/naver-output.html', html);
     console.log("Written to /tmp/naver-output.html");
  } catch(e) {
    console.error(e);
  }
}
testNaver();
