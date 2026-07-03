/**
 * Phase 2 Refactor: Migrate shared UI state from local useState to useChatStore
 * 
 * This script:
 * 1. Runs the Phase-1 extractions (modals, sidebar, header) first
 * 2. Replaces local useState for store-managed state with useChatStore destructure
 * 3. Removes the duplicate local useState declarations
 * 4. Cleans up unused imports
 */

const fs = require('fs');
const path = require('path');

const chatPath = path.join(__dirname, 'frontend/src/pages/Chat.tsx');
let content = fs.readFileSync(chatPath, 'utf8');

// ── STEP 1: Replace the entire useState block (lines 175–268) with useChatStore ──
// The original Chat.tsx declares state both locally and in store separately.
// We replace from the start of useState local declarations, down to the last
// duplicated state (metricsInputs).

// Find the start of local useState block (after useAuthStore line)
// and replace the whole block with just useChatStore destructure.

const localStateBlock = `  const [messages, setMessages] = useState<Message[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [currentCampaign, setCurrentCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);`;

const storeDestructure = `  const {
    messages, setMessages,
    campaigns, setCampaigns,
    currentCampaign, setCurrentCampaign,
    loading, setLoading,
    initialLoading, setInitialLoading,
    metricsSnapshots, setMetricsSnapshots,
    contentPaneCollapsed, setContentPaneCollapsed,
    strategyWidth, setStrategyWidth,
    isDraggingPane, setIsDraggingPane,
    assistLoading, setAssistLoading,
    contentInput, setContentInput,
    activeTactics, setActiveTactics,
    metricsInputs, setMetricsInputs,
    metricsPeriodStart, setMetricsPeriodStart,
    metricsPeriodEnd, setMetricsPeriodEnd,
    metricsLabel, setMetricsLabel,
    editingQuizField, setEditingQuizField,
    editingQuizValue, setEditingQuizValue
  } = useChatStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);`;

if (content.includes(localStateBlock)) {
  content = content.replace(localStateBlock, storeDestructure);
  console.log('✅ Replaced local state block with useChatStore destructure');
} else {
  console.error('❌ Could not find local state block to replace');
}

// ── STEP 2: Remove now-duplicate local useState declarations ──
const toRemove = [
  // assistLoading, contentInput, activeTactics (lines ~226-228)
  `  const [assistLoading, setAssistLoading] = useState(false);\n  const [contentInput, setContentInput] = useState('');\n  const [activeTactics, setActiveTactics] = useState<string[]>([]);\n`,
  // editingQuizField, editingQuizValue (lines ~230-231)
  `  const [editingQuizField, setEditingQuizField] = useState<string | null>(null);\n  const [editingQuizValue, setEditingQuizValue] = useState('');\n`,
  // strategyWidth, isDraggingPane, contentPaneCollapsed, metricsSnapshots, metricsLabel, etc
  `  const [strategyWidth, setStrategyWidth] = useState(60);\n  const [isDraggingPane, setIsDraggingPane] = useState(false);\n  const [contentPaneCollapsed, setContentPaneCollapsed] = useState(false);\n  const [metricsSnapshots, setMetricsSnapshots] = useState<MetricsSnapshot[]>([]);\n  const [metricsLabel, setMetricsLabel] = useState('');\n  const [metricsPeriodStart, setMetricsPeriodStart] = useState('');\n  const [metricsPeriodEnd, setMetricsPeriodEnd] = useState('');\n  const [metricsInputs, setMetricsInputs] = useState<Record<string, string>>({});\n`,
];

for (const snippet of toRemove) {
  if (content.includes(snippet)) {
    content = content.replace(snippet, '');
    console.log(`✅ Removed duplicate: ${snippet.trim().slice(0, 60)}...`);
  } else {
    // Try with \r\n line endings
    const crlf = snippet.replace(/\n/g, '\r\n');
    if (content.includes(crlf)) {
      content = content.replace(crlf, '');
      console.log(`✅ Removed duplicate (CRLF): ${snippet.trim().slice(0, 60)}...`);
    } else {
      console.warn(`⚠️  Could not find snippet: ${snippet.trim().slice(0, 60)}`);
    }
  }
}

// ── STEP 3: Add useChatStore import ──
if (!content.includes('import { useChatStore }')) {
  content = content.replace(
    `import { useAuthStore } from '../store/authStore';`,
    `import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';`
  );
  console.log('✅ Added useChatStore import');
}

// ── STEP 4: Remove MetricsSnapshot from api import (now in store) ──
// Keep it - still used for types elsewhere, leave as is.

fs.writeFileSync(chatPath, content);
console.log('\n✅ Phase 2 migration complete. Run: cd frontend && npx tsc --noEmit');
