const fs = require('fs');
const path = require('path');

const chatTsxPath = path.join(__dirname, 'frontend/src/pages/Chat.tsx');
let tsxContent = fs.readFileSync(chatTsxPath, 'utf8');

const regex = /className="(chat-ext-\d+)"/g;
let match;
const matches = [];
while ((match = regex.exec(tsxContent)) !== null) {
  matches.push({ index: match.index, full: match[0], extClass: match[1] });
}

// Process from end to start to avoid index shifting
for (let i = matches.length - 1; i >= 0; i--) {
  const m = matches[i];
  
  // Find the start of the JSX tag '<' before this className
  let tagStart = tsxContent.lastIndexOf('<', m.index);
  if (tagStart === -1) continue;
  
  // Get the string between '<' and this className
  let beforePart = tsxContent.substring(tagStart, m.index);
  
  // Find if there is another className in beforePart
  const classMatch = beforePart.match(/className=(["{])/);
  if (classMatch) {
    // We found a previous className! We need to inject our chat-ext-X into it.
    let targetIndex = tagStart + classMatch.index;
    let quoteType = classMatch[1]; // '"' or '{'
    
    if (quoteType === '"') {
      // It's a string className="foo"
      // Find the closing quote
      let closeQuote = tsxContent.indexOf('"', targetIndex + 11);
      if (closeQuote !== -1) {
        // Inject right before the closing quote
        tsxContent = tsxContent.substring(0, closeQuote) + ' ' + m.extClass + tsxContent.substring(closeQuote);
        // Now remove the original className="chat-ext-X"
        // Note: the original index has shifted by the length of ' chat-ext-X' (which is m.extClass.length + 1)
        let removeIndex = m.index + m.extClass.length + 1;
        tsxContent = tsxContent.substring(0, removeIndex) + tsxContent.substring(removeIndex + m.full.length);
      }
    } else if (quoteType === '{') {
      // It's an expression className={foo}
      // Since it's hard to find the matching closing brace, we can turn it into className={\`\${foo} chat-ext-X\`}
      // Let's find the closing brace by counting
      let braceCount = 0;
      let closeBrace = -1;
      for (let j = targetIndex + 10; j < m.index; j++) {
        if (tsxContent[j] === '{') braceCount++;
        if (tsxContent[j] === '}') {
          if (braceCount === 1) {
            closeBrace = j;
            break;
          }
          braceCount--;
        }
      }
      if (closeBrace !== -1) {
        let insideBraces = tsxContent.substring(targetIndex + 11, closeBrace);
        // Replace className={insideBraces} with className={`\${insideBraces} chat-ext-X`}
        let newClassStr = `{\`\${${insideBraces}} ${m.extClass}\`}`;
        let oldClassStr = `{${insideBraces}}`;
        
        tsxContent = tsxContent.substring(0, targetIndex + 10) + newClassStr + tsxContent.substring(closeBrace + 1);
        
        // Remove original
        let shift = newClassStr.length - oldClassStr.length;
        let removeIndex = m.index + shift;
        tsxContent = tsxContent.substring(0, removeIndex) + tsxContent.substring(removeIndex + m.full.length);
      }
    }
  }
}

fs.writeFileSync(chatTsxPath, tsxContent);
console.log('✅ Advanced duplicate classNames fixed.');
