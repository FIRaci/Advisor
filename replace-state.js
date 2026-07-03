const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/Chat.tsx', 'utf8');

// Add import for useChatStore
if (!code.includes('useChatStore')) {
  code = code.replace(
    "import { useAuthStore } from '../store/authStore';",
    "import { useAuthStore } from '../store/authStore';\nimport { useChatStore } from '../store/chatStore';"
  );
}

// State replacements
const replacements = [
  "const [messages, setMessages] = useState<Message[]>([]);",
  "const [campaigns, setCampaigns] = useState<Campaign[]>([]);",
  "const [currentCampaign, setCurrentCampaign] = useState<Campaign | null>(null);",
  "const [loading, setLoading] = useState(false);",
  "const [initialLoading, setInitialLoading] = useState(true);",
  "const [assistLoading, setAssistLoading] = useState(false);",
  "const [contentInput, setContentInput] = useState('');",
  "const [activeTactics, setActiveTactics] = useState<string[]>([]);",
  "const [editingQuizField, setEditingQuizField] = useState<string | null>(null);",
  "const [editingQuizValue, setEditingQuizValue] = useState('');",
  "const [strategyWidth, setStrategyWidth] = useState(60);",
  "const [contentPaneCollapsed, setContentPaneCollapsed] = useState(false);",
  "const [metricsSnapshots, setMetricsSnapshots] = useState<MetricsSnapshot[]>([]);",
  "const [metricsLabel, setMetricsLabel] = useState('');",
  "const [metricsPeriodStart, setMetricsPeriodStart] = useState('');",
  "const [metricsPeriodEnd, setMetricsPeriodEnd] = useState('');",
  "const [metricsInputs, setMetricsInputs] = useState<Record<string, string>>({});"
];

const destructure = 
  const {
    messages, setMessages,
    campaigns, setCampaigns,
    currentCampaign, setCurrentCampaign,
    loading, setLoading,
    initialLoading, setInitialLoading,
    metricsSnapshots, setMetricsSnapshots,
    contentPaneCollapsed, setContentPaneCollapsed,
    strategyWidth, setStrategyWidth,
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
;

let hasInsertedDestructure = false;

replacements.forEach(rep => {
  if (code.includes(rep)) {
    if (!hasInsertedDestructure) {
      code = code.replace(rep, destructure.trim());
      hasInsertedDestructure = true;
    } else {
      code = code.replace(rep + '\n', '');
      code = code.replace(rep, '');
    }
  }
});

fs.writeFileSync('frontend/src/pages/Chat.tsx', code);
console.log('State replaced!');
