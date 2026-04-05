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
     res = await fetch(realUrl, { headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': url } });
     $ = cheerio.load(await res.text());
  }

  const $root = $('.se-main-container').first();
  console.log("Found container:", $root.length);
  
  $root.find('img').each((_, img) => {
           const $img = $(img);
           let src = $img.attr('data-lazy-src') || $img.attr('src') || '';
           if (!src) return;
           src = src.replace('w80_blur', 'w966').replace(/type=[a-zA-Z0-9_]+blur/, 'type=w966');
           $img.attr('src', src);
           $img.removeAttr('data-lazy-src');
  });

  $root.find('.se-imageGroup, .se-l-collage').each((_, group) => {
           const $group = $(group);
           const imgs = [];
           $group.find('img').each((_, img) => {
                const src = $(img).attr('src') || '';
                if (src) imgs.push(`<img src="${src}" style="width: 100%;..." />`);
           });
           console.log("Collage found with images:", imgs.length);
           
           if (imgs.length > 0) {
               const tableHtml = `<table style="width: 100%"><tr><td>test</td></tr></table>`;
               $group.replaceWith(tableHtml);
               console.log("Replaced collage with table!");
           } else {
               $group.remove();
               console.log("Removed empty collage");
           }
  });

}
test().catch(console.error);
