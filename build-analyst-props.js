const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'frontend/src/components/chat/AnalystPane.tsx');
let content = fs.readFileSync(file, 'utf8');

// Add missing lucide icons
const iconRegex = /import \{ ([^}]+) \} from 'lucide-react';/;
const currentIconsMatch = content.match(iconRegex);
let currentIcons = currentIconsMatch ? currentIconsMatch[1].split(',').map(s => s.trim()) : [];
const missingIcons = ['ListChecks', 'MessageSquare', 'HelpCircle', 'Check', 'ArrowRight', 'BarChart3', 'RefreshCw', 'Copy', 'Zap', 'Award', 'Mail', 'FileText', 'Palette'];
for (const icon of missingIcons) {
    if (!currentIcons.includes(icon)) currentIcons.push(icon);
}
content = content.replace(iconRegex, `import { ${currentIcons.join(', ')} } from 'lucide-react';`);

// Add missing react-markdown imports
content = `import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
` + content;

// Extend AnalystPaneProps
const propsMatch = content.match(/interface AnalystPaneProps {([^}]+)}/m);
let propsBody = propsMatch ? propsMatch[1] : '';

const newProps = [
    'focusComposer: () => void;',
    'setGuideActiveTab: (tab: any) => void;',
    'setGuidePopupOpen: (open: boolean) => void;',
    'user: any;',
    'formatMessageTime: (date: any) => string;',
    'cleanContent: (content: string) => string;',
    'parsePlanOptions: (content: string) => any[];',
    'classifyPane: (content: string) => any;',
    'selectedPlanInChat: any;',
    'handleSelectPlan: (plan: any) => void;',
    'hasStageTransition: boolean;',
    'handleAssistContent: (type: string) => void;',
    'handleAdvanceStage: () => void;',
    'handleReanalyze: () => void;',
    'setContentInput: (input: string) => void;',
    'activeTactics: string[];',
    'setActiveTactics: (updater: any) => void;',
    'hasTargetKeywords: boolean;',
    'handleExtractTargets: () => void;',
    'handleCopyMessage: (id: string, content: string) => void;',
    'copiedId: string | null;',
    'reactMarkdownComponents: any;'
];

for (const prop of newProps) {
    if (!propsBody.includes(prop.split(':')[0])) {
        propsBody += `  ${prop}\n`;
    }
}

content = content.replace(/interface AnalystPaneProps {[^}]+}/m, `interface AnalystPaneProps {${propsBody}}`);

// Extend component destructuring
const destructureMatch = content.match(/export default function AnalystPane\(\{\n([^}]+)\n\}: AnalystPaneProps\)/m);
let destructureBody = destructureMatch ? destructureMatch[1] : '';

const newDestructure = newProps.map(p => p.split(':')[0].trim());
for (const v of newDestructure) {
    if (!destructureBody.includes(v)) {
        destructureBody += `,\n  ${v}`;
    }
}

content = content.replace(/export default function AnalystPane\(\{\n[^}]+\n\}: AnalystPaneProps\)/m, `export default function AnalystPane({\n${destructureBody}\n}: AnalystPaneProps)`);

fs.writeFileSync(file, content);
console.log('✅ Updated AnalystPane.tsx');
