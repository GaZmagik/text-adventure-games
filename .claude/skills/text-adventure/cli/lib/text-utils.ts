// Shared text segmentation helpers support prose metrics and lightweight narrative analysis.
export function splitSentences(text: string): string[] {
  if (!text.trim()) return [];
  return text.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
}

export function splitParagraphs(text: string): string[] {
  return text.split(/\n\n+/).filter(p => p.trim().length > 0);
}
