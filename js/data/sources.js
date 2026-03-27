/* ============================================================
   SOURCE CATALOG — Source IDs, metadata, and Open5e slug mapping
   ============================================================ */

// All source IDs valid for character creation
export const CHARACTER_CREATOR_SOURCES = [
  'PHB', 'XPHB',
  'XGE', 'TCE',
  'SCAG', 'GGR', 'ERLW', 'EGW', 'MOT', 'VRGR', 'SCC', 'AAG', 'FTD', 'BGG', 'BOME',
  'FRAF', 'FRHF', 'EBFA',
  'VGM', 'MTF', 'MPMM',
  'AI', 'SAiS',
  'PSZ', 'PSI', 'PSK', 'PSA', 'PSX', 'PSD',
  'OGA', 'DoD', 'MBOJV', 'TG', 'ABH',
  'NF', 'LFL',
];

// Default enabled sources (sensible defaults for new characters)
export const DEFAULT_ENABLED_SOURCES = ['PHB', 'XPHB', 'XGE', 'TCE', 'VGM', 'MTF', 'MPMM'];

// Source display metadata: id → { name, category }
export const SOURCE_META = {
  // Core
  PHB:  { name: "Player's Handbook (2014)",          category: 'Core' },
  MM:   { name: 'Monster Manual (2014)',              category: 'Core' },
  DMG:  { name: "Dungeon Master's Guide (2014)",      category: 'Core' },
  XPHB: { name: "Player's Handbook (2024)",           category: 'Core' },
  XDMG: { name: "Dungeon Master's Guide (2024)",      category: 'Core' },
  XMM:  { name: 'Monster Manual (2025)',              category: 'Core' },

  // Supplements
  VGM:  { name: "Volo's Guide to Monsters",          category: 'Supplements' },
  XGE:  { name: "Xanathar's Guide to Everything",    category: 'Supplements' },
  MTF:  { name: "Mordenkainen's Tome of Foes",       category: 'Supplements' },
  AI:   { name: 'Acquisitions Incorporated',          category: 'Supplements' },
  TCE:  { name: "Tasha's Cauldron of Everything",    category: 'Supplements' },
  FTD:  { name: "Fizban's Treasury of Dragons",      category: 'Supplements' },
  MPMM: { name: 'Mordenkainen Presents: Monsters of the Multiverse', category: 'Supplements' },
  BGG:  { name: 'Bigby Presents: Glory of the Giants', category: 'Supplements' },
  BOME: { name: 'The Book of Many Things',           category: 'Supplements' },

  // Settings
  SCAG: { name: "Sword Coast Adventurer's Guide",    category: 'Settings' },
  GGR:  { name: "Guildmasters' Guide to Ravnica",    category: 'Settings' },
  ERLW: { name: 'Eberron: Rising from the Last War', category: 'Settings' },
  EGW:  { name: "Explorer's Guide to Wildemount",    category: 'Settings' },
  MOT:  { name: 'Mythic Odysseys of Theros',         category: 'Settings' },
  VRGR: { name: "Van Richten's Guide to Ravenloft",  category: 'Settings' },
  SCC:  { name: 'Strixhaven: A Curriculum of Chaos', category: 'Settings' },
  AAG:  { name: "Astral Adventurer's Guide",         category: 'Settings' },
  SAiS: { name: 'Sigil and the Outlands',            category: 'Settings' },
  FRAF: { name: 'Forgotten Realms: Adventures in Faerûn', category: 'Settings' },
  FRHF: { name: 'Forgotten Realms: Heroes of Faerûn', category: 'Settings' },
  EBFA: { name: 'Eberron: Forge of the Artificer',  category: 'Settings' },

  // Additional Settings
  PSZ:  { name: 'Plane Shift: Zendikar',             category: 'Additional Settings' },
  PSI:  { name: 'Plane Shift: Innistrad',            category: 'Additional Settings' },
  PSK:  { name: 'Plane Shift: Kaladesh',             category: 'Additional Settings' },
  PSA:  { name: 'Plane Shift: Amonkhet',             category: 'Additional Settings' },
  PSX:  { name: 'Plane Shift: Ixalan',               category: 'Additional Settings' },
  PSD:  { name: 'Plane Shift: Dominaria',            category: 'Additional Settings' },
  NF:   { name: "Netheril's Fall",                   category: 'Additional Settings' },
  LFL:  { name: 'Lorwyn: First Light',               category: 'Additional Settings' },

  // Extras
  OGA:  { name: 'One Grung Above',                   category: 'Extras' },
  DoD:  { name: 'Domains of Delight',                category: 'Extras' },
  MBOJV:{ name: "Minsc and Boo's Journal of Villainy", category: 'Extras' },
  TG:   { name: "Thieves' Gallery",                  category: 'Extras' },
  ABH:  { name: "Astarion's Book of Hungers",        category: 'Extras' },
};

// Maps our source IDs to Open5e v2 document slugs.
// Open5e may not carry every book — entries here determine what shows up
// when that source is enabled. Update slugs if Open5e changes their IDs.
export const SOURCE_TO_OPEN5E = {
  PHB:  ['wotc-srd'],
  XGE:  ['xgte'],
  TCE:  ['tce'],
  VGM:  ['vgm'],
  MTF:  ['mtf'],
  MPMM: ['mpmm'],
  SCAG: ['scag'],
  GGR:  ['ggtr'],
  ERLW: ['erlw'],
  EGW:  ['egw'],
  MOT:  ['mot'],
  VRGR: ['vrgr'],
  FTD:  ['ftd'],
  BGG:  ['bgg'],
  SCC:  ['scc'],
  AAG:  ['aag'],
  AI:   ['ai'],
  SAiS: ['sais'],
};

// Reverse lookup: open5e document slug → our source ID
export function open5eSlugToSourceId(slug) {
  for (const [sourceId, slugs] of Object.entries(SOURCE_TO_OPEN5E)) {
    if (slugs.includes(slug)) return sourceId;
  }
  return slug.toUpperCase(); // fallback: use slug as source ID
}

// Given a list of enabled source IDs, return all matching Open5e slugs
export function getEnabledOpen5eSlugs(enabledSourceIds) {
  const slugs = new Set();
  for (const id of enabledSourceIds) {
    const mapped = SOURCE_TO_OPEN5E[id];
    if (mapped) mapped.forEach(s => slugs.add(s));
  }
  return [...slugs];
}

// Group CHARACTER_CREATOR_SOURCES by category for display
export function getSourcesByCategory() {
  const groups = {};
  for (const id of CHARACTER_CREATOR_SOURCES) {
    const meta = SOURCE_META[id];
    if (!meta) continue;
    if (!groups[meta.category]) groups[meta.category] = [];
    groups[meta.category].push({ id, name: meta.name });
  }
  return groups;
}
