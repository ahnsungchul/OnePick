const cheerio = require('cheerio');
const fs = require('fs');

async function test() {
  const url = 'https://blog.naver.com/PostView.naver?blogId=eswallpaper&logNo=224082482005';
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' }
  });
  const html = await res.text();
  const $ = cheerio.load(html);
  
  const groups = $('.se-imageGroup');
  console.log("Number of se-imageGroup found:", groups.length);
  
  groups.each((i, group) => {
     console.log(`\nGroup ${i} classes:`, $(group).attr('class'));
     const imgs = $(group).find('img');
     console.log(`Images inside Group ${i}:`, imgs.length);
     imgs.each((j, img) => {
        console.log(`  Img ${j} src:`, $(img).attr('src') || 'NONE');
        console.log(`  Img ${j} data-lazy-src:`, $(img).attr('data-lazy-src') || 'NONE');
        console.log(`  Img ${j} parent classes:`, $(img).parent().attr('class'));
        console.log(`  Img ${j} grandparent classes:`, $(img).parent().parent().attr('class'));
     });
  });
}
test();
