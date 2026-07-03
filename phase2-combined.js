/**
 * Phase 2 Refactor: Replace local useState with useChatStore
 * Uses line-number-based replacement for reliability with CRLF files
 */
const fs = require('fs');
const path = require('path');

const chatPath = path.join(__dirname, 'frontend/src/pages/Chat.tsx');
let lines = fs.readFileSync(chatPath, 'utf8').split('\n');

const findLine = (str, startLine = 0) => {
  for (let i = startLine; i < lines.length; i++) {
    if (lines[i].includes(str)) return i;
  }
  return -1;
};

// ── STEP 1: Remove useAuthStore import and add both authStore + chatStore ──
const authImportIdx = findLine("import { useAuthStore } from '../store/authStore'");
if (authImportIdx !== -1 && !lines[authImportIdx + 1].includes('useChatStore')) {
  lines.splice(authImportIdx + 1, 0, "import { useChatStore } from '../store/chatStore';");
  console.log('✅ Added useChatStore import');
}

// ── STEP 2: Replace local useState block with useChatStore destructure ──
// Find the start: const [messages, setMessages] = useState<Message[]>([]);
const stateBlockStart = findLine("const [messages, setMessages] = useState<Message[]>([])");
// Find the end: we go until metricsInputs useState
const stateBlockEnd = findLine("const [metricsInputs, setMetricsInputs] = useState<Record<string, string>>({});", stateBlockStart);

if (stateBlockStart !== -1 && stateBlockEnd !== -1) {
  const storeDestructure = [
    "  const {",
    "    messages, setMessages,",
    "    campaigns, setCampaigns,",
    "    currentCampaign, setCurrentCampaign,",
    "    loading, setLoading,",
    "    initialLoading, setInitialLoading,",
    "    metricsSnapshots, setMetricsSnapshots,",
    "    contentPaneCollapsed, setContentPaneCollapsed,",
    "    strategyWidth, setStrategyWidth,",
    "    isDraggingPane, setIsDraggingPane,",
    "    assistLoading, setAssistLoading,",
    "    contentInput, setContentInput,",
    "    activeTactics, setActiveTactics,",
    "    metricsInputs, setMetricsInputs,",
    "    metricsPeriodStart, setMetricsPeriodStart,",
    "    metricsPeriodEnd, setMetricsPeriodEnd,",
    "    metricsLabel, setMetricsLabel,",
    "    editingQuizField, setEditingQuizField,",
    "    editingQuizValue, setEditingQuizValue",
    "  } = useChatStore();",
  ];
  lines.splice(stateBlockStart, stateBlockEnd - stateBlockStart + 1, ...storeDestructure);
  console.log(`✅ Replaced local useState block (lines ${stateBlockStart + 1}–${stateBlockEnd + 1}) with useChatStore`);
} else {
  console.error(`❌ Could not find state block: start=${stateBlockStart} end=${stateBlockEnd}`);
}

// ── STEP 3: Remove remaining duplicate local useState declarations ──
// Now find and remove these lines that are still in the file:
const dupPatterns = [
  "const [assistLoading, setAssistLoading] = useState(false);",
  "const [contentInput, setContentInput] = useState('');",
  "const [activeTactics, setActiveTactics] = useState<string[]>([]);",
  "const [editingQuizField, setEditingQuizField] = useState<string | null>(null);",
  "const [editingQuizValue, setEditingQuizValue] = useState('');",
  "const [strategyWidth, setStrategyWidth] = useState(60);",
  "const [isDraggingPane, setIsDraggingPane] = useState(false);",
  "const [contentPaneCollapsed, setContentPaneCollapsed] = useState(false);",
  "const [metricsLabel, setMetricsLabel] = useState('');",
  "const [metricsPeriodStart, setMetricsPeriodStart] = useState('');",
  "const [metricsPeriodEnd, setMetricsPeriodEnd] = useState('');",
];

for (const dup of dupPatterns) {
  const idx = findLine(dup.trim());
  if (idx !== -1) {
    lines.splice(idx, 1);
    console.log(`✅ Removed duplicate: ${dup.trim().slice(0, 55)}`);
  } else {
    console.warn(`⚠️  Not found: ${dup.trim().slice(0, 55)}`);
  }
}

// Also remove the standalone metricsSnapshots useState (if not already gone via block removal)
const msIdx = findLine("const [metricsSnapshots, setMetricsSnapshots] = useState<MetricsSnapshot[]>([]);");
if (msIdx !== -1) {
  lines.splice(msIdx, 1);
  console.log('✅ Removed duplicate metricsSnapshots useState');
}

// ── STEP 4: Fix MetricsSnapshot import — now it's just used as a type ──
// No change needed, type is still exported from useApi.

// ── STEP 5: Run Phase-1 extractions (modals, sidebar, header) ──
// (same as refactor-flawless.js)
const findLineFrom = (str, startLine = 0) => {
  for (let i = startLine; i < lines.length; i++) {
    if (lines[i].includes(str)) return i;
  }
  return -1;
};

