import { describe, it, expect } from 'vitest';
import { containsProfanity, filterProfanity } from '../utils/profanity.js';

describe('profanity filter', () => {
  it('detects profanity in text', () => {
    expect(containsProfanity('this is damn bad')).toBe(true);
    expect(containsProfanity('what the hell')).toBe(true);
    expect(containsProfanity('you suck')).toBe(false);
  });

  it('does not flag clean text', () => {
    expect(containsProfanity('hello world')).toBe(false);
    expect(containsProfanity('nice event today')).toBe(false);
    expect(containsProfanity('I love hiking')).toBe(false);
  });

  it('filters profanity with replacement', () => {
    expect(filterProfanity('this is damn bad')).toBe('this is **** bad');
    expect(filterProfanity('what the hell')).toBe('what the ****');
  });

  it('preserves clean text', () => {
    expect(filterProfanity('hello world')).toBe('hello world');
    expect(filterProfanity('nice event')).toBe('nice event');
  });

  it('handles multiple profane words', () => {
    expect(filterProfanity('damn this hell')).toBe('**** this ****');
  });
});
