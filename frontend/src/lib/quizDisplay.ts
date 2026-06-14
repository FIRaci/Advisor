/**
 * Human-readable quiz values for Insights cards and the activity log.
 * Keeps multi-select deduping / audience pruning aligned everywhere.
 */

export const INSIGHT_QUIZ_HINTS: Partial<Record<string, string>> = {
  productName: 'Offer name',
  business: 'Industry / model',
  stage: 'Company maturity',
  audience: 'Who you sell to',
  region: 'Geography',
  platform: 'Touchpoints',
  priceRange: 'Pricing tier',
  goal: 'Primary objective',
  usp: 'Unique Selling Proposition',
  channels: 'Marketing mix',
  currentMarketing: 'Where you are today',
  experience: 'Team skill level',
  competitors: 'Market context',
  timeline: 'Results horizon',
  budget: 'Spend level',
  seasonality: 'Demand peaks',
  contentFormat: 'Creative formats',
  offerType: 'Deal style',
  deadline: 'Stage 2 target date',
  target_ctr: 'Click-through target',
  target_cvr: 'Conversion target',
  target_roas: 'Efficiency target'
};

const businessLabels: Record<string, string> = {
  ecommerce: 'E-commerce',
  saas: 'SaaS / Software',
  service: 'Professional Services',
  local: 'Local Business',
  agency: 'Marketing Agency',
  education: 'Education',
  healthcare: 'Healthcare',
  fintech: 'Fintech',
  food: 'Food & Beverage',
  travel: 'Travel',
  realestate: 'Real Estate',
  entertainment: 'Entertainment'
};

const audienceLabels: Record<string, string> = {
  b2b: 'B2B',
  b2c: 'B2C',
  both: 'B2B & B2C',
  genz: 'Gen Z (18-25)',
  millennials: 'Millennials (26-40)',
  genx: 'Gen X+ (40+)',
  enterprise: 'Enterprise',
  startups: 'Startups & SMBs',
  women: 'Women',
  men: 'Men',
  parents: 'Parents',
  students: 'Students'
};

const goalLabels: Record<string, string> = {
  awareness: 'Brand Awareness',
  leads: 'Lead Generation',
  sales: 'Increase Sales',
  retention: 'Customer Retention',
  traffic: 'Website Traffic',
  engagement: 'Social Engagement',
  launch: 'Product Launch',
  reputation: 'Reputation',
  appinstalls: 'App Installs',
  community: 'Community'
};

const channelLabels: Record<string, string> = {
  social: 'Social Media',
  search: 'Google Ads & SEO',
  email: 'Email Marketing',
  content: 'Content / Blog',
  video: 'YouTube / TikTok',
  influencer: 'Influencer',
  affiliate: 'Affiliate',
  podcast: 'Podcast',
  offline: 'Offline / Events',
  all: 'Multi-channel'
};

const budgetLabels: Record<string, string> = {
  minimal: '< $500',
  small: '$500 - $1,000',
  medium: '$1,000 - $5,000',
  large: '$5,000 - $20,000',
  enterprise: '$20,000 - $100,000',
  unlimited: '$100,000+'
};

const regionLabels: Record<string, string> = {
  local: 'Local',
  national: 'National',
  regional: 'Southeast Asia',
  asia: 'Asia Pacific',
  us: 'United States',
  europe: 'Europe',
  global: 'Global'
};

const seasonalityLabels: Record<string, string> = {
  none: 'No seasonality',
  holiday: 'Holiday-driven',
  summer: 'Summer peak',
  yearend: 'Year-end peak',
  event: 'Event-driven',
  always: 'Always-on demand'
};

const contentFormatLabels: Record<string, string> = {
  short_video: 'Short videos',
  long_video: 'Long-form video',
  static_visual: 'Static visuals',
  article: 'Articles/blog',
  email: 'Email/newsletter',
  mixed: 'Mixed format'
};

const offerTypeLabels: Record<string, string> = {
  discount: 'Discount / flash sale',
  bundle: 'Bundle package',
  trial: 'Free trial / freemium',
  gift: 'Gift with purchase',
  consultation: 'Free consultation/demo',
  custom_offer: 'Custom segment offers'
};

const stageLabels: Record<string, string> = {
  idea: 'Idea / Pre-launch',
  startup: 'Startup (< 1 year)',
  growing: 'Growing (1-3 years)',
  established: 'Established (3-5 years)',
  mature: 'Mature (5+ years)',
  scaling: 'Scaling / Expanding'
};

const currentMarketingLabels: Record<string, string> = {
  none: 'No marketing yet',
  basic: 'Basic social media',
  active: 'Active on multiple channels',
  paid: 'Running paid ads',
  team: 'Have marketing team',
  agency: 'Working with agency'
};

const experienceLabels: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  expert: 'Expert'
};

const timelineLabels: Record<string, string> = {
  immediate: '1-2 weeks',
  short: '1-3 months',
  medium: '3-6 months',
  long: '6-12 months',
  longterm: '1+ year'
};

const platformLabels: Record<string, string> = {
  website: 'Website',
  app: 'Mobile App',
  social: 'Social Media',
  marketplace: 'Marketplace (Shopee, Lazada)',
  store: 'Physical Store',
  multiple: 'Multiple platforms'
};

const priceRangeLabels: Record<string, string> = {
  free: 'Free / Freemium',
  low: 'Low-cost (< $50)',
  mid: 'Mid-range ($50-$500)',
  premium: 'Premium ($500-$5,000)',
  luxury: 'Luxury ($5,000+)',
  varies: 'Varies by product'
};

