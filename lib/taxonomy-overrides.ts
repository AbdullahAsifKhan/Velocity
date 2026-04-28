export interface TaxonomyOverride {
  generation?: string
  category?: 'Standard Lineup' | 'Performance & Track' | 'Special Editions' | 'Other Variants'
}

/**
 * A mapping of specific car names to force them into a particular generation or category.
 * If the programmatic sorting makes a mistake due to messy data, add an override here.
 * Format: { "Brand": { "Exact Car Name": { generation: "Generation Name", category: "Category Name" } } }
 */
export const TAXONOMY_OVERRIDES: Record<string, Record<string, TaxonomyOverride>> = {
  'Porsche': {
    'Porsche 911 GT3 RS (992)': { generation: 'Eighth Generation (992)', category: 'Performance & Track' },
    'Porsche 911 GT3 (992)': { generation: 'Eighth Generation (992)', category: 'Performance & Track' },
    'Porsche 911 Carrera S (992)': { generation: 'Eighth Generation (992)', category: 'Standard Lineup' },
    // Example overrides can be added here
  },
  'BMW': {
    'BMW M3 CS (G80)': { generation: 'Sixth Generation (G80)', category: 'Performance & Track' },
  }
}

/**
 * Fallback global model->generation overrides by year range, if no string match is found.
 */
export const GENERATION_YEAR_OVERRIDES: Record<string, Record<string, { start: number, end: number, name: string }[]>> = {
  'Porsche': {
    '911': [
      { start: 2019, end: 2030, name: 'Eighth Generation (992)' },
      { start: 2012, end: 2019, name: 'Seventh Generation (991)' },
      { start: 2005, end: 2012, name: 'Sixth Generation (997)' },
      { start: 1998, end: 2005, name: 'Fifth Generation (996)' },
      { start: 1994, end: 1998, name: 'Fourth Generation (993)' },
      { start: 1989, end: 1994, name: 'Third Generation (964)' },
      { start: 1974, end: 1989, name: 'Second Generation (G-Series)' },
      { start: 1964, end: 1973, name: 'First Generation (Classic)' },
    ]
  }
}