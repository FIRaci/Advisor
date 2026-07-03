import { ChatMessage } from '../hooks/useApi';

export const formatMessageTime = (time: string) => {
  const d = new Date(time);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' +
         d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};



export const classifyPane = (msg: ChatMessage): 'STRATEGY' | 'CONTENT' | 'SYSTEM' => {
  const isSystemTransition = msg.role === 'ASSISTANT' && msg.content.includes('[STAGE_TRANSITION]');
  if (isSystemTransition) return 'SYSTEM';
  
  if (msg.role === 'SYSTEM' && msg.content.startsWith('__CONTENT_PANE__')) {
    return 'CONTENT';
  }
  return 'STRATEGY';
};

export const getKpiStatus = (actual: number, target: number, isCost: boolean) => {
  if (!target || target <= 0) return { label: 'No target', tone: 'neutral' as const, pct: 0 };
  let pct: number;
  let label: string;
  let tone: 'good' | 'warn' | 'bad' | 'neutral';

  if (isCost) {
    pct = Math.max(0, Math.min(140, (target / (actual || 0.001)) * 100));
    if (actual <= target) { label = 'On track'; tone = 'good' as const; }
    else if (actual <= target * 1.2) { label = 'Close'; tone = 'warn' as const; }
    else { label = 'Behind'; tone = 'bad' as const; }
  } else {
    pct = Math.max(0, Math.min(140, (actual / target) * 100));
    if (actual >= target) { label = 'On track'; tone = 'good' as const; }
    else if (actual >= target * 0.8) { label = 'Close'; tone = 'warn' as const; }
    else { label = 'Behind'; tone = 'bad' as const; }
  }
  return { label, tone, pct };
};

export const formatMetricValue = (value?: unknown) => {
  if (typeof value === 'number') {
    if (value >= 1000000) return '$' + (value / 1000000).toFixed(2) + 'M';
    if (value >= 1000) return '$' + (value / 1000).toFixed(1) + 'k';
    return '$' + value.toFixed(2);
  }
  return value ? String(value) : '0';
};

export const computeMetricDelta = (current?: unknown, previous?: unknown) => {
  if (typeof current !== 'number' || typeof previous !== 'number' || previous === 0) return null;
  const diff = current - previous;
  const percent = (diff / previous) * 100;
  return { diff, percent };
};

export const hasTargetKeywords = (text: string) => {
  const lower = text.toLowerCase();
  return lower.includes('mục tiêu') || 
         lower.includes('kpi') || 
         lower.includes('target') ||
         lower.includes('cpa') ||
         lower.includes('roas') ||
         lower.includes('ngân sách');
};

export const metricLabelWithHint = (f: any) => `${f.label} (${f.hint})`;

export const generateSmoothPath = (points: {x: number, y: number}[]) => {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) * 0.15;
    const cp1y = p1.y + (p2.y - p0.y) * 0.15;
    
    const cp2x = p2.x - (p3.x - p1.x) * 0.15;
    const cp2y = p2.y - (p3.y - p1.y) * 0.15;

    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return path;
};
