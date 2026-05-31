import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import SplitText from './SplitText';

describe('SplitText Component', () => {
  it('renders the correct number of words', () => {
    const text = "Hello world this is a test";
    const { container } = render(<SplitText text={text} />);
    
    // SplitText renders the outer container motion.span and inner motion.span for each word
    // The total inner spans should equal the number of words.
    // The text should be present in the document.
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('world')).toBeInTheDocument();
    
    // Get all child spans of the main container
    const spans = container.querySelectorAll('span > span');
    expect(spans.length).toBe(6);
  });
});
