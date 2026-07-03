const fs = require('fs');
const path = require('path');

const chatTsxPath = path.join(__dirname, 'frontend/src/pages/Chat.tsx');
let tsxContent = fs.readFileSync(chatTsxPath, 'utf8');

// Find the Analyst Pane block
const analystStart = tsxContent.indexOf('{/* STRATEGY ANALYST PANE */}');
const analystEnd = tsxContent.indexOf('{/* CONTENT WRITER PANE (Right) */}');

if (analystStart === -1 || analystEnd === -1) {
  console.log('Could not find pane boundaries.');
  process.exit(1);
}

// Find the closing div of the analyst pane
let pane1Content = tsxContent.substring(analystStart, analystEnd);

// Find the end of ContentWriterPane (which is just before the Insights Dashboard or end of main container)
const contentEnd = tsxContent.indexOf('{/* Insights Dashboard (Overlay/Slide-out) */}');
let pane2Content = tsxContent.substring(analystEnd, contentEnd);

// Replace in Chat.tsx
const newChatTsx = tsxContent.replace(pane1Content, '<AnalystPane {...sharedProps} />\n          ')
                             .replace(pane2Content, '<ContentWriterPane {...sharedProps} />\n          ');

const analystPaneTsx = `import React, { useRef } from 'react';
import { Sparkles, BarChart3, RefreshCw, Copy, Check, MessageSquare, Zap, Target, ArrowRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ChatInput from '../components/ChatInput';

export default function AnalystPane(props: any) {
  const {
    showContentPane, analystRef, isStageBannerHidden, setIsStageBannerHidden,
    loading, handleAdvanceStage, CampaignProfileCard, analystMessages,
    classifyPane, STAGE_DESCRIPTORS, formatMessageTime, handleCopyMessage,
    copiedId, reactMarkdownComponents, hasTargetKeywords, handleExtractTargets,
    hasStageTransition, handleReanalyze, showAnalystScrollDown, scrollToBottom,
    user, focusComposer, setGuideActiveTab, setGuidePopupOpen,
    currentStage, currentCampaign, activeTactics, setActiveTactics,
    selectedPlanInChat, handleSelectPlan, setContentInput, handleAssistContent
  } = props;

  return (
    ${pane1Content.trim()}
  );
}
`;

const contentPaneTsx = `import React, { useRef } from 'react';
import { Sparkles, MessageSquare, ArrowRight, Zap, Target, RefreshCw, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ChatInput from '../components/ChatInput';

export default function ContentWriterPane(props: any) {
  const {
    showContentPane, writerRef, contentMessages, formatMessageTime,
    handleCopyMessage, copiedId, reactMarkdownComponents,
    showContentScrollDown, scrollToBottom, loading, currentCampaign
  } = props;

  return (
    ${pane2Content.trim()}
  );
}
`;

// Now we need to inject `sharedProps` into `Chat.tsx` right before the return statement
const returnIndex = newChatTsx.lastIndexOf('return (');
const sharedPropsInjection = `
  const sharedProps = {
    showContentPane, analystRef, isStageBannerHidden, setIsStageBannerHidden,
    loading, handleAdvanceStage, CampaignProfileCard, analystMessages,
    classifyPane, STAGE_DESCRIPTORS, formatMessageTime, handleCopyMessage,
    copiedId, reactMarkdownComponents, hasTargetKeywords, handleExtractTargets,
    hasStageTransition, handleReanalyze, showAnalystScrollDown, scrollToBottom,
    user, focusComposer, setGuideActiveTab, setGuidePopupOpen,
    currentStage, currentCampaign, activeTactics, setActiveTactics,
    selectedPlanInChat, handleSelectPlan, setContentInput, handleAssistContent,
    writerRef, contentMessages, showContentScrollDown
  };

  `;

let finalChatTsx = newChatTsx.substring(0, returnIndex) + sharedPropsInjection + newChatTsx.substring(returnIndex);

// Add imports
finalChatTsx = finalChatTsx.replace("import './Chat.css';", "import './Chat.css';\nimport AnalystPane from '../components/chat/AnalystPane';\nimport ContentWriterPane from '../components/chat/ContentWriterPane';");

fs.writeFileSync(path.join(__dirname, 'frontend/src/components/chat/AnalystPane.tsx'), analystPaneTsx);
fs.writeFileSync(path.join(__dirname, 'frontend/src/components/chat/ContentWriterPane.tsx'), contentPaneTsx);
fs.writeFileSync(chatTsxPath, finalChatTsx);

console.log('✅ Panes extracted successfully!');
