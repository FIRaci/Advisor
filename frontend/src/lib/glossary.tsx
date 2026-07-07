import React from 'react';

export const GLOSSARY_TERMS: Record<string, string> = {
  'ROAS': 'Return on Ad Spend. The amount of revenue earned for every dollar spent on a campaign.',
  'CAC': 'Customer Acquisition Cost. The total cost of acquiring a new customer. Must be lower than LTV to be profitable.',
  'LTV': 'Lifetime Value. The total revenue a business can expect from a single customer account.',
  'CPC': 'Cost Per Click. The amount you pay for each click on your ad.',
  'CPA': 'Cost Per Action. The average cost paid for a specific conversion or action.',
  'CPL': "Cost Per Lead. The amount you pay to acquire a potential customer's contact information.",
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

const GlossaryWord = ({ term, definition }: { term: string, definition: string }) => {
  const [show, setShow] = React.useState(false);
  const tooltipRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (show && tooltipRef.current) {
      const rect = tooltipRef.current.getBoundingClientRect();
      const parentRect = tooltipRef.current.parentElement?.getBoundingClientRect();
      
      // If tooltip overflows right side of screen/pane
      if (rect.right > window.innerWidth - 20) {
        tooltipRef.current.style.left = 'auto';
        tooltipRef.current.style.right = '0';
        tooltipRef.current.style.transform = 'translateY(-5px)';
      } 
      // If tooltip overflows left side
      else if (rect.left < 20) {
        tooltipRef.current.style.left = '0';
        tooltipRef.current.style.right = 'auto';
        tooltipRef.current.style.transform = 'translateY(-5px)';
      }
    }
  }, [show]);

  return (
    <span 
      className="glossary-tooltip-trigger" 
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {term}
      {show && (
        <div ref={tooltipRef} className="glossary-tooltip-box">
          {definition}
        </div>
      )}
    </span>
  );
};

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
          <GlossaryWord key={`${part}-${i}`} term={part} definition={definition} />
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
