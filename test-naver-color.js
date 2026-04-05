const cheerio = require('cheerio');
async function test() {
  const url = 'https://blog.naver.com/eswallpaper/224082482005';
  let res = await fetch(url);
  let html = await res.text();
  let $ = cheerio.load(html);
  const frameSrc = $('frame#mainFrame').attr('src') || $('iframe#mainFrame').attr('src');
  if (frameSrc) {
    const realUrl = new URL(frameSrc, url).toString();
    res = await fetch(realUrl);
    $ = cheerio.load(await res.text());
  }

  console.log("Looking for colors on spans...");
  let count = 0;
  $('.se-module-text span').each((i, el) => {
    const style = $(el).attr('style');
    const clz = $(el).attr('class');
    if (style && style.includes('color') || clz) {
       console.log(`Span ${i} style:`, style, "class:", clz);
       if (count++ > 15) return false;
    }
  });

  console.log("\nLooking for sizes on spans...");
  count = 0;
  $('.se-module-text span').each((i, el) => {
    const style = $(el).attr('style');
    const clz = $(el).attr('class');
    if (clz && clz.includes('se-fs') || style && style.includes('size')) {
       console.log(`Span ${i} style:`, style, "class:", clz);
       if (count++ > 5) return false;
    }
  });

}
test();
