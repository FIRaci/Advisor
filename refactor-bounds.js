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
let endIdx = findLine('integrationsModalOpen && (', startIdx);
if (startIdx !== -1 && endIdx !== -1) {
  let realStart = startIdx;
  while (!lines[realStart].includes('<AnimatePresence>')) realStart--;
  
  let realEnd = endIdx;
  while (!lines[realEnd].includes('<AnimatePresence>')) realEnd--; // realEnd is the AnimatePresence of IntegrationsModal
  realEnd--; // The line before AnimatePresence of IntegrationsModal is where BrandProfileModal ends
  
  lines.splice(realStart, realEnd - realStart + 1, '      <AnimatePresence>\n        {brandProfileModalOpen && <BrandProfileModal brandProfileOpen={brandProfileModalOpen} setBrandProfileOpen={setBrandProfileModalOpen} />}\n      </AnimatePresence>');
}

// 2. IntegrationsModal
startIdx = findLine('{integrationsModalOpen && (');
endIdx = findLine('{/* Phase 2 Quiz Popup */}', startIdx);
if (startIdx !== -1 && endIdx !== -1) {
  let realStart = startIdx;
  while (!lines[realStart].includes('<AnimatePresence>')) realStart--;
  
  let realEnd = endIdx - 1;
  lines.splice(realStart, realEnd - realStart + 1, '      <AnimatePresence>\n        {integrationsModalOpen && <IntegrationsModal integrationsModalOpen={integrationsModalOpen} setIntegrationsModalOpen={setIntegrationsModalOpen} integrations={integrations} />}\n      </AnimatePresence>');
}

// 3. Phase2QuizPopup
startIdx = findLine('{phase2PopupOpen && (');
endIdx = findLine('{/* Glossary Panel */}', startIdx);
if (startIdx !== -1 && endIdx !== -1) {
  let realStart = startIdx;
  while (!lines[realStart].includes('<!-- Phase 2 Quiz Popup -->') && !lines[realStart].includes('{/* Phase 2 Quiz Popup */}')) realStart--;
  
  let realEnd = endIdx - 1;
  lines.splice(realStart, realEnd - realStart + 1, '      {/* Phase 2 Quiz Popup */}\n      <AnimatePresence>\n        {phase2PopupOpen && <Phase2QuizPopup phase2PopupOpen={phase2PopupOpen} setPhase2PopupOpen={setPhase2PopupOpen} handleCompletePhase2Quiz={handleCompletePhase2Quiz} currentCampaign={currentCampaign} phase2Step={phase2Step} phase2Questions={phase2Questions} phase2TextInput={phase2TextInput} setPhase2TextInput={setPhase2TextInput} handlePhase2Answer={handlePhase2Answer} phase2Answers={phase2Answers} setPhase2CustomOpen={setPhase2CustomOpen} phase2CustomOpen={phase2CustomOpen} setPhase2CustomInput={setPhase2CustomInput} phase2CustomInput={phase2CustomInput} handlePhase2CustomSubmit={handlePhase2CustomSubmit} handlePhase2SkipQuestion={handlePhase2SkipQuestion} handleSkipToStage3={handleSkipToStage3} />}\n      </AnimatePresence>');
}

// 4. GlossaryPanel
startIdx = findLine('{glossaryOpen && (');
endIdx = findLine('function CampaignItem({', startIdx);
if (startIdx !== -1 && endIdx !== -1) {
  let realStart = startIdx;
  while (!lines[realStart].includes('{/* Glossary Panel */}')) realStart--;
  
  let realEnd = endIdx - 1;
  lines.splice(realStart, realEnd - realStart + 1, '      {/* Glossary Panel */}\n      <AnimatePresence>\n        {glossaryOpen && <GlossaryPanel glossaryOpen={glossaryOpen} setGlossaryOpen={setGlossaryOpen} />}\n      </AnimatePresence>');
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
        campaigns={campaigns}
        currentCampaign={currentCampaign}
        createNewCampaign={createNewCampaign}
        handleSelectCampaign={handleSelectCampaign}
        setDeleteModalOpen={setDeleteModalOpen}
        setCampaignToDelete={setCampaignToDelete}
        toggleFavorite={toggleFavorite}
        formatTime={formatTime}
        setBrandProfileOpen={setBrandProfileModalOpen}
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
          messages={messages}
          currentStage={currentStage}
          stageTransitionPending={stageTransitionPending}
          handleResetToStage={handleResetToStage}
          STAGE_DESCRIPTORS={STAGE_DESCRIPTORS}
          insightsOpen={insightsOpen}
          setInsightsOpen={setInsightsOpen}
          guidePopupOpen={guidePopupOpen}
          setGuidePopupOpen={setGuidePopupOpen}
          glossaryOpen={glossaryOpen}
          setGlossaryOpen={setGlossaryOpen}
          setClearModalOpen={setClearModalOpen}
          setEditQuizModalOpen={setEditQuizModalOpen}
        />`);
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
