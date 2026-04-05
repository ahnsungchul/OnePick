const cheerio = require('cheerio');

async function test() {
  const url = 'https://blog.naver.com/eswallpaper/224082482005';
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }});
    let html = await res.text();
    let $ = cheerio.load(html);
    const frameSrc = $('frame#mainFrame').attr('src') || $('iframe#mainFrame').attr('src');
    if (frameSrc) {
      const realUrl = new URL(frameSrc, url).toString();
      const innerRes = await fetch(realUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }});
      $ = cheerio.load(await innerRes.text());
    }

    $('.se-module-image').each((i, comp) => {
       console.log(`\n--- Component ${i} ---`);
       console.log("Wrapper Style:", $(comp).attr('style'));
       console.log("Image Style:", $(comp).find('img').attr('style'));
       console.log("Image data-width:", $(comp).find('img').attr('data-width'));
    });

  } catch(e) { console.error(e) }
}
test();
