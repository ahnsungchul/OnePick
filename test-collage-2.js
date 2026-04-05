const cheerio = require('cheerio');

const html = `
<div class="se-main-container">
    <div class="se-component se-image se-l-collage">
        <div class="se-component-content">
            <div class="se-imageGroup">
                 <div class="se-imageGroup-item"><img src="img1" /></div>
            </div>
            <div class="se-imageGroup">
                 <div class="se-imageGroup-item"><img src="img2" /></div>
            </div>
        </div>
    </div>
</div>
`;

let $ = cheerio.load(html);
let $root = $('.se-main-container').first();

$root.find('.se-imageGroup, .se-l-collage').each((_, group) => {
    const $group = $(group);
    
    // Check if element is already detached (has no parent in root anymore)
    if (!$root.find($group).length && !$group.hasClass('se-main-container')) {
        console.log("Skipping detached element");
        return;
    }

    const imgs = [];
    $group.find('img').each((_, img) => {
        const src = $(img).attr('src') || '';
        if (src) imgs.push(`<img src="${src}"/>`);
    });
    
    console.log(`Group class: ${$group.attr('class')}, imgs inside: ${imgs.length}`);

    if (imgs.length > 0) {
        const tdWidth = (100 / imgs.length).toFixed(2);
        const tds = imgs.map(html => `<td>${html}</td>`).join('');
        const tableHtml = `<table><tr>${tds}</tr></table>`;
        $group.replaceWith(tableHtml);
    }
});

console.log($root.html());
