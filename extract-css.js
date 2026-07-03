const fs = require('fs');
const path = require('path');

const chatTsxPath = path.join(__dirname, 'frontend/src/pages/Chat.tsx');
const chatCssPath = path.join(__dirname, 'frontend/src/pages/Chat.css');

let tsxContent = fs.readFileSync(chatTsxPath, 'utf8');
let cssContent = fs.readFileSync(chatCssPath, 'utf8');

// Regex to find style={{...}}
// This is a naive regex but works for simple flat objects.
const styleRegex = /style=\{\{([^}]+)\}\}/g;
let match;
let count = 0;

let newCss = '\n/* Extracted Inline Styles */\n';

const camelToKebab = (str) => str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);

tsxContent = tsxContent.replace(styleRegex, (fullMatch, styleBody) => {
  // Simple check to avoid replacing complex styles with variables
  if (styleBody.includes('...') || styleBody.includes('?') || styleBody.includes('`') || styleBody.includes('$')) {
    return fullMatch; // Skip complex dynamic styles
  }

  const props = styleBody.split(',').map(s => s.trim()).filter(Boolean);
  let cssRules = '';
  let isValid = true;

  for (const prop of props) {
    const parts = prop.split(':');
    if (parts.length !== 2) {
      isValid = false; break;
    }
    const key = camelToKebab(parts[0].trim().replace(/['"]/g, ''));
    let val = parts[1].trim();
    // remove quotes
    if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) {
      val = val.substring(1, val.length - 1);
    } else if (!isNaN(val)) {
      val = val + 'px'; // assume px for bare numbers except if it's 0 or certain props
      if (key === 'flex' || key === 'flex-grow' || key === 'flex-shrink' || key === 'opacity' || key === 'z-index' || val === '0px') {
        val = val.replace('px', '');
      }
    } else {
      isValid = false; break;
    }
    cssRules += `  ${key}: ${val};\n`;
  }

  if (isValid && cssRules.length > 0) {
    count++;
    const className = `chat-ext-${count}`;
    newCss += `.${className} {\n${cssRules}}\n`;
    return `className="${className}"`;
  }
  return fullMatch;
});

// Second pass: merge className="chat-ext-X" with existing className="..."
// e.g. className="existing" className="chat-ext-1" -> className="existing chat-ext-1"
tsxContent = tsxContent.replace(/className="([^"]+)"\s+className="([^"]+)"/g, 'className="$1 $2"');
tsxContent = tsxContent.replace(/className=\{([^}]+)\}\s+className="([^"]+)"/g, 'className={`$1 $2`}');

if (count > 0) {
  fs.writeFileSync(chatTsxPath, tsxContent);
  fs.writeFileSync(chatCssPath, cssContent + newCss);
  console.log(`✅ Extracted ${count} inline styles to Chat.css`);
} else {
  console.log('No simple inline styles found to extract.');
}
