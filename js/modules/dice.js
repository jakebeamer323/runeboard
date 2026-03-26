import { DICE_TYPES } from '../utils/constants.js';

/**
 * Parse and roll a dice notation string.
 * Supports: d20, 2d6, 1d8+3, 2d6-1, d20 adv, d20 dis
 * Returns { notation, rolls, modifier, total, isAdv, isDis, isCrit, isFail }
 */
export function parseAndRoll(notation) {
  const raw = notation.trim().toLowerCase();
  const isAdv = raw.includes('adv');
  const isDis = raw.includes('dis');
  const clean = raw.replace(/adv(antage)?|dis(advantage)?/g, '').trim();

  // Match NdX+M or NdX-M or dX
  const match = clean.match(/^(\d*)d(\d+)([+-]\d+)?$/);
  if (!match) return null;

  const count    = parseInt(match[1] || '1');
  const sides    = parseInt(match[2]);
  const modifier = match[3] ? parseInt(match[3]) : 0;

  if (count < 1 || count > 100 || sides < 2) return null;

  function rollDice() {
    const rolls = [];
    for (let i = 0; i < count; i++) {
      rolls.push(Math.floor(Math.random() * sides) + 1);
    }
    return rolls;
  }

  let rolls = rollDice();

  if ((isAdv || isDis) && count === 1 && sides === 20) {
    const rolls2 = rollDice();
    const sum1 = rolls.reduce((a, b) => a + b, 0);
    const sum2 = rolls2.reduce((a, b) => a + b, 0);
    if (isAdv) rolls = sum1 >= sum2 ? rolls : rolls2;
    else       rolls = sum1 <= sum2 ? rolls : rolls2;
  }

  const rawTotal = rolls.reduce((a, b) => a + b, 0);
  const total    = rawTotal + modifier;
  const isCrit   = count === 1 && sides === 20 && rolls[0] === 20;
  const isFail   = count === 1 && sides === 20 && rolls[0] === 1;

  return {
    notation: raw,
    rolls,
    modifier,
    total,
    sides,
    count,
    isAdv,
    isDis,
    isCrit,
    isFail
  };
}

export function quickRoll(sides) {
  return parseAndRoll(`d${sides}`);
}

export function formatRollResult(result) {
  if (!result) return 'Invalid notation';

  let parts = [];
  if (result.rolls.length > 1) {
    parts.push(`[${result.rolls.join(', ')}]`);
  } else {
    parts.push(result.rolls[0]);
  }
  if (result.modifier !== 0) {
    parts.push(result.modifier > 0 ? `+${result.modifier}` : result.modifier);
  }

  const extra = [];
  if (result.isCrit) extra.push('CRIT!');
  if (result.isFail) extra.push('FAIL');
  if (result.isAdv)  extra.push('adv');
  if (result.isDis)  extra.push('dis');

  let str = `🎲 ${result.notation.toUpperCase()} → **${result.total}**`;
  if (result.rolls.length > 1 || result.modifier !== 0) {
    str += ` (${parts.join(' ')})`;
  }
  if (extra.length) str += ` ${extra.join(' ')}`;
  return str;
}

export function initDicePanel(roomId, sendToChat) {
  const grid    = document.getElementById('dice-grid');
  const input   = document.getElementById('dice-input');
  const rollBtn = document.getElementById('dice-roll-btn');
  const history = document.getElementById('dice-history');

  if (!grid || !input || !rollBtn || !history) return;

  function addToHistory(result) {
    const div = document.createElement('div');
    div.className = 'chat-msg';

    let cls = '';
    if (result.isCrit) cls = 'crit';
    if (result.isFail) cls = 'fail';

    div.innerHTML = `
      <span class="roll-result ${cls}">${formatRollResult(result)
        .replace(/\*\*(\d+)\*\*/, '<strong>$1</strong>')}</span>
    `;

    history.prepend(div);

    // Keep history trimmed
    while (history.children.length > 20) {
      history.removeChild(history.lastChild);
    }
  }

  function roll(notation) {
    const result = parseAndRoll(notation);
    if (!result) {
      return;
    }
    addToHistory(result);
    if (sendToChat) sendToChat(result);
  }

  // Quick roll buttons
  grid.innerHTML = '';
  ['d4','d6','d8','d10','d12','d20','d100'].forEach(d => {
    const btn = document.createElement('button');
    btn.className = 'dice-btn';
    btn.textContent = d;
    btn.addEventListener('click', () => {
      input.value = d;
      roll(d);
    });
    grid.appendChild(btn);
  });

  rollBtn.addEventListener('click', () => {
    const val = input.value.trim();
    if (val) roll(val);
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const val = input.value.trim();
      if (val) roll(val);
    }
  });
}
