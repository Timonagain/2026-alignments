
import { Planet, ZodiacSign } from './types';

export const START_DATE = new Date('2025-12-21T00:00:00Z'); // Winter Solstice 2025
export const END_DATE = new Date('2026-12-21T00:00:00Z');   // Winter Solstice 2026
export const EVENT_DATE = new Date('2026-02-27T07:05:00Z');

export const SPREADSHEET_DB_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTg1uSR1IMnQFjtfQFOkIR3vzte3SBI-Yv7ZgY4hPedGLBi44juE-K3zEr3IXoGxw/pub?output=csv";

export interface CelestialEvent {
  id: string;
  name: string;
  date: Date;
  description: string;
  significance: string;
  type: string;
  object: string;
  mag?: string;
  ra?: string;
  dec?: string;
  notes?: string;
  link?: string;
  isMajor?: boolean;
}

export const FALLBACK_EVENTS: CelestialEvent[] = [
  {
    id: 'jupiter-opp-26',
    name: 'Opposition of Jupiter',
    object: 'Jupiter',
    date: new Date('2026-01-10T00:00:00Z'),
    type: 'Opposition',
    mag: '-2.7',
    ra: '07h 25m',
    dec: '+22 15',
    description: 'Jupiter at its brightest and closest for the year.',
    significance: 'Brightest of the year; currently in Gemini.',
    notes: 'Exceptional clarity for observing the Jovian moons from Glastonbury.',
    link: 'https://en.wikipedia.org/wiki/Opposition_(astronomy)'
  },
  {
    id: 'great-align',
    name: 'The Great Alignment',
    object: 'Multi-Planet',
    date: new Date('2026-02-27T07:05:00Z'),
    type: 'Alignment',
    description: 'A profound convergence of the Sun, Mercury, Venus, Saturn, and Neptune at 0° Aries.',
    significance: 'Cardinal reset of time. The birth of the highest spiritual love.',
    notes: 'Saturn and Neptune meet at the world point, signaling a generational shift.',
    isMajor: true,
    link: 'https://www.astrology.com/aspects/conjunction'
  },
  {
    id: 'venus-saturn-conj-26',
    name: 'Conjunction of Venus & Saturn',
    object: 'Venus/Saturn',
    date: new Date('2026-03-08T00:00:00Z'),
    type: 'Conjunction',
    mag: '-3.9',
    ra: '00h 15m',
    dec: '-02 10',
    description: 'A very close pairing of Venus and Saturn.',
    significance: 'Close pairing 0.3 deg.',
    notes: 'Harmonious beauty meets structural time in the early degrees of Aries.',
    link: 'https://en.wikipedia.org/wiki/Conjunction_(astronomy)'
  },
  {
    id: 'venus-jupiter-conj-26',
    name: 'Conjunction of Venus & Jupiter',
    object: 'Venus/Jupiter',
    date: new Date('2026-06-09T00:00:00Z'),
    type: 'Conjunction',
    mag: '-4.0',
    ra: '07h 52m',
    dec: '+22 28',
    description: 'The two brightest planets meet in a spectacular display.',
    significance: 'Brightest conjunction of 2026.',
    notes: 'The "Greater and Lesser Benefics" combine their influence.',
    link: 'https://en.wikipedia.org/wiki/Conjunction_(astronomy)'
  },
  {
    id: 'solar-eclipse-26',
    name: 'Solar Eclipse',
    object: 'Sun/Moon',
    date: new Date('2026-08-12T19:13:00Z'),
    type: 'Eclipse',
    mag: '0.93',
    ra: '09h 31m',
    dec: '+14 48',
    description: 'Deep partial solar eclipse visible across much of Europe.',
    significance: '93% coverage at 19:13 BST.',
    notes: 'A powerful moment of solar obscuration, visible from the Tor.',
    isMajor: true,
    link: 'https://en.wikipedia.org/wiki/Solar_eclipse_of_August_12,_2026'
  },
  {
    id: 'perseids-26',
    name: 'Perseid Meteor Shower',
    object: 'Perseids',
    date: new Date('2026-08-13T00:00:00Z'),
    type: 'Meteor',
    mag: '2.0',
    ra: '03h 04m',
    dec: '+58 00',
    description: 'Annual peak of the Perseid meteor stream.',
    significance: 'Perfect dark skies; 100/hr.',
    notes: 'A visual symphony of cosmic debris burning up in the atmosphere.',
    link: 'https://en.wikipedia.org/wiki/Perseids'
  },
  {
    id: 'saturn-opp-26',
    name: 'Opposition of Saturn',
    object: 'Saturn',
    date: new Date('2026-10-04T00:00:00Z'),
    type: 'Opposition',
    mag: '0.5',
    ra: '00h 52m',
    dec: '-02 10',
    description: 'Saturn directly opposite the Sun.',
    significance: 'Edge-on rings; visible all night.',
    notes: 'The rings are nearly invisible, emphasizing the starkness of Chronos.',
    link: 'https://en.wikipedia.org/wiki/Opposition_(astronomy)'
  },
  {
    id: 'geminids-26',
    name: 'Geminid Meteor Shower',
    object: 'Geminids',
    date: new Date('2026-12-14T00:00:00Z'),
    type: 'Meteor',
    mag: '1.8',
    ra: '07h 28m',
    dec: '+32 00',
    description: 'The strongest meteor shower of 2026.',
    significance: 'Strongest shower of 2026.',
    notes: 'Radiating from Gemini, a grand finale for the archival year.',
    link: 'https://en.wikipedia.org/wiki/Geminids'
  }
];

