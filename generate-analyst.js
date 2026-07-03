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

// Extract imports from Chat.tsx
const imports = lines.filter(l => l.startsWith('import ')).join('\n');

// Analyst boundaries
const analystStart = findLine('<div className="chat-pane strategy-pane"');
let analystEnd = findLine('<ChatInput');
while (!lines[analystEnd].includes('</div>')) analystEnd++;

const analystJsx = lines.slice(analystStart, analystEnd + 1).join('\n');

const analystCode = `
import React, { useRef, useState, useMemo, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowDown, X, Package, Target, Users, Megaphone, TrendingUp, DollarSign } from 'lucide-react';
import { useChatStore } from '../../store/chatStore';
import ChatInput from './ChatInput';

interface AnalystPaneProps {
  handlePaneScroll: (e: React.UIEvent<HTMLDivElement>, setShowScrollDown: React.Dispatch<React.SetStateAction<boolean>>) => void;
  scrollToBottom: (ref: React.RefObject<HTMLDivElement>) => void;
  handleSend: (content: string, skipQuiz?: boolean) => Promise<void>;
  handleOpenFullQuiz: () => void;
  handleResetToStage: (stage: number) => Promise<void>;
  stageTransitionPending: boolean;
  quizDataIssue: any;
  currentStage: number;
  STAGE_DESCRIPTORS: any;
  analystMessages: any[];
  fullQuizProfile: any[];
  messagesEndRef: React.RefObject<HTMLDivElement>;
  analystScrollContainerRef: React.RefObject<HTMLDivElement>;
}

export default function AnalystPane({
  handlePaneScroll,
  scrollToBottom,
  handleSend,
  handleOpenFullQuiz,
  handleResetToStage,
  stageTransitionPending,
  quizDataIssue,
  currentStage,
  STAGE_DESCRIPTORS,
  analystMessages,
  fullQuizProfile,
  messagesEndRef,
  analystScrollContainerRef
}: AnalystPaneProps) {
  const { currentCampaign, showContentPane, strategyWidth, initialLoading, assistLoading } = useChatStore();
  const [showAnalystScrollDown, setShowAnalystScrollDown] = useState(false);
  const [isStageBannerHidden, setIsStageBannerHidden] = useState(false);

  // Derived state that was in Chat.tsx
  const stageTransitionError = null; // Assuming handled elsewhere or add to props if needed

  return (
    <>
      ${analystJsx}
    </>
  );
}
`;

fs.writeFileSync(path.join(__dirname, 'frontend/src/components/chat/AnalystPane.tsx'), analystCode);
console.log('✅ Generated AnalystPane.tsx');
