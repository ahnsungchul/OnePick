const cheerio = require('cheerio');
const fs = require('fs');

async function scrapeNaver(url) {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }});
    const html = await res.text();
    let $ = cheerio.load(html);
    
    const frameSrc = $('iframe#mainFrame').attr('src') || $('frame#mainFrame').attr('src');
    if (frameSrc) {
        let fetchUrl = new URL(frameSrc, url).toString();
        const res2 = await fetch(fetchUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }});
        $ = cheerio.load(await res2.text());
    }
    
    // Log the group specifically
    const groups = $('.se-imageGroup, .se-l-collage');
    groups.each((i, el) => {
        console.log(`\n--- GROUP ${i} ---`);
        console.log($(el).html().substring(0, 1000));
    });
}
scrapeNaver('https://blog.naver.com/eswallpaper/224082482005').catch(console.error);