// 1. BrandProfileModal
let startIdx = findLineFrom('{brandProfileModalOpen && (');
let endIdx = findLineFrom('{integrationsModalOpen && (', startIdx);
if (startIdx !== -1 && endIdx !== -1) {
  let realStart = startIdx;
  while (!lines[realStart].includes('<AnimatePresence>')) realStart--;
  let realEnd = endIdx - 1;
  while (!lines[realEnd].includes('<AnimatePresence>')) realEnd--;
  realEnd--;
  lines.splice(realStart, realEnd - realStart + 1, '      <BrandProfileModal isOpen={brandProfileModalOpen} onClose={() => setBrandProfileModalOpen(false)} />');
  console.log('✅ Extracted BrandProfileModal');
}

// 2. IntegrationsModal
startIdx = findLineFrom('{integrationsModalOpen && (');
endIdx = findLineFrom('{/* Phase 2 Quiz Popup */}', startIdx);
if (startIdx !== -1 && endIdx !== -1) {
  let realStart = startIdx;
  while (!lines[realStart].includes('<AnimatePresence>')) realStart--;
  let realEnd = endIdx - 1;
  lines.splice(realStart, realEnd - realStart + 1, '      <IntegrationsModal isOpen={integrationsModalOpen} onClose={() => setIntegrationsModalOpen(false)} />');
  console.log('✅ Extracted IntegrationsModal');
}

// 3. Phase2QuizPopup
startIdx = findLineFrom('{phase2PopupOpen && (');
endIdx = findLineFrom('{/* Glossary Panel */}', startIdx);
if (startIdx !== -1 && endIdx !== -1) {
  let realStart = startIdx;
  while (!lines[realStart].includes('{/* Phase 2 Quiz Popup */}')) realStart--;
  let realEnd = endIdx - 1;
  lines.splice(realStart, realEnd - realStart + 1,
    '      {/* Phase 2 Quiz Popup */}\n      <Phase2QuizPopup isOpen={phase2PopupOpen} onClose={() => setPhase2PopupOpen(false)} phase2Step={phase2Step} phase2Questions={phase2Questions as any} phase2Answers={phase2Answers} phase2TextInput={phase2TextInput} setPhase2TextInput={setPhase2TextInput} phase2CustomOpen={phase2CustomOpen} setPhase2CustomOpen={setPhase2CustomOpen} phase2CustomInput={phase2CustomInput} setPhase2CustomInput={setPhase2CustomInput} handlePhase2Answer={handlePhase2Answer} handlePhase2CustomSubmit={handlePhase2CustomSubmit} handlePhase2SkipQuestion={handlePhase2SkipQuestion} handleSkipToStage3={handleSkipToStage3} />'
  );
  console.log('✅ Extracted Phase2QuizPopup');
}

// 4. GlossaryPanel
startIdx = findLineFrom('{glossaryOpen && (');
endIdx = findLineFrom('interface CampaignItemProps {', startIdx);
if (startIdx !== -1 && endIdx !== -1) {
  let realStart = startIdx;
  while (!lines[realStart].includes('{/* Glossary Panel */}')) realStart--;
  let currentEnd = realStart;
  while (!lines[currentEnd].includes('</AnimatePresence>')) currentEnd++;
  lines.splice(realStart, currentEnd - realStart + 1, '      {/* Glossary Panel */}\n      <GlossaryPanel isOpen={glossaryOpen} onClose={() => setGlossaryOpen(false)} glossaryMatches={glossaryMatches} />');
  console.log('✅ Extracted GlossaryPanel');
}

// 5. ChatSidebar
startIdx = findLineFrom('className={`chat-sidebar');
if (startIdx !== -1) {
  let realStart = startIdx;
  while (!lines[realStart].includes('<motion.aside')) realStart--;
  endIdx = findLineFrom('</motion.aside>', startIdx);
  lines.splice(realStart, endIdx - realStart + 1, `      <ChatSidebar 
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

// 6. ChatHeader
startIdx = findLineFrom('<header className="chat-header">');
if (startIdx !== -1) {
  endIdx = findLineFrom('</header>', startIdx);
  lines.splice(startIdx, endIdx - startIdx + 1, `        <ChatHeader
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

// 7. Remove CampaignItem from Chat.tsx entirely
startIdx = findLineFrom('interface CampaignItemProps {');
if (startIdx !== -1) {
  let realStart = startIdx;
  if (lines[realStart - 1] && lines[realStart - 1].includes('// Campaign item component')) {
    realStart--;
  }
  lines.splice(realStart, lines.length - realStart);
  console.log('✅ Removed CampaignItem (moved to CampaignItem.tsx)');
}

// ── STEP 6: Add modal/sidebar/header imports ──
let newContent = lines.join('\n');
const importBlock = `import BrandProfileModal from '../components/chat/modals/BrandProfileModal';
import IntegrationsModal from '../components/chat/modals/IntegrationsModal';
import Phase2QuizPopup from '../components/chat/modals/Phase2QuizPopup';
import GlossaryPanel from '../components/chat/modals/GlossaryPanel';
import ChatSidebar from '../components/chat/ChatSidebar';
import ChatHeader from '../components/chat/ChatHeader';
`;

if (!newContent.includes('BrandProfileModal')) {
  newContent = newContent.replace(
    "import './Chat.css';",
    importBlock + "\nimport './Chat.css';"
  );
  console.log('✅ Added modal/sidebar/header imports');
}

fs.writeFileSync(chatPath, newContent);
console.log('\n✅ Phase 2 migration complete!');
console.log('Now run: cd frontend && npx tsc --noEmit');
