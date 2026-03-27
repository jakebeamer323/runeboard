/* ============================================================
   OPEN5E API CLIENT — Fetches D&D data with sessionStorage cache
   Base URL: https://api.open5e.com/v1/
   ============================================================ */

const BASE = 'https://api.open5e.com/v1';
const CACHE_PREFIX = 'o5e_';

// ---- Cache helpers ----------------------------------------

function cacheGet(key) {
  try {
    const item = sessionStorage.getItem(CACHE_PREFIX + key);
    if (!item) return null;
    const { data, expires } = JSON.parse(item);
    if (Date.now() > expires) { sessionStorage.removeItem(CACHE_PREFIX + key); return null; }
    return data;
  } catch { return null; }
}

function cacheSet(key, data, ttlMs = 10 * 60 * 1000) {
  try {
    sessionStorage.setItem(CACHE_PREFIX + key, JSON.stringify({
      data,
      expires: Date.now() + ttlMs,
    }));
  } catch {}
}

// ---- Generic paginated fetch ------------------------------

async function fetchAllPages(path) {
  const cached = cacheGet(path);
  if (cached) return cached;

  const results = [];
  let url = `${BASE}${path}`;

  while (url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Open5e error: ${res.status} ${res.statusText}`);
    const data = await res.json();
    if (Array.isArray(data.results)) results.push(...data.results);
    url = data.next || null;
  }

  cacheSet(path, results);
  return results;
}

// ---- Races / Species --------------------------------------

/**
 * Fetch all races from Open5e.
 * Optionally filter by document slugs (comma-separated, passed as query param).
 * Returns items shaped for use in species tab.
 */
export async function fetchRaces(slugFilter = null) {
  let path = '/races/?limit=200';
  if (slugFilter && slugFilter.length > 0) {
    path += `&document__slug__in=${slugFilter.join(',')}`;
  }
  const raw = await fetchAllPages(path);
  return raw.map(normalizeRace);
}

function normalizeRace(r) {
  return {
    id: r.slug,
    name: r.name,
    desc: stripMarkdown(r.desc || ''),
    speed: r.speed,
    size: r.size,
    languages: r.languages || '',
    vision: r.vision || '',
    traits: (r.traits || []).map(t => ({
      name: t.name,
      desc: stripMarkdown(t.desc || ''),
    })),
    subraces: (r.subraces || []).map(s => ({
      id: s.slug,
      name: s.name,
      desc: stripMarkdown(s.desc || ''),
      traits: (s.traits || []).map(t => ({
        name: t.name,
        desc: stripMarkdown(t.desc || ''),
      })),
    })),
    sourceSlug: r.document__slug || 'unknown',
    sourceName: r.document__title || 'Unknown Source',
  };
}

// ---- Classes ----------------------------------------------

export async function fetchClasses(slugFilter = null) {
  let path = '/classes/?limit=200';
  if (slugFilter && slugFilter.length > 0) {
    path += `&document__slug__in=${slugFilter.join(',')}`;
  }
  const raw = await fetchAllPages(path);
  return raw.map(normalizeClass);
}

function normalizeClass(c) {
  return {
    id: c.slug,
    name: c.name,
    desc: stripMarkdown(c.desc || ''),
    hitDie: c.hit_dice || '',
    savingThrows: c.saving_throws || [],
    proficiencies: c.prof_armor || '',
    skillChoices: c.skills || '',
    sourceSlug: c.document__slug || 'unknown',
    sourceName: c.document__title || 'Unknown Source',
  };
}

// ---- Backgrounds ------------------------------------------

export async function fetchBackgrounds(slugFilter = null) {
  let path = '/backgrounds/?limit=200';
  if (slugFilter && slugFilter.length > 0) {
    path += `&document__slug__in=${slugFilter.join(',')}`;
  }
  const raw = await fetchAllPages(path);
  return raw.map(normalizeBg);
}

function normalizeBg(b) {
  return {
    id: b.slug,
    name: b.name,
    desc: stripMarkdown(b.desc || ''),
    feature: b.feature || '',
    featureDesc: stripMarkdown(b.feature_desc || ''),
    skillProfs: b.skill_proficiencies || '',
    toolProfs: b.tool_proficiencies || '',
    languages: b.languages || '',
    equipment: b.equipment || '',
    sourceSlug: b.document__slug || 'unknown',
    sourceName: b.document__title || 'Unknown Source',
  };
}

// ---- Spells -----------------------------------------------

export async function fetchSpells(slugFilter = null, filters = {}) {
  let path = '/spells/?limit=500';
  if (slugFilter && slugFilter.length > 0) {
    path += `&document__slug__in=${slugFilter.join(',')}`;
  }
  if (filters.level !== undefined) path += `&spell_level=${filters.level}`;
  if (filters.school) path += `&school=${filters.school}`;
  const raw = await fetchAllPages(path);
  return raw.map(normalizeSpell);
}

function normalizeSpell(s) {
  return {
    id: s.slug,
    name: s.name,
    level: s.spell_level,
    school: s.school,
    castingTime: s.casting_time,
    range: s.range,
    duration: s.duration,
    components: s.components,
    concentration: s.concentration === 'yes',
    ritual: s.ritual === 'yes',
    desc: stripMarkdown(s.desc || ''),
    classes: s.dnd_class || '',
    sourceSlug: s.document__slug || 'unknown',
    sourceName: s.document__title || 'Unknown Source',
  };
}

// ---- Utility ----------------------------------------------

// Rudimentary markdown stripper (removes ## headers, **bold**, _italic_, bullets)
function stripMarkdown(text) {
  return text
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/^\s*[-*+]\s+/gm, '• ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
