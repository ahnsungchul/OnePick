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
       const parent = $(comp).closest('.se-component');
       console.log(`\n--- Component ${i} ---`);
       console.log("Parent Component Classes:", parent.attr('class'));
       console.log("Parent Component Style:", parent.attr('style') || 'None');
       console.log("Wrapper Classes:", $(comp).attr('class'));
       console.log("Wrapper Style:", $(comp).attr('style') || 'None');
    });

  } catch(e) { console.error(e) }
}
test();
