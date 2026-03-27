/* ============================================================
   TAB: BACKGROUND — Background selection
   ============================================================ */

import { get, set } from '../state.js';

// PHB backgrounds — reliable baseline
const PHB_BACKGROUNDS = [
  { id: 'acolyte',       name: 'Acolyte',        skillProfs: 'Insight, Religion',       desc: 'You have spent your life in the service of a temple to a specific god or pantheon.' },
  { id: 'charlatan',     name: 'Charlatan',       skillProfs: 'Deception, Sleight of Hand', desc: 'You have always had a talent for making people believe what you want them to believe.' },
  { id: 'criminal',      name: 'Criminal',        skillProfs: 'Deception, Stealth',      desc: 'You are an experienced criminal with a history of breaking the law.' },
  { id: 'entertainer',   name: 'Entertainer',     skillProfs: 'Acrobatics, Performance', desc: 'You thrive in front of an audience. You know how to entrance them, entertain them, and inspire them.' },
  { id: 'folk-hero',     name: 'Folk Hero',       skillProfs: 'Animal Handling, Survival', desc: 'You come from a humble social rank, but you are destined for so much more.' },
  { id: 'guild-artisan', name: 'Guild Artisan',   skillProfs: 'Insight, Persuasion',     desc: "You are a member of an artisan's guild, skilled in a particular field and closely associated with other artisans." },
  { id: 'hermit',        name: 'Hermit',          skillProfs: 'Medicine, Religion',      desc: 'You lived in seclusion — either in a sheltered community or entirely alone.' },
  { id: 'noble',         name: 'Noble',           skillProfs: 'History, Persuasion',     desc: 'You understand wealth, power, and privilege. You carry a noble title and your family owns land.' },
  { id: 'outlander',     name: 'Outlander',       skillProfs: 'Athletics, Survival',     desc: 'You grew up in the wilds, far from civilization and the comforts of town and technology.' },
  { id: 'sage',          name: 'Sage',            skillProfs: 'Arcana, History',         desc: 'You spent years learning the lore of the multiverse.' },
  { id: 'sailor',        name: 'Sailor',          skillProfs: 'Athletics, Perception',   desc: 'You sailed on a seagoing vessel for years. In that time, you faced down mighty storms, monsters of the deep, and those who wanted to sink your craft to the bottomless depths.' },
  { id: 'soldier',       name: 'Soldier',         skillProfs: 'Athletics, Intimidation', desc: 'War has been your life for as long as you care to remember.' },
  { id: 'urchin',        name: 'Urchin',          skillProfs: 'Sleight of Hand, Stealth', desc: 'You grew up on the streets alone, orphaned, and poor.' },
];

export function init(container) {
  const bg = get('background');

  container.innerHTML = `
    <div class="creator-section-header">
      <div class="creator-section-header-text">
        <h2 class="creator-section-title">Background</h2>
        <p class="creator-section-sub">Your character's background reveals their origins, history, and place in the world. It grants skill proficiencies, equipment, and a special feature.</p>
      </div>
    </div>

    <div class="creator-grid" id="bg-grid">
      ${PHB_BACKGROUNDS.map(b => `
        <button class="creator-option-card ${bg.id === b.id ? 'selected' : ''}" data-bg-id="${b.id}">
          <div class="creator-option-card-check">✓</div>
          <div class="creator-option-card-name">${b.name}</div>
          <div class="creator-option-card-source">PHB</div>
          <div class="creator-option-card-desc">${b.desc}</div>
          <div style="margin-top:auto;padding-top:var(--space-2);font-size:11px;color:var(--text-muted);">Skills: ${b.skillProfs}</div>
        </button>
      `).join('')}
    </div>
  `;

  container.querySelector('#bg-grid').addEventListener('click', e => {
    const card = e.target.closest('.creator-option-card');
    if (!card) return;
    const bgId = card.dataset.bgId;
    const bgData = PHB_BACKGROUNDS.find(b => b.id === bgId);
    if (!bgData) return;

    set('background', {
      id: bgData.id,
      name: bgData.name,
      source: 'PHB',
      feature: '',
      skillProfs: bgData.skillProfs.split(', '),
    });

    container.querySelectorAll('.creator-option-card').forEach(c =>
      c.classList.toggle('selected', c.dataset.bgId === bgId)
    );
  });
}

export function validate() {
  return !!get('background.id');
}
