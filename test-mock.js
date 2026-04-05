const cheerio = require('cheerio');

const html = `
<div class="se-main-container">
    <div class="se-l-collage">
        <div class="se-imageGroup-item">
             <img src="url1" />
        </div>
        <div class="se-imageGroup-item">
             <img src="url2" />
        </div>
    </div>
</div>
`;

let contentArray = [];
const $ = cheerio.load(html);
const $root = $('.se-main-container').first();

$root.find('.se-imageGroup, .se-l-collage').each((_, group) => {
    const $group = $(group);
    const imgs = [];
    
    $group.find('img').each((_, img) => {
        const src = $(img).attr('src') || '';
        if (src) imgs.push(`<img src="${src}" style="width: 100%; height: auto; border-radius: 8px; display: block;" />`);
    });
    
    if (imgs.length > 0) {
        const tdWidth = (100 / imgs.length).toFixed(2);
        const tds = imgs.map(html => `<td style="width: ${tdWidth}%; padding: 4px; vertical-align: top;">${html}</td>`).join('');
        const tableHtml = `<table style="width: 100%; border-collapse: collapse; border: none; margin: 16px auto;"><tbody><tr>${tds}</tr></tbody></table>`;
        $group.replaceWith(tableHtml);
    } else {
        $group.remove();
    }
});

console.log($root.html());
