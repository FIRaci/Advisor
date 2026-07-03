const fs = require('fs');
const path = require('path');

const chatPath = path.join(__dirname, 'frontend/src/pages/Chat.tsx');
let lines = fs.readFileSync(chatPath, 'utf8').split('\n');

function findLine(str, startLine = 0) {
  for (let i = startLine; i < lines.length; i++) {
    if (lines[i].includes(str)) return i;
  }
  return -1;
}

// 1. Find Analyst Pane boundaries
const analystStart = findLine('{/* Strategy Pane */}');
let analystEnd = findLine('<ChatInput');
// Include <ChatInput /> and the closing div of the strategy pane
if (analystEnd !== -1) {
    while (!lines[analystEnd].includes('</div>')) {
        analystEnd++;
    }
}

// 2. Find Resizer + Restore Button + Content Pane boundaries
const restoreStart = findLine('{/* Content Pane Restore Button */}');
const contentStart = findLine('{/* Content Assistant Pane */}');
const containerEnd = findLine('</div> {/* End Dual Pane Container */}');

console.log('Analyst Start:', analystStart);
console.log('Analyst End:', analystEnd);
console.log('Restore Start:', restoreStart);
console.log('Content Start:', contentStart);
console.log('Container End:', containerEnd);
