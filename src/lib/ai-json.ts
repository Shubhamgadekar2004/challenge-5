/**
 * Safely parse JSON-ish model output by extracting the first JSON object/array block.
 */
export function parseModelJson<T>(raw: string): T {
  const trimmed = raw.trim();

  try {
    return JSON.parse(trimmed) as T;
  } catch {
    // Continue to extraction fallback.
  }

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1] ?? trimmed;

  const objectStart = candidate.indexOf('{');
  const arrayStart = candidate.indexOf('[');
  const start = objectStart === -1 ? arrayStart : arrayStart === -1 ? objectStart : Math.min(objectStart, arrayStart);

  if (start === -1) {
    throw new Error('Model response did not contain JSON');
  }

  const objectEnd = candidate.lastIndexOf('}');
  const arrayEnd = candidate.lastIndexOf(']');
  const end = Math.max(objectEnd, arrayEnd);

  if (end === -1 || end <= start) {
    throw new Error('Model response contained invalid JSON bounds');
  }

  return JSON.parse(candidate.slice(start, end + 1)) as T;
}