const FIELD_LABELS: Record<string, Record<string, string>> = {
  business: businessLabels,
  audience: audienceLabels,
  goal: goalLabels,
  channels: channelLabels,
  budget: budgetLabels,
  region: regionLabels,
  seasonality: seasonalityLabels,
  contentFormat: contentFormatLabels,
  offerType: offerTypeLabels,
  stage: stageLabels,
  currentMarketing: currentMarketingLabels,
  experience: experienceLabels,
  timeline: timelineLabels,
  platform: platformLabels,
  priceRange: priceRangeLabels
};

const FREE_TEXT_KEYS = new Set(['productName', 'usp', 'competitors', 'deadline']);

type MultiMode = 'default' | 'audience';

function mapMultiValue(raw: string, labels: Record<string, string>, mode: MultiMode): string {
  const v = raw.trim();
  if (!v) return '';
  if (v.startsWith('custom: ')) return v.replace(/^custom:\s*/i, '');
  if (v.includes('||')) {
    let tokens = [...new Set(v.split('||').map((t) => t.trim()).filter(Boolean))];
    if (mode === 'audience' && tokens.includes('both')) {
      tokens = tokens.filter((t) => t !== 'b2b' && t !== 'b2c');
    }
    const parts = [...new Set(tokens.map((item) => labels[item] ?? item).filter(Boolean))];
    return parts.join(', ');
  }
  return labels[v] ?? v;
}

export function formatQuizAnswerForDisplay(key: string, value: string | undefined | null): string {
  const v = typeof value === 'string' ? value.trim() : '';
  if (!v || v === 'not_sure') return '';

  if (FREE_TEXT_KEYS.has(key)) {
    return v.startsWith('custom: ') ? v.replace(/^custom:\s*/i, '') : v;
  }

  if (key === 'target_ctr' || key === 'target_cvr') {
    const n = v.replace(/%/g, '').trim();
    return `${n}%`;
  }
  if (key === 'target_roas') {
    return v;
  }

  const labels = FIELD_LABELS[key];
  if (!labels) {
    return v.startsWith('custom: ') ? v.replace(/^custom:\s*/i, '') : v;
  }
  const mode: MultiMode = key === 'audience' ? 'audience' : 'default';
  return mapMultiValue(v, labels, mode);
}

export type QuizActivityField = {
  key: string;
  label: string;
  read: (qd: Record<string, string>) => string | undefined;
};

/** Canonical ordered list + labels for quiz rows in Campaign Insights activity log */
export const QUIZ_ACTIVITY_FIELDS: QuizActivityField[] = [
  { key: 'productName', label: 'Product / service', read: (qd) => qd.productName },
  { key: 'business', label: 'Business type', read: (qd) => qd.business },
  { key: 'stage', label: 'Business stage', read: (qd) => qd.stage },
  { key: 'audience', label: 'Target audience', read: (qd) => qd.audience },
  { key: 'region', label: 'Region', read: (qd) => qd.region },
  { key: 'platform', label: 'Platform', read: (qd) => qd.platform },
  { key: 'priceRange', label: 'Price range', read: (qd) => qd.priceRange },
  { key: 'goal', label: 'Primary goal', read: (qd) => qd.goal },
  { key: 'usp', label: 'USP', read: (qd) => qd.usp },
  {
    key: 'channels',
    label: 'Channels',
    read: (qd) => qd.channels ?? qd.channel
  },
  { key: 'currentMarketing', label: 'Current marketing', read: (qd) => qd.currentMarketing },
  { key: 'experience', label: 'Marketing experience', read: (qd) => qd.experience },
  { key: 'competitors', label: 'Competitors', read: (qd) => qd.competitors },
  { key: 'timeline', label: 'Timeline', read: (qd) => qd.timeline },
  { key: 'budget', label: 'Budget range', read: (qd) => qd.budget },
  { key: 'seasonality', label: 'Seasonality', read: (qd) => qd.seasonality },
  { key: 'contentFormat', label: 'Content format', read: (qd) => qd.contentFormat },
  { key: 'offerType', label: 'Offer type', read: (qd) => qd.offerType },
  { key: 'deadline', label: 'Deadline', read: (qd) => qd.deadline },
  { key: 'target_ctr', label: 'Target CTR', read: (qd) => qd.target_ctr },
  { key: 'target_cvr', label: 'Target conversion rate', read: (qd) => qd.target_cvr },
  { key: 'target_roas', label: 'Target ROAS', read: (qd) => qd.target_roas }
];

const QUIZ_ACTIVITY_LOG_KEY_SET = new Set(
  QUIZ_ACTIVITY_FIELDS.map((f) => f.key).concat(['channel'])
);

/** Keys emitted by the ordered quiz sweep (avoid duplicating in Phase-2/other bucket) */
export const quizActivityLogHandledKeys = QUIZ_ACTIVITY_LOG_KEY_SET;

/** Stage 2 / execution targets shown under "Targets:" in the activity log */
const TARGET_ACTIVITY_KEYS = new Set(['deadline', 'target_ctr', 'target_cvr', 'target_roas']);

export function quizActivityEventKind(key: string): 'quiz' | 'phase2' {
  return TARGET_ACTIVITY_KEYS.has(key) ? 'phase2' : 'quiz';
}

/** Activity log line title (Profile = discovery, Targets = deadline & KPIs) */
export function quizActivityLogTitle(key: string, fieldLabel: string): string {
  if (TARGET_ACTIVITY_KEYS.has(key)) {
    return `Targets: ${fieldLabel}`;
  }
  return `Profile: ${fieldLabel}`;
}

export function quizFieldActivityTitle(key: string): string {
  const fromQuiz = QUIZ_ACTIVITY_FIELDS.find((f) => f.key === key);
  if (fromQuiz) return fromQuiz.label;
  return key.replace(/_/g, ' ').replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1));
}
