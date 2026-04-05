import * as cheerio from 'cheerio';
import { v4 as uuidv4 } from 'uuid';

async function fetchOpenGraphDataAction(url: string) {
    let currentUrl = url;
    let response = await fetch(currentUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
      }
    });

    let html = await response.text();
    let $ = cheerio.load(html);

    const frameSrc = $('frame#mainFrame').attr('src') || $('iframe#mainFrame').attr('src');
    if (frameSrc) {
      currentUrl = new URL(frameSrc, currentUrl).toString();
      response = await fetch(currentUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
          'Referer': url
        }
      });
      html = await response.text();
      $ = cheerio.load(html);
    }

    if ($('.se-main-container').length) {
       const $root = $('.se-main-container').first();
       
       $root.find('img').each((_, img) => {
           const $img = $(img);
           let src = $img.attr('data-lazy-src') || $img.attr('src') || '';
           if (!src || src.includes('sticker') || src.includes('tracker')) {
               $img.remove();
               return;
           }
           src = src.replace('w80_blur', 'w966').replace(/type=[a-zA-Z0-9_]+blur/, 'type=w966');
           $img.attr('src', src);
           $img.removeAttr('data-lazy-src');
       });

       $root.find('.se-imageGroup, .se-l-collage').each((_, group) => {
           const $group = $(group);
           const imgs: string[] = [];
           $group.find('img').each((_, img) => {
                const src = $(img).attr('src') || '';
                if (src) imgs.push(`<img src="${src}" style="width: 100%; height: auto; border-radius: 8px; display: block;" />`);
           });
           
           if (imgs.length > 0) {
               const tdWidth = (100 / imgs.length).toFixed(2);
               const tds = imgs.map(html => `<td style="width: ${tdWidth}%; padding: 4px; vertical-align: top;"><p style="margin: 0; padding: 0;">${html}</p></td>`).join('');
               const tableHtml = `<table style="width: 100%; border-collapse: collapse; border: none; margin: 16px auto; table-layout: fixed;"><tbody><tr>${tds}</tr></tbody></table>`;
               $group.replaceWith(tableHtml);
           } else {
               $group.remove();
           }
       });

       return $root.html();
    }
    return "Not found";
}

fetchOpenGraphDataAction(process.argv[2]).then(res => {
   require('fs').writeFileSync('naver_parsed_output.html', res || '');
   console.log("Parsed written to naver_parsed_output.html");
}).catch(console.error);
