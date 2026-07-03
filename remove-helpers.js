const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'frontend/src/pages/Chat.tsx');
let content = fs.readFileSync(file, 'utf8');

const funcs = [
  'formatMessageTime',
  'cleanContent',
  'parsePlanOptions',
  'classifyPane',
  'getKpiStatus',
  'formatMetricValue',
  'computeMetricDelta',
  'hasTargetKeywords',
  'metricLabelWithHint',
  'generateSmoothPath'
];

for (const fn of funcs) {
  const lines = content.split('\n');
  const startIdx = lines.findIndex(l => l.includes('const ' + fn + ' ='));
  if (startIdx !== -1) {
    let endIdx = startIdx;
    let depth = 0;
    for (let i = startIdx; i < lines.length; i++) {
      if (lines[i].includes('{')) depth += (lines[i].match(/{/g) || []).length;
      if (lines[i].includes('}')) depth -= (lines[i].match(/}/g) || []).length;
      if (depth === 0 && lines[i].includes('}')) {
        endIdx = i;
        break;
      }
    }
    lines.splice(startIdx, endIdx - startIdx + 1);
    content = lines.join('\n');
    console.log('✅ Removed ' + fn);
  }
}

const importStmt = "import { formatMessageTime, cleanContent, parsePlanOptions, classifyPane, getKpiStatus, formatMetricValue, computeMetricDelta, hasTargetKeywords, metricLabelWithHint, generateSmoothPath } from '../utils/chatHelpers';\n";

content = content.replace("import './Chat.css';", importStmt + "import './Chat.css';");

fs.writeFileSync(file, content);
console.log('✅ Done replacing helper functions');
