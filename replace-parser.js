const fs = require('fs');

const path = 'src/actions/portfolio.action.ts';
let code = fs.readFileSync(path, 'utf8');

const startMarker = "// Deep extraction for Naver Blog PostView";
const endMarker = "const scrapedFullContent = contentArray.join('');";

const startIndex = code.indexOf(startMarker);
const endIndex = code.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
    console.error("Markers not found");
    process.exit(1);
}

const replacement = `// Deep extraction for Naver Blog PostView
    if ($('.se-main-container').length) {
       const $root = $('.se-main-container').first();
       
       // 1. Strip trackers, scripts, and useless items safely
       $root.find('script, iframe, style, .se-sticker, img[src*="tracker"], img[src*="ico_"], .se-oglink-info').remove();

       // 2. Process all images for native fluid delivery
       $root.find('img').each((_, img) => {
           const $img = $(img);
           let src = $img.attr('data-lazy-src') || $img.attr('src') || '';
           if (!src || src.includes('sticker') || src.includes('tracker')) {
               $img.remove();
               return;
           }

           // Swap lazy loader to real high-res
           src = src.replace('w80_blur', 'w966').replace(/type=[a-zA-Z0-9_]+blur/, 'type=w966');
           $img.attr('src', src);
           $img.removeAttr('data-lazy-src');

           // Percentage ratio scaling logic based on px vs 880 metrics
           const styleStr = $img.attr('style') || '';
           const parentWidthStr = $img.closest('.se-module').attr('style') || '';
           const parentWidthMatch = parentWidthStr.match(/width:\\s*([0-9.]+)%/);

           let targetWidth = '100%';
           if (parentWidthMatch) {
               targetWidth = parentWidthMatch[1] + '%';
           } else {
               let pxMatch = styleStr.match(/width:\\s*([0-9.]+)px/);
               if (pxMatch && parseFloat(pxMatch[1]) > 0 && parseFloat(pxMatch[1]) < 850) {
                   targetWidth = Math.min(100, (parseFloat(pxMatch[1]) / 880) * 100).toFixed(2) + '%';
               }
           }
           $img.attr('style', \`width: \${targetWidth}; max-width: 100%; height: auto; border-radius: 8px;\`);
           $img.removeAttr('width').removeAttr('height');
       });

       // 3. Bake structural CSS classes directly into inline styling so the layout holds in SunEditor
       $root.find('.se-text-paragraph').each((_, p) => {
           const $p = $(p);
           let pStyles = [];
           if ($p.hasClass('se-text-paragraph-align-center')) pStyles.push('text-align: center');
           else if ($p.hasClass('se-text-paragraph-align-right')) pStyles.push('text-align: right');
           else if ($p.hasClass('se-text-paragraph-align-justify')) pStyles.push('text-align: justify');
           
           let curStyle = $p.attr('style') || '';
           if (pStyles.length > 0) $p.attr('style', (curStyle + ';' + pStyles.join(';')).replace(/;;/g, ';'));
       });

       $root.find('span').each((_, span) => {
           const $s = $(span);
           const cls = $s.attr('class') || '';
           let sStyles = [];
           const fsMatch = cls.match(/se-fs([0-9]+)/);
           if (fsMatch) sStyles.push(\`font-size: \${fsMatch[1]}px\`);
           if (cls.includes('se-fw-bold') || cls.includes('se-fw-heavy')) sStyles.push('font-weight: bold');
           
           let curStyle = $s.attr('style') || '';
           if (sStyles.length > 0) $s.attr('style', (curStyle + ';' + sStyles.join(';')).replace(/;;/g, ';'));
       });

       // 4. Flexboxes and layout wrappers
       $root.find('.se-imageGroup').each((_, group) => {
           $(group).attr('style', ($(group).attr('style') || '') + '; display: flex; flex-direction: row; gap: 8px; flex-wrap: wrap; justify-content: center;');
       });
       $root.find('.se-component').each((_, comp) => {
           const $c = $(comp);
           const cls = $c.attr('class') || '';
           if (cls.includes('se-l-left') || cls.includes('align-left')) {
               $c.attr('style', ($c.attr('style') || '') + '; float: left; margin: 0 20px 16px 0;');
           } else if (cls.includes('se-l-right') || cls.includes('align-right')) {
               $c.attr('style', ($c.attr('style') || '') + '; float: right; margin: 0 0 16px 20px;');
           }
       });

       contentArray.push($root.html() || '');
    } else if ($('.article_view, .tt_article_useless_p_margin, article').length) {
       const $root = $('.article_view, .tt_article_useless_p_margin, article').first();
       
       $root.find('script, iframe, style, figure[data-ke-type="emoticon"]').remove();

       $root.find('img').each((_, img) => {
           const $img = $(img);
           let src = $img.attr('data-lazy-src') || $img.attr('data-original') || $img.attr('src') || '';
           if (src && !src.includes('daumcdn.net/map') && !src.includes('tracker')) {
               $img.attr('src', src);
               
               let targetWidth = '100%';
               let pxMatch = ($img.attr('style')||'').match(/width:\\s*([0-9.]+)px/);
               if (pxMatch && parseFloat(pxMatch[1]) > 0 && parseFloat(pxMatch[1]) < 850) {
                   targetWidth = Math.min(100, (parseFloat(pxMatch[1]) / 880) * 100).toFixed(2) + '%';
               }
               
               const cls = $img.attr('class') || '';
               const curStyle = $img.attr('style') || '';
               let alignStyle = '';
               if (cls.includes('alignleft') || curStyle.includes('float: left')) {
                   alignStyle = 'float: left; margin: 0 20px 16px 0;';
               } else if (cls.includes('alignright') || curStyle.includes('float: right')) {
                   alignStyle = 'float: right; margin: 0 0 16px 20px;';
               } else {
                   alignStyle = 'display: block; margin: 16px auto;';
               }
               
               $img.attr('style', \`width: \${targetWidth}; max-width: 100%; height: auto; border-radius: 8px; \${alignStyle}\`);
               $img.removeAttr('width').removeAttr('height').removeAttr('data-lazy-src').removeAttr('data-original');
           } else {
               $img.remove();
           }
       });

       contentArray.push($root.html() || '');
    }
    
    `;

const newCode = code.substring(0, startIndex) + replacement + code.substring(endIndex);
fs.writeFileSync(path, newCode);
console.log("Replaced successfully!");