export const PLANETS: (Planet & { isPrimary?: boolean })[] = [
  {
    name: 'Sun', symbol: '☉', sign: 'Pisces', degree: 8, dailySpeed: 1.0, house: 12, qualities: ['Vitality', 'Sovereignty'],
    description: 'The Solar King.',
    longDescription: 'Primary source of vitality and consciousness. In late February 2026, it approaches the vernal origin.',
    color: '#fbbf24', isPrimary: true
  },
  {
    name: 'Moon', symbol: '☾', sign: 'Cancer', degree: 14, dailySpeed: 13.18, house: 4, qualities: ['Tide', 'Memory'],
    description: 'Exalted Governor.',
    longDescription: 'Subconscious rhythms and emotional tides. Its rapid movement shifts the local mood daily.',
    color: '#f1f5f9', isPrimary: true
  },
  {
    name: 'Mercury', symbol: '☿', sign: 'Aquarius', degree: 28, dailySpeed: 1.2, house: 11, qualities: ['Intellect', 'Bridge'],
    description: 'The Messenger.',
    longDescription: 'Governor of communication and logical processing, currently transiting the final degrees of Aquarius.',
    color: '#94a3b8', isPrimary: false
  },
  {
    name: 'Venus', symbol: '♀', sign: 'Aquarius', degree: 21, dailySpeed: 1.15, house: 11, qualities: ['Value', 'Harmony'],
    description: 'The Harmonizer.',
    longDescription: 'Archetype of attraction and aesthetic value, seeking social cohesion in the air sign Aquarius.',
    color: '#f472b6', isPrimary: false
  },
  {
    name: 'Mars', symbol: '♂', sign: 'Capricorn', degree: 29, dailySpeed: 0.52, house: 10, qualities: ['Will', 'Drive'],
    description: 'The Warrior.',
    longDescription: 'Exalted in Capricorn, Mars provides disciplined ambition and precise execution of goals.',
    color: '#ef4444', isPrimary: false
  },
  {
    name: 'Jupiter', symbol: '♃', sign: 'Cancer', degree: 17, dailySpeed: 0.08, house: 4, qualities: ['Expansion', 'Abundance'],
    description: 'The Great Benefactor.',
    longDescription: 'Retrograde and exalted in Cancer, Jupiter expands our capacity for emotional wisdom and ancestral connection.',
    color: '#fb923c', isPrimary: false
  },
  {
    name: 'Saturn', symbol: '♄', sign: 'Aries', degree: 0, dailySpeed: 0.033, house: 1, qualities: ['Structure', 'Time'],
    description: 'Master Architect.',
    longDescription: 'Entering Aries to begin a new 29-year cycle, Saturn structures the raw impulse of existence.',
    color: '#64748b', isPrimary: true
  },
  {
    name: 'Neptune', symbol: '♆', sign: 'Aries', degree: 0, dailySpeed: 0.006, house: 1, qualities: ['Vision', 'Transcendence'],
    description: 'The Seer.',
    longDescription: 'Neptune at 0° Aries dissolves old boundaries to invite a new spiritual vision for humanity.',
    color: '#38bdf8', isPrimary: true
  },
  {
    name: 'Uranus', symbol: '♅', sign: 'Taurus', degree: 27, dailySpeed: 0.01, house: 2, qualities: ['Innovation', 'Shock'],
    description: 'The Awakener.',
    longDescription: 'Uranus continues its radical disruption of Taurus, changing our relationship with earth and value.',
    color: '#2dd4bf', isPrimary: false
  },
  {
    name: 'Pluto', symbol: '♇', sign: 'Aquarius', degree: 4, dailySpeed: 0.004, house: 11, qualities: ['Power', 'Metamorphosis'],
    description: 'The Transformer.',
    longDescription: 'Pluto in Aquarius signals a generational shift toward collective power and technological evolution.',
    color: '#a855f7', isPrimary: false
  }
];

