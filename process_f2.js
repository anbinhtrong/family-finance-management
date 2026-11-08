const fs = require('fs');

let main = fs.readFileSync('temp_f2_main.html', 'utf8');
main = main.replace(/\s*_ngcontent-ng-c\d+(=("[^"]*"|[^\s>]*))?/g, '');
main = main.replace(/\s*_nghost-ng-c\d+(=("[^"]*"|[^\s>]*))?/g, '');

const startMarker = '<div class=page-main>';
let startIdx = main.indexOf(startMarker);
if (startIdx === -1) {
  startIdx = main.indexOf('class=page-main');
  startIdx = main.lastIndexOf('<div', startIdx);
}

const endMarker = '</main>';
let endIdx = main.lastIndexOf(endMarker);
let content = main.substring(startIdx, endIdx).trim();
while (content.endsWith('</div></div>')) {
  content = content.slice(0, -6);
}

fs.writeFileSync('temp_clean_f2_page_main.html', content);
console.log('Saved temp_clean_f2_page_main.html, length:', content.length);

