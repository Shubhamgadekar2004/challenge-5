import { describe, expect, it } from 'vitest';
import { parseModelJson } from '@/lib/ai-json';

describe('parseModelJson', () => {
  it('parses a plain JSON object', () => {
    expect(parseModelJson('{"title":"Launch"}')).toEqual({ title: 'Launch' });
  });

  it('extracts JSON from fenced markdown responses', () => {
    const raw = '```json\n{ "ideas": ["A", "B"] }\n```';

    expect(parseModelJson(raw)).toEqual({ ideas: ['A', 'B'] });
  });

  it('throws when no JSON body is present', () => {
    expect(() => parseModelJson('No data here')).toThrow('JSON');
  });
});
