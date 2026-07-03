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

// 1. BrandProfileModal
let startIdx = findLine('{brandProfileModalOpen && (');
let endIdx = findLine('{integrationsModalOpen && (', startIdx);
if (startIdx !== -1 && endIdx !== -1) {
  let realStart = startIdx;
  while (!lines[realStart].includes('<AnimatePresence>')) realStart--;
  
  let realEnd = endIdx - 1;
  while (!lines[realEnd].includes('<AnimatePresence>')) realEnd--; 
  realEnd--;
  
  lines.splice(realStart, realEnd - realStart + 1, '      <BrandProfileModal isOpen={brandProfileModalOpen} onClose={() => setBrandProfileModalOpen(false)} />');
}

// 2. IntegrationsModal
startIdx = findLine('{integrationsModalOpen && (');
endIdx = findLine('{/* Phase 2 Quiz Popup */}', startIdx);
if (startIdx !== -1 && endIdx !== -1) {
  let realStart = startIdx;
  while (!lines[realStart].includes('<AnimatePresence>')) realStart--;
  
  let realEnd = endIdx - 1;
  lines.splice(realStart, realEnd - realStart + 1, '      <IntegrationsModal isOpen={integrationsModalOpen} onClose={() => setIntegrationsModalOpen(false)} />');
}

// 3. Phase2QuizPopup
startIdx = findLine('{phase2PopupOpen && (');
endIdx = findLine('{/* Glossary Panel */}', startIdx);
if (startIdx !== -1 && endIdx !== -1) {
  let realStart = startIdx;
  while (!lines[realStart].includes('<!-- Phase 2 Quiz Popup -->') && !lines[realStart].includes('{/* Phase 2 Quiz Popup */}')) realStart--;
  
  let realEnd = endIdx - 1;
  lines.splice(realStart, realEnd - realStart + 1, '      {/* Phase 2 Quiz Popup */}\n      <Phase2QuizPopup isOpen={phase2PopupOpen} onClose={() => setPhase2PopupOpen(false)} phase2Step={phase2Step} phase2Questions={phase2Questions as any} phase2Answers={phase2Answers} phase2TextInput={phase2TextInput} setPhase2TextInput={setPhase2TextInput} phase2CustomOpen={phase2CustomOpen} setPhase2CustomOpen={setPhase2CustomOpen} phase2CustomInput={phase2CustomInput} setPhase2CustomInput={setPhase2CustomInput} handlePhase2Answer={handlePhase2Answer} handlePhase2CustomSubmit={handlePhase2CustomSubmit} handlePhase2SkipQuestion={handlePhase2SkipQuestion} handleSkipToStage3={handleSkipToStage3} />');
}

// 4. GlossaryPanel
startIdx = findLine('{glossaryOpen && (');
endIdx = findLine('function CampaignItem({', startIdx);
if (startIdx !== -1 && endIdx !== -1) {
  let realStart = startIdx;
  while (!lines[realStart].includes('{/* Glossary Panel */}')) realStart--;
  
  let currentEnd = realStart;
  while (!lines[currentEnd].includes('</AnimatePresence>')) currentEnd++;
  lines.splice(realStart, currentEnd - realStart + 1, '      {/* Glossary Panel */}\n      <GlossaryPanel isOpen={glossaryOpen} onClose={() => setGlossaryOpen(false)} glossaryMatches={glossaryMatches} />');
}

// 5. ChatSidebar
startIdx = findLine('className={`chat-sidebar');
if (startIdx !== -1) {
  let realStart = startIdx;
  while (!lines[realStart].includes('<motion.aside')) realStart--;
  endIdx = findLine('</motion.aside>', startIdx);
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
}

// 6. ChatHeader
startIdx = findLine('<header className="chat-header">');
if (startIdx !== -1) {
  endIdx = findLine('</header>', startIdx);
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
}

// 7. Remove CampaignItem from Chat.tsx entirely
startIdx = findLine('interface CampaignItemProps {');
if (startIdx !== -1) {
  // Back up to the comment above it if present
  let realStart = startIdx;
  if (lines[realStart - 1] && lines[realStart - 1].includes('// Campaign item component')) {
    realStart--;
  }
  lines.splice(realStart, lines.length - realStart);
}

let newContent = lines.join('\n');
const imports = `import BrandProfileModal from '../components/chat/modals/BrandProfileModal';
import IntegrationsModal from '../components/chat/modals/IntegrationsModal';
import Phase2QuizPopup from '../components/chat/modals/Phase2QuizPopup';
import GlossaryPanel from '../components/chat/modals/GlossaryPanel';
import ChatSidebar from '../components/chat/ChatSidebar';
import ChatHeader from '../components/chat/ChatHeader';
`;
newContent = newContent.replace("type Message = ChatMessage;", imports + "\ntype Message = ChatMessage;");

fs.writeFileSync(chatPath, newContent);
console.log('Safe refactoring completed.');
