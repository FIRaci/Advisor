import React from 'react';

export const GLOSSARY_TERMS: Record<string, string> = {
  'ROAS': 'Return on Ad Spend. The amount of revenue earned for every dollar spent on a campaign.',
  'CAC': 'Customer Acquisition Cost. The total cost of acquiring a new customer. Must be lower than LTV to be profitable.',
  'LTV': 'Lifetime Value. The total revenue a business can expect from a single customer account.',
  'CPC': 'Cost Per Click. The amount you pay for each click on your ad.',
  'CPA': 'Cost Per Action. The average cost paid for a specific conversion or action.',
  'CPL': 'Cost Per Lead. The amount you pay to acquire a potential customer\\'s contact information.',
  'CTR': 'Click-Through Rate. The percentage of people who click on your ad after seeing it. High CTR indicates engaging content.',
  'CPM': 'Cost Per Mille. The cost you pay per 1,000 views or impressions of an advertisement.',
  'AIDA': 'Marketing funnel model: Attention, Interest, Desire, Action.',
  'PAS': 'Copywriting framework: Problem, Agitation, Solution.',
  'USP': 'Unique Selling Proposition. The essence of what makes your product or service better than competitors.',
  'STP': 'Core strategic model: Segmentation, Targeting, Positioning.',
  'KPI': 'Key Performance Indicator. A quantifiable measure of performance over time for a specific objective.',
};

// Create a regex to match any of the terms (case-insensitive, whole word)
const termsRegex = new RegExp(`\\b(${Object.keys(GLOSSARY_TERMS).join('|')})\\b`, 'gi');

/**
 * Parses a string and replaces glossary terms with interactive tooltips.
 * Returns an array of strings and React nodes.
 */
export function parseGlossaryText(text: string): React.ReactNode[] {
  if (!text) return [text];
  
  const parts = text.split(termsRegex);
  const result: React.ReactNode[] = [];
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    
    // In JS split with capture group, odd indices are the matched terms
    if (i % 2 === 1) {
      // Find the matched term in our dictionary (ignoring case)
      const upperTerm = part.toUpperCase();
      const definition = GLOSSARY_TERMS[upperTerm];
      
      if (definition) {
        result.push(
          <span key={`${part}-${i}`} className="glossary-tooltip-trigger" data-tooltip={definition}>
            {part}
          </span>
        );
      } else {
        result.push(part);
      }
    } else if (part) {
      result.push(part);
    }
  }
  
  return result;
}
