const cheerio = require('cheerio');

async function scrapeNaver(url) {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }});
    let $ = cheerio.load(await res.text());
    
    const frameSrc = $('iframe#mainFrame').attr('src') || $('frame#mainFrame').attr('src');
    if (frameSrc) {
        let fetchUrl = new URL(frameSrc, url).toString();
        const res2 = await fetch(fetchUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }});
        $ = cheerio.load(await res2.text());
    }
    
    const groups = $('.se-section-imageGroup');
    groups.each((i, el) => {
        console.log(`\n--- GROUP ${i} ---`);
        console.log(`Is sibling to Group 0?`, $(el).parent().html() === groups.eq(0).parent().html());
        console.log(`Parent class:`, $(el).parent().attr('class'));
        console.log(`Parent of Parent class:`, $(el).parent().parent().attr('class'));
        console.log(`Num images inside:`, $(el).find('img').length);
    });
}
scrapeNaver('https://blog.naver.com/eswallpaper/224082482005').catch(console.error);
