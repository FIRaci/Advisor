/**
 * Phase 2 Combined Refactor Script
 * 
 * Strategy: Instead of trying to string-match CRLF content,
 * we work at the LINE level exclusively. For each operation,
 * we find line indices and splice precisely.
 * 
 * Operations:
 * 1. Run Phase-1 (modals, sidebar, header extraction)
 * 2. Replace local useState block with useChatStore destructure
 * 3. Add missing local useState declarations
 * 4. Remove duplicate declarations that remain in original code
 * 5. Add imports for useChatStore, modals, sidebar, header
 */

const fs = require('fs');
const path = require('path');

const chatPath = path.join(__dirname, 'frontend/src/pages/Chat.tsx');
let lines = fs.readFileSync(chatPath, 'utf8').split('\n');

// Helper: find line index containing a string, starting from optional offset
function findLine(str, startLine = 0) {
  for (let i = startLine; i < lines.length; i++) {
    if (lines[i].includes(str)) return i;
  }
  return -1;
}

console.log(`Total lines: ${lines.length}`);

// ══════════════════════════════════════════════════════════════════
// PHASE 1: Extract modals, sidebar, header (same as refactor-flawless.js)
// ══════════════════════════════════════════════════════════════════

// 1. BrandProfileModal
{
  let startIdx = findLine('{brandProfileModalOpen && (');
  let endIdx = findLine('{integrationsModalOpen && (', startIdx);
  if (startIdx !== -1 && endIdx !== -1) {
    let realStart = startIdx;
    while (realStart > 0 && !lines[realStart].includes('<AnimatePresence>')) realStart--;
    let realEnd = endIdx - 1;
    while (realEnd > 0 && !lines[realEnd].includes('<AnimatePresence>')) realEnd--;
    realEnd--;
    lines.splice(realStart, realEnd - realStart + 1,
      '      <BrandProfileModal isOpen={brandProfileModalOpen} onClose={() => setBrandProfileModalOpen(false)} />');
    console.log('✅ Extracted BrandProfileModal');
  }
}

// 2. IntegrationsModal
{
  let startIdx = findLine('{integrationsModalOpen && (');
  let endIdx = findLine('{/* Phase 2 Quiz Popup */}', startIdx);
  if (startIdx !== -1 && endIdx !== -1) {
    let realStart = startIdx;
    while (realStart > 0 && !lines[realStart].includes('<AnimatePresence>')) realStart--;
    let realEnd = endIdx - 1;
    lines.splice(realStart, realEnd - realStart + 1,
      '      <IntegrationsModal isOpen={integrationsModalOpen} onClose={() => setIntegrationsModalOpen(false)} />');
    console.log('✅ Extracted IntegrationsModal');
  }
}

// 3. Phase2QuizPopup
{
  let startIdx = findLine('{phase2PopupOpen && (');
  let endIdx = findLine('{/* Glossary Panel */}', startIdx);
  if (startIdx !== -1 && endIdx !== -1) {
    let realStart = startIdx;
    while (realStart > 0 && !lines[realStart].includes('{/* Phase 2 Quiz Popup */}')) realStart--;
    let realEnd = endIdx - 1;
    lines.splice(realStart, realEnd - realStart + 1,
      '      {/* Phase 2 Quiz Popup */}\n      <Phase2QuizPopup isOpen={phase2PopupOpen} onClose={() => setPhase2PopupOpen(false)} phase2Step={phase2Step} phase2Questions={phase2Questions as any} phase2Answers={phase2Answers} phase2TextInput={phase2TextInput} setPhase2TextInput={setPhase2TextInput} phase2CustomOpen={phase2CustomOpen} setPhase2CustomOpen={setPhase2CustomOpen} phase2CustomInput={phase2CustomInput} setPhase2CustomInput={setPhase2CustomInput} handlePhase2Answer={handlePhase2Answer} handlePhase2CustomSubmit={handlePhase2CustomSubmit} handlePhase2SkipQuestion={handlePhase2SkipQuestion} handleSkipToStage3={handleSkipToStage3} />');
    console.log('✅ Extracted Phase2QuizPopup');
  }
}

