import { KEYWORD_TAXONOMY } from './keywordtaxonomy';

export function matchKeywords(text: string) {
  if (!text) return null;

  const normalized = text.toLowerCase();

  return (
    KEYWORD_TAXONOMY.find(rule =>
      rule.keywords.some(keyword =>
        normalized.includes(keyword)
      )
    ) || null
  );
}