const fs = require('fs');
const path = require('path');

const chatTsxPath = path.join(__dirname, 'frontend/src/pages/Chat.tsx');
let tsxContent = fs.readFileSync(chatTsxPath, 'utf8');

// A function to merge duplicate className attributes on a single tag
// e.g. <div className="foo" \n className="chat-ext-1"> -> <div className="foo chat-ext-1">
// e.g. <div className={cls} className="chat-ext-1"> -> <div className={`${cls} chat-ext-1`}>

// We can just find all instances of `className="chat-ext-\d+"` and merge them into the preceding className if it exists in the same element.
// To do this simply, we will find `className="chat-ext-\d+"` and then look backwards to find the nearest `<` or `className`.
// If we find `className`, we merge them.

let changed = true;
while (changed) {
  changed = false;
  // Match `className="abc"` followed by whitespace/newlines and then `className="chat-ext-X"`
  const match1 = tsxContent.match(/className="([^"]+)"(\s+)className="(chat-ext-\d+)"/);
  if (match1) {
    tsxContent = tsxContent.replace(match1[0], `className="${match1[1]} ${match1[3]}"${match1[2]}`);
    changed = true;
    continue;
  }
  
  // Match `className={abc}` followed by whitespace/newlines and then `className="chat-ext-X"`
  const match2 = tsxContent.match(/className=\{([^}]+)\}(\s+)className="(chat-ext-\d+)"/);
  if (match2) {
    tsxContent = tsxContent.replace(match2[0], `className={\`${match2[1]}\` + " ${match2[3]}"}${match2[2]}`);
    changed = true;
    continue;
  }

  // Match `className="chat-ext-X"` followed by whitespace/newlines and then `className="abc"`
  const match3 = tsxContent.match(/className="(chat-ext-\d+)"(\s+)className="([^"]+)"/);
  if (match3) {
    tsxContent = tsxContent.replace(match3[0], `className="${match3[3]} ${match3[1]}"${match3[2]}`);
    changed = true;
    continue;
  }

  // Match `className="chat-ext-X"` followed by whitespace/newlines and then `className={abc}`
  const match4 = tsxContent.match(/className="(chat-ext-\d+)"(\s+)className=\{([^}]+)\}/);
  if (match4) {
    tsxContent = tsxContent.replace(match4[0], `className={\`${match4[3]}\` + " ${match4[1]}"}${match4[2]}`);
    changed = true;
    continue;
  }
}

fs.writeFileSync(chatTsxPath, tsxContent);
console.log('✅ Duplicate classNames fixed.');
