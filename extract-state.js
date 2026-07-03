const fs = require('fs');
const path = require('path');

const chatTsxPath = path.join(__dirname, 'frontend/src/pages/Chat.tsx');
let tsxContent = fs.readFileSync(chatTsxPath, 'utf8');

// We will find all `const [var, setVar] = useState(...)` at the top level of the component.
// The main component is `export default function Chat() {`

const chatComponentStart = tsxContent.indexOf('export default function Chat() {');
if (chatComponentStart === -1) {
  console.log("Could not find Chat component start");
  process.exit(1);
}

// Find the end of the state declarations block (roughly before the first `useEffect` or `const` that is not a useState)
// We will just match all `useState` calls and extract them.
const useStateRegex = /^\s*const\s+\[([a-zA-Z0-9_]+),\s*([a-zA-Z0-9_]+)\]\s*=\s*useState(<[^>]+>)?\(([^)]*)\);/gm;

let match;
let states = [];
let hookContent = `import { useState } from 'react';\n\nexport function useLocalChatState() {\n`;
let destructuredNames = [];

// Only match useStates that appear before line 500 to ensure we don't accidentally grab states from nested functions
const headerContent = tsxContent.substring(chatComponentStart, chatComponentStart + 8000); // look in first 8000 chars

let replacedHeader = headerContent;

while ((match = useStateRegex.exec(headerContent)) !== null) {
  const fullMatch = match[0];
  const varName = match[1];
  const setterName = match[2];
  
  // Skip ones that are clearly not main component level (e.g. if they are inside a map or something, though regex ^\s* helps)
  
  hookContent += `${fullMatch}\n`;
  destructuredNames.push(varName);
  destructuredNames.push(setterName);
  
  replacedHeader = replacedHeader.replace(fullMatch, '');
}

hookContent += `\n  return {\n    ${destructuredNames.join(',\n    ')}\n  };\n}\n`;

if (destructuredNames.length === 0) {
  console.log('No states found.');
  process.exit(1);
}

fs.writeFileSync(path.join(__dirname, 'frontend/src/hooks/useLocalChatState.ts'), hookContent);

const replacementHookCall = `\n  const {\n    ${destructuredNames.join(',\n    ')}\n  } = useLocalChatState();\n`;

// Insert the hook call right after `export default function Chat() {`
replacedHeader = replacedHeader.replace('export default function Chat() {', 'export default function Chat() {' + replacementHookCall);

// Add import to Chat.tsx
if (!tsxContent.includes('useLocalChatState')) {
  replacedHeader = `import { useLocalChatState } from '../hooks/useLocalChatState';\n` + replacedHeader;
}

// Replace back into full content
tsxContent = tsxContent.replace(headerContent, replacedHeader);

fs.writeFileSync(chatTsxPath, tsxContent);
console.log('✅ Extracted ' + (destructuredNames.length/2) + ' local states to useLocalChatState hook.');
