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

// 1. ClearChatModal
{
  let startIdx = findLine('{clearModalOpen && (');
  if (startIdx !== -1) {
    let realStart = startIdx;
    while (realStart > 0 && !lines[realStart].includes('<AnimatePresence>')) realStart--;
    let currentEnd = realStart;
    let depth = 0;
    for (let i = realStart; i < lines.length; i++) {
        if (lines[i].includes('<AnimatePresence')) depth++;
        if (lines[i].includes('</AnimatePresence>')) depth--;
        if (depth === 0) {
            currentEnd = i;
            break;
        }
    }
    lines.splice(realStart, currentEnd - realStart + 1, '      <ClearChatModal isOpen={clearModalOpen} onClose={() => setClearModalOpen(false)} onConfirm={handleClearMessages} />');
    console.log('✅ Extracted ClearChatModal');
  }
}

// 2. DeleteCampaignModal
{
  let startIdx = findLine('{deleteModalOpen && (');
  if (startIdx !== -1) {
    let realStart = startIdx;
    while (realStart > 0 && !lines[realStart].includes('<AnimatePresence>')) realStart--;
    let currentEnd = realStart;
    let depth = 0;
    for (let i = realStart; i < lines.length; i++) {
        if (lines[i].includes('<AnimatePresence')) depth++;
        if (lines[i].includes('</AnimatePresence>')) depth--;
        if (depth === 0) {
            currentEnd = i;
            break;
        }
    }
    lines.splice(realStart, currentEnd - realStart + 1, '      <DeleteCampaignModal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} onConfirm={handleDeleteCampaign} />');
    console.log('✅ Extracted DeleteCampaignModal');
  }
}

// 3. GuidePopupModal
{
  let startIdx = findLine('{guidePopupOpen && (');
  if (startIdx !== -1) {
    let realStart = startIdx;
    while (realStart > 0 && !lines[realStart].includes('<AnimatePresence>')) realStart--;
    let currentEnd = realStart;
    let depth = 0;
    for (let i = realStart; i < lines.length; i++) {
        if (lines[i].includes('<AnimatePresence')) depth++;
        if (lines[i].includes('</AnimatePresence>')) depth--;
        if (depth === 0) {
            currentEnd = i;
            break;
        }
    }
    lines.splice(realStart, currentEnd - realStart + 1, '      <GuidePopupModal isOpen={guidePopupOpen} onClose={() => setGuidePopupOpen(false)} activeTab={guideActiveTab} setActiveTab={setGuideActiveTab} />');
    console.log('✅ Extracted GuidePopupModal');
  }
}

// 4. ConfirmationModal definition (it's declared as a constant inside Chat.tsx)
{
  let startIdx = findLine('const ConfirmationModal = ({');
  if (startIdx !== -1) {
    let currentEnd = startIdx;
    let depth = 0;
    for (let i = startIdx; i < lines.length; i++) {
        // Simple depth check for the component block
        if (lines[i].includes('{')) depth += (lines[i].match(/{/g) || []).length;
        if (lines[i].includes('}')) depth -= (lines[i].match(/}/g) || []).length;
        if (depth === 0) {
            currentEnd = i;
            break;
        }
    }
    lines.splice(startIdx, currentEnd - startIdx + 1);
    console.log('✅ Removed ConfirmationModal definition (will move to its own file)');
  }
}

// Add imports
let newContent = lines.join('\n');
const importsToAdd = `import ClearChatModal from '../components/chat/modals/ClearChatModal';
import DeleteCampaignModal from '../components/chat/modals/DeleteCampaignModal';
import GuidePopupModal from '../components/chat/modals/GuidePopupModal';
import ConfirmationModal from '../components/chat/modals/ConfirmationModal';
`;
newContent = newContent.replace("import './Chat.css';", importsToAdd + "import './Chat.css';");

fs.writeFileSync(chatPath, newContent);
console.log('✅ All done! Final line count:', lines.length);
