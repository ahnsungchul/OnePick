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

    let contentArray = [];
    $('.se-main-container').find('.se-component').each((_, comp) => {
        const $comp = $(comp);
        
        if ($comp.hasClass('se-imageGroup') || $comp.hasClass('se-l-collage')) {
            contentArray.push("[COLLAGE MAPPED]");
            return;
        }

        $comp.find('.se-module').each((_, mod) => {
          const $mod = $(mod);
          if ($mod.hasClass('se-module-text')) {
             let texts = [];
             $mod.find('p, div.se-text-paragraph').each((_, p) => {
               const $p = $(p);
               let pStyles = [];
               if ($p.hasClass('se-text-paragraph-align-center') || $p.css('text-align') === 'center') pStyles.push('text-align: center;');
               if ($p.css('color')) pStyles.push(`color: ${$p.css('color')};`);
               
               $p.find('span').each((_, span) => {
                 const $s = $(span);
                 const classes = $s.attr('class') || '';
                 let inlineStyle = $s.attr('style') || '';
                 const fsMatch = classes.match(/se-fs([0-9]+)/);
                 if (fsMatch) inlineStyle += ` font-size: ${fsMatch[1]}px;`;
                 if (inlineStyle) $s.attr('style', inlineStyle.trim());
               });
               let innerHtml = $p.html() || '';
               texts.push(`<p style="${pStyles.join(' ')}">${innerHtml}</p>`);
             });
             contentArray.push(texts.join(''));
          }
        });
    });

    console.log(contentArray.map(c => c.substring(0, 80).replace(/\n/g, '')).join('\n'));

  } catch(e) { console.error(e) }
}
test();
