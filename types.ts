
export interface Planet {
  name: string;
  symbol: string;
  sign: string;
  degree: number; // Degree at the event date
  dailySpeed: number; // Approximate degrees per day
  house: number;
  qualities: string[];
  description: string;
  longDescription?: string;
  color: string;
}

export interface Aspect {
  planet1: string;
  planet2: string;
  type: 'conjunction' | 'trine' | 'square' | 'opposition';
  color: string;
  // Renamed from description to meaning to align with usage in App.tsx
  meaning: string;
}

export interface ZodiacSign {
  name: string;
  symbol: string;
  element: 'Fire' | 'Earth' | 'Air' | 'Water';
  qualities: string;
  houseNumber: number;
  rulingPlanet: string;
  houseMeaning: string;
  deepWisdom: string;
}