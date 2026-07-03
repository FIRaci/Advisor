const fs = require('fs');
const path = require('path');

const chatPath = path.join(__dirname, 'frontend/src/pages/Chat.tsx');
let lines = fs.readFileSync(chatPath, 'utf8').split('\n');

const containerStart = lines.findIndex(l => l.includes('<div className="chat-dual-pane-container">'));
let containerEnd = -1;
let depth = 0;

for (let i = containerStart; i < lines.length; i++) {
    if (lines[i].includes('<div') && !lines[i].includes('/>')) depth++;
    if (lines[i].includes('</div')) depth--;
    if (depth === 0) {
        containerEnd = i;
        break;
    }
}

console.log('Dual Pane Container Start:', containerStart);
console.log('Dual Pane Container End:', containerEnd);