export const ZODIAC_SIGNS: ZodiacSign[] = [
  { name: 'Aries', symbol: '♈︎', element: 'Fire', qualities: 'Cardinal', houseNumber: 1, rulingPlanet: 'Mars', houseMeaning: 'Action', deepWisdom: 'Origin Point.' },
  { name: 'Taurus', symbol: '♉︎', element: 'Earth', qualities: 'Fixed', houseNumber: 2, rulingPlanet: 'Venus', houseMeaning: 'Value', deepWisdom: 'Sustaining.' },
  { name: 'Gemini', symbol: '♊︎', element: 'Air', qualities: 'Mutable', houseNumber: 3, rulingPlanet: 'Mercury', houseMeaning: 'Communication', deepWisdom: 'Information.' },
  { name: 'Cancer', symbol: '♋︎', element: 'Water', qualities: 'Cardinal', houseNumber: 4, rulingPlanet: 'Moon', houseMeaning: 'Nurturance', deepWisdom: 'Source.' },
  { name: 'Leo', symbol: '♌︎', element: 'Fire', qualities: 'Fixed', houseNumber: 5, rulingPlanet: 'Sun', houseMeaning: 'Sovereignty', deepWisdom: 'Authority.' },
  { name: 'Virgo', symbol: '♍︎', element: 'Earth', qualities: 'Mutable', houseNumber: 6, rulingPlanet: 'Mercury', houseMeaning: 'Service', deepWisdom: 'Refinement.' },
  { name: 'Libra', symbol: '♎︎', element: 'Air', qualities: 'Cardinal', houseNumber: 7, rulingPlanet: 'Venus', houseMeaning: 'Balance', deepWisdom: 'Mirror.' },
  { name: 'Scorpio', symbol: '♏︎', element: 'Water', qualities: 'Fixed', houseNumber: 8, rulingPlanet: 'Pluto', houseMeaning: 'Flux', deepWisdom: 'Death/Rebirth.' },
  { name: 'Sagittarius', symbol: '♐︎', element: 'Fire', qualities: 'Mutable', houseNumber: 9, rulingPlanet: 'Jupiter', houseMeaning: 'Quest', deepWisdom: 'Meaning.' },
  { name: 'Capricorn', symbol: '♑︎', element: 'Earth', qualities: 'Cardinal', houseNumber: 10, rulingPlanet: 'Saturn', houseMeaning: 'Structure', deepWisdom: 'Time.' },
  { name: 'Aquarius', symbol: '♒︎', element: 'Air', qualities: 'Fixed', houseNumber: 11, rulingPlanet: 'Uranus', houseMeaning: 'Vision', deepWisdom: 'Unification.' },
  { name: 'Pisces', symbol: '♓︎', element: 'Water', qualities: 'Mutable', houseNumber: 12, rulingPlanet: 'Neptune', houseMeaning: 'Return', deepWisdom: 'Dissolution.' }
];
