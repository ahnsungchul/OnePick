const fs = require('fs');
const cheerio = require('cheerio');

async function test() {
  const url = 'https://blog.naver.com/eswallpaper/224082482005';
  let res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  let html = await res.text();
  let $ = cheerio.load(html);

  const frameSrc = $('frame#mainFrame').attr('src') || $('iframe#mainFrame').attr('src');
  if (frameSrc) {
     const realUrl = new URL(frameSrc, url).toString();
     res = await fetch(realUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
     $ = cheerio.load(await res.text());
  }

  const $root = $('.se-main-container').first();
  $root.find('script, iframe, style, .se-sticker, img[src*="tracker"], img[src*="ico_"], .se-oglink-info').remove();

  $root.find('.se-component').each((_, comp) => {
      const cls = $(comp).attr('class') || '';
      console.log("Component:", cls);
  });
  
  $root.find('.se-text-paragraph').each((_, p) => {
      let txt = $(p).text().trim();
      if(txt) console.log("Para:", txt);
  });
  
}
test();
