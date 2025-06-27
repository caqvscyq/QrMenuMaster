import { MenuItem } from "@shared/schema";

export interface SearchResult extends MenuItem {
  similarity: number;
}

// Simple fuzzy search implementation
export function fuzzySearch(query: string, items: MenuItem[], threshold = 0.3): SearchResult[] {
  const searchTerm = query.toLowerCase().trim();
  
  if (!searchTerm) return [];

  const results: SearchResult[] = items.map(item => {
    const similarity = calculateSimilarity(searchTerm, item);
    return { ...item, similarity };
  });

  return results
    .filter(result => result.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity);
}

function calculateSimilarity(query: string, item: MenuItem): number {
  const nameScore = stringSimilarity(query, item.name.toLowerCase());
  const descriptionScore = stringSimilarity(query, item.description.toLowerCase()) * 0.7;
  const categoryScore = stringSimilarity(query, getCategoryDisplayName(item.category).toLowerCase()) * 0.5;
  
  // Check for exact substring matches (higher weight)
  const exactNameMatch = item.name.toLowerCase().includes(query) ? 0.9 : 0;
  const exactDescMatch = item.description.toLowerCase().includes(query) ? 0.7 : 0;
  
  return Math.max(nameScore, descriptionScore, categoryScore, exactNameMatch, exactDescMatch);
}

function stringSimilarity(str1: string, str2: string): number {
  // Levenshtein distance-based similarity
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }
  
  return matrix[str2.length][str1.length];
}

function getCategoryDisplayName(category: string): string {
  const categoryMap: Record<string, string> = {
    noodles: "麵食類",
    rice: "飯類",
    appetizers: "開胃菜",
    drinks: "飲料",
  };
  
  return categoryMap[category] || category;
}

// Alternative simple search for exact matches and partial matches
export function simpleSearch(query: string, items: MenuItem[]): MenuItem[] {
  const searchTerm = query.toLowerCase().trim();
  
  if (!searchTerm) return [];

  return items.filter(item => 
    item.name.toLowerCase().includes(searchTerm) ||
    item.description.toLowerCase().includes(searchTerm) ||
    getCategoryDisplayName(item.category).toLowerCase().includes(searchTerm)
  );
}