// 4. GlossaryPanel
{
  let startIdx = findLine('{glossaryOpen && (');
  if (startIdx !== -1) {
    let realStart = startIdx;
    while (realStart > 0 && !lines[realStart].includes('{/* Glossary Panel */}')) realStart--;
    let currentEnd = realStart;
    while (currentEnd < lines.length && !lines[currentEnd].includes('</AnimatePresence>')) currentEnd++;
    lines.splice(realStart, currentEnd - realStart + 1,
      '      {/* Glossary Panel */}\n      <GlossaryPanel isOpen={glossaryOpen} onClose={() => setGlossaryOpen(false)} glossaryMatches={glossaryMatches} />');
    console.log('✅ Extracted GlossaryPanel');
  }
}

// 5. ChatSidebar
{
  let startIdx = findLine('className={`chat-sidebar');
  if (startIdx !== -1) {
    let realStart = startIdx;
    while (realStart > 0 && !lines[realStart].includes('<motion.aside')) realStart--;
    let endIdx = findLine('</motion.aside>', startIdx);
    if (endIdx !== -1) {
      lines.splice(realStart, endIdx - realStart + 1,
`      <ChatSidebar 
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        sidebarPanelWidth={sidebarPanelWidth}
        handleNewChat={handleNewChat}
        sidebarScrollRef={sidebarScrollRef}
        handleScrollToTopVisible={handleScrollToTopVisible}
        setShowSidebarBackToTop={setShowSidebarBackToTop}
        showSidebarBackToTop={showSidebarBackToTop}
        sortedCampaigns={sortedCampaigns}
        campaignId={campaignId}
        editingCampaignId={editingCampaignId}
        editingName={editingName}
        activeCampaignMenu={activeCampaignMenu}
        navigate={navigate}
        setActiveCampaignMenu={setActiveCampaignMenu}
        setEditingCampaignId={setEditingCampaignId}
        setEditingName={setEditingName}
        handleRenameCampaign={handleRenameCampaign}
        openDeleteModal={openDeleteModal}
        handleToggleFavorite={handleToggleFavorite}
        scrollToTop={scrollToTop}
        userMenuRef={userMenuRef}
        userMenuOpen={userMenuOpen}
        setUserMenuOpen={setUserMenuOpen}
        user={user}
        handleLogout={handleLogout}
        setBrandProfileModalOpen={setBrandProfileModalOpen}
        setIntegrationsModalOpen={setIntegrationsModalOpen}
      />`);
      console.log('✅ Extracted ChatSidebar');
    }
  }
}

// 6. ChatHeader
{
  let startIdx = findLine('<header className="chat-header">');
  if (startIdx !== -1) {
    let endIdx = findLine('</header>', startIdx);
    if (endIdx !== -1) {
      lines.splice(startIdx, endIdx - startIdx + 1,
`        <ChatHeader
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          currentCampaign={currentCampaign}
          handleResetToStage={handleResetToStage}
          stageTransitionPending={stageTransitionPending}
          currentStage={currentStage}
          STAGE_DESCRIPTORS={STAGE_DESCRIPTORS as any}
          guidePopupOpen={guidePopupOpen}
          setGuidePopupOpen={setGuidePopupOpen}
          glossaryOpen={glossaryOpen}
          setGlossaryOpen={setGlossaryOpen}
          insightsOpen={insightsOpen}
          setInsightsOpen={setInsightsOpen}
          setClearModalOpen={setClearModalOpen}
          setEditQuizModalOpen={setEditQuizModalOpen}
          messages={messages}
        />`);
      console.log('✅ Extracted ChatHeader');
    }
  }
}

// 7. Remove CampaignItem inline definition
{
  let startIdx = findLine('interface CampaignItemProps {');
  if (startIdx !== -1) {
    let realStart = startIdx;
    if (lines[realStart - 1] && lines[realStart - 1].includes('// Campaign item component')) {
      realStart--;
    }
    lines.splice(realStart, lines.length - realStart);
    console.log('✅ Removed CampaignItem (exists in CampaignItem.tsx)');
  }
}

// ══════════════════════════════════════════════════════════════════
// PHASE 2: Replace local useState block → useChatStore destructure
// ══════════════════════════════════════════════════════════════════

