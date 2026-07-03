const fs = require('fs');

const analystBody = fs.readFileSync('c:/Users/TSC/Desktop/Nothing/GR1/analyst_pane_body.txt', 'utf8');
const analystCode = `import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Check, Copy, ArrowRight, Target, ArrowDown, FileText, ListChecks, MessageSquare, HelpCircle, CheckCircle2, Circle, Zap, Award, BarChart3, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ChatInput from '../../components/ChatInput';
import CampaignProfileCard from './CampaignProfileCard';

export default function AnalystPane({
  showContentPane, strategyWidth, analystScrollContainerRef, handlePaneScroll, setShowAnalystScrollDown,
  initialLoading, analystMessages, currentCampaign, fullQuizProfile, formatTime, hasTargetKeywords,
  handleExtractTargets, handleCopyMessage, copiedId, user, loading, messagesEndRef, showAnalystScrollDown,
  scrollToBottom, handleSend, handleOpenFullQuiz, sendToContentWriter, focusComposer, setGuideActiveTab,
  setGuidePopupOpen, classifyPane, STAGE_DESCRIPTORS, cleanContent, parsePlanOptions, reactMarkdownComponents,
  selectedPlanInChat, handleSelectPlan, currentStage, hasStageTransition, handleAssistContent, assistLoading,
  handleAdvanceStage, handleReanalyze, setContentInput, activeTactics, setActiveTactics
}: any) {
  return (
` + analystBody + `
  );
}
`;
fs.writeFileSync('c:/Users/TSC/Desktop/Nothing/GR1/frontend/src/components/chat/AnalystPane.tsx', analystCode);

const contentBody = fs.readFileSync('c:/Users/TSC/Desktop/Nothing/GR1/content_pane_body.txt', 'utf8');
const contentCode = `import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Check, Copy, ArrowRight, Target, ArrowDown, FileText, X, CheckCircle2, Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function ContentWriterPane({
  showContentPane, setContentPaneCollapsed, activeTactics, setActiveTactics, newTactic, setNewTactic,
  showTacticsDropdown, setShowTacticsDropdown, TACTIC_SUGGESTIONS, contentScrollContainerRef,
  handlePaneScroll, setShowContentScrollDown, contentMessages, contentPaneMode, currentCampaign,
  assistLoading, handleAutoGenerateContent, user, reactMarkdownComponents, contentMessagesEndRef,
  showContentScrollDown, scrollToBottom, contentInput, setContentInput, handleSendContent
}: any) {
  return (
` + contentBody + `
  );
}
`;
fs.writeFileSync('c:/Users/TSC/Desktop/Nothing/GR1/frontend/src/components/chat/ContentWriterPane.tsx', contentCode);
console.log('Files created');
