const fs = require('fs');

const code = fs.readFileSync('frontend/src/pages/Chat.tsx', 'utf8');
const lines = code.split('\n');

function findBlockBoundaries(startPattern, extraStartOffset = 0) {
  let startIdx = lines.findIndex(l => l.includes(startPattern)) + extraStartOffset;
  if (startIdx < extraStartOffset) return null;
  
  let depth = 0;
  let endIdx = -1;
  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i];
    // A crude but effective way to count div depth for nicely formatted React code
    const opens = (line.match(/<div/g) || []).length;
    const closes = (line.match(/<\/div>/g) || []).length;
    depth += opens - closes;
    if (depth === 0 && opens === 0 && closes > 0) {
      endIdx = i;
      break;
    }
  }
  return { start: startIdx, end: endIdx };
}

const analyst = findBlockBoundaries('className="chat-pane strategy-pane"');
console.log('AnalystPane:', analyst);

const content = findBlockBoundaries('className="chat-pane content-pane"');
console.log('ContentWriterPane:', content);