// Find exact range: from "const [messages, setMessages]" to "const [metricsInputs, setMetricsInputs]"
{
  const blockStart = findLine('const [messages, setMessages] = useState<Message[]>([])');
  const blockEnd = findLine('const [metricsInputs, setMetricsInputs] = useState<Record<string, string>>({})');

  if (blockStart !== -1 && blockEnd !== -1) {
    const storeDestructure = [
      '  const {',
      '    messages, setMessages,',
      '    campaigns, setCampaigns,',
      '    currentCampaign, setCurrentCampaign,',
      '    loading, setLoading,',
      '    initialLoading, setInitialLoading,',
      '    metricsSnapshots, setMetricsSnapshots,',
      '    contentPaneCollapsed, setContentPaneCollapsed,',
      '    strategyWidth, setStrategyWidth,',
      '    isDraggingPane, setIsDraggingPane,',
      '    assistLoading, setAssistLoading,',
      '    contentInput, setContentInput,',
      '    activeTactics, setActiveTactics,',
      '    metricsInputs, setMetricsInputs,',
      '    metricsPeriodStart, setMetricsPeriodStart,',
      '    metricsPeriodEnd, setMetricsPeriodEnd,',
      '    metricsLabel, setMetricsLabel,',
      '    editingQuizField, setEditingQuizField,',
      '    editingQuizValue, setEditingQuizValue',
      '  } = useChatStore();',
    ];
    lines.splice(blockStart, blockEnd - blockStart + 1, ...storeDestructure);
    console.log(`✅ Replaced useState block (${blockStart + 1}–${blockEnd + 1}) with useChatStore`);
  } else {
    console.error(`❌ Could not find state block: start=${blockStart} end=${blockEnd}`);
    process.exit(1);
  }
}

// Now remove the remaining duplicate individual useState declarations
// These come AFTER the block we just replaced:
const dupsToRemove = [
  'const [assistLoading, setAssistLoading] = useState(false)',
  "const [contentInput, setContentInput] = useState('')",
  'const [activeTactics, setActiveTactics] = useState<string[]>',
  'const [editingQuizField, setEditingQuizField] = useState<string | null>',
  "const [editingQuizValue, setEditingQuizValue] = useState('')",
  'const [strategyWidth, setStrategyWidth] = useState(60)',
  'const [isDraggingPane, setIsDraggingPane] = useState(false)',
  'const [contentPaneCollapsed, setContentPaneCollapsed] = useState(false)',
  "const [metricsLabel, setMetricsLabel] = useState('')",
  "const [metricsPeriodStart, setMetricsPeriodStart] = useState('')",
  "const [metricsPeriodEnd, setMetricsPeriodEnd] = useState('')",
  'const [metricsSnapshots, setMetricsSnapshots] = useState<MetricsSnapshot[]>',
];

for (const dup of dupsToRemove) {
  const idx = findLine(dup);
  if (idx !== -1) {
    lines.splice(idx, 1);
    console.log(`✅ Removed dup: ${dup.slice(0, 55)}`);
  }
  // check again (might have shifted)
  const idx2 = findLine(dup);
  if (idx2 !== -1) {
    lines.splice(idx2, 1);
    console.log(`✅ Removed dup (2nd): ${dup.slice(0, 55)}`);
  }
}

// Also remove the stageTransitionPending/Error if they appear TWICE
['const [stageTransitionPending', 'const [stageTransitionError'].forEach(dup => {
  let count = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(dup)) {
      count++;
      if (count === 2) {
        lines.splice(i, 1);
        console.log(`✅ Removed 2nd copy: ${dup}`);
        break;
      }
    }
  }
});

// ══════════════════════════════════════════════════════════════════
// PHASE 3: Add imports at the top
// ══════════════════════════════════════════════════════════════════

{
  const content = lines.join('\n');
  let newContent = content;

  // Add useChatStore import after useAuthStore import
  if (!newContent.includes('useChatStore')) {
    newContent = newContent.replace(
      "import { useAuthStore } from '../store/authStore';",
      "import { useAuthStore } from '../store/authStore';\nimport { useChatStore } from '../store/chatStore';"
    );
    console.log('✅ Added useChatStore import');
  }

  // Add component imports before Chat.css import
  if (!newContent.includes('BrandProfileModal')) {
    const componentImports = `import BrandProfileModal from '../components/chat/modals/BrandProfileModal';
import IntegrationsModal from '../components/chat/modals/IntegrationsModal';
import Phase2QuizPopup from '../components/chat/modals/Phase2QuizPopup';
import GlossaryPanel from '../components/chat/modals/GlossaryPanel';
import ChatSidebar from '../components/chat/ChatSidebar';
import ChatHeader from '../components/chat/ChatHeader';
`;
    newContent = newContent.replace(
      "import './Chat.css';",
      componentImports + "import './Chat.css';"
    );
    console.log('✅ Added component imports');
  }

  fs.writeFileSync(chatPath, newContent);
}

console.log('\n✅ All phases complete!');
console.log(`Final line count: ${lines.length}`);
console.log('Now run: cd frontend && npx tsc --noEmit');
