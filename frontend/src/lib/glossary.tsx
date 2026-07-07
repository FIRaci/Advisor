import React from 'react';

export const GLOSSARY_TERMS: Record<string, string> = {
  'ROAS': 'Tỷ suất lợi nhuận trên chi phí quảng cáo (Return on Ad Spend). Ví dụ ROAS 3 nghĩa là bỏ 1 đồng thu 3 đồng.',
  'CAC': 'Chi phí thu hút 1 khách hàng mới (Customer Acquisition Cost). Phải nhỏ hơn LTV thì mới có lãi.',
  'LTV': 'Giá trị vòng đời khách hàng (Lifetime Value). Tổng lợi nhuận một khách hàng mang lại.',
  'CPC': 'Chi phí cho mỗi lượt nhấp chuột (Cost Per Click).',
  'CPA': 'Chi phí cho mỗi hành động/chuyển đổi (Cost Per Action).',
  'CPL': 'Chi phí để có một thông tin khách hàng tiềm năng (Cost Per Lead).',
  'CTR': 'Tỷ lệ nhấp chuột (Click-Through Rate). Tỷ lệ càng cao chứng tỏ nội dung càng hấp dẫn.',
  'CPM': 'Chi phí cho 1000 lượt hiển thị (Cost Per Mille).',
  'AIDA': 'Mô hình phễu marketing: Attention (Chú ý) - Interest (Thích thú) - Desire (Khao khát) - Action (Hành động).',
  'PAS': 'Mô hình viết content: Problem (Nêu vấn đề) - Agitation (Xoáy sâu nỗi đau) - Solution (Đưa giải pháp).',
  'USP': 'Lợi điểm bán hàng độc nhất (Unique Selling Proposition) - Yếu tố làm bạn khác biệt với đối thủ.',
  'STP': 'Mô hình chiến lược cốt lõi: Segmentation (Phân khúc) - Targeting (Mục tiêu) - Positioning (Định vị).',
  'KPI': 'Chỉ số đánh giá hiệu suất trọng yếu (Key Performance Indicator).',
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
