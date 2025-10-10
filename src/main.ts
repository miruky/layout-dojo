// 画面の組み立てと配線。お手本ステージにはお題の正解CSSを、回答ステージには
// エディタのCSSを流し、両者の石の実測位置を突き合わせて合否を出す。
// 進捗と書きかけはlocalStorageに、現在のお題はURLハッシュに残す。

import './style.css';
import { compile } from './lib/csstext';
import { describeDiff, judge, type Judgement } from './lib/judge';
import { levelByIndex, levels, type Level } from './lib/levels';
import { store } from './lib/storage';
import { applyTheme, loadTheme, nextTheme, THEME_LABEL, type ThemeMode } from './lib/theme';
import { NUMERALS, Stage } from './ui/stage';

const CLEARED_KEY = 'layout-dojo:cleared';
const CODE_KEY = (id: string) => `layout-dojo:code:${id}`;

// 配色を読み出し、DOM構築前に反映してちらつきを抑える。
let themeMode: ThemeMode = loadTheme();
applyTheme(themeMode);

const THEME_ICON: Record<ThemeMode, string> = {
  light: `<svg class="theme-icon" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.6" />
    <path d="M12 3.5v2.2M12 18.3v2.2M4.6 12H6.8M17.2 12h2.2M6.4 6.4l1.6 1.6M16 16l1.6 1.6M17.6 6.4 16 8M8 16l-1.6 1.6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
  </svg>`,
  dark: `<svg class="theme-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M20 14.6A8 8 0 1 1 9.4 4a6.5 6.5 0 0 0 10.6 10.6Z" fill="currentColor" />
  </svg>`,
  auto: `<svg class="theme-icon" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.6" />
    <path d="M12 4a8 8 0 0 1 0 16Z" fill="currentColor" />
  </svg>`,
};

// 庭に石を据えた紋。格子の中の朱い石が主役。
const BRAND_MARK = `
  <svg class="brand-mark" viewBox="0 0 64 64" aria-hidden="true">
    <rect x="3.5" y="3.5" width="57" height="57" rx="13" class="mark-bg" />
    <path d="M 25 13 V 51 M 42 13 V 51 M 13 25 H 51 M 13 42 H 51" class="mark-grid" />
    <rect x="17" y="17" width="15" height="15" rx="4" class="mark-stone-accent" />
    <circle cx="46" cy="46" r="5" class="mark-stone" />
    <circle cx="46.5" cy="18.5" r="3.5" class="mark-stone" />
  </svg>`;

// 済の朱印(お題一覧のバッジ)
const SEAL_BADGE = `
  <svg class="level-badge" viewBox="0 0 24 24" aria-hidden="true">
    <rect x="2.5" y="2.5" width="19" height="19" rx="5" fill="none" stroke="currentColor" stroke-width="1.6" />
    <path d="M 7.5 12.5 L 10.5 15.5 L 16.5 9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
  </svg>`;

// 合格時の朱印(塗りつぶし)
const SEAL_SOLID = `
  <svg class="verdict-seal" viewBox="0 0 24 24" aria-hidden="true">
    <rect x="2" y="2" width="20" height="20" rx="6" fill="currentColor" />
    <path d="M 7.5 12.5 L 10.5 15.5 L 16.5 8.5" fill="none" stroke="#faf7ef" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
  </svg>`;

const app = document.getElementById('app');
if (!app) throw new Error('#app が見つかりません');

app.innerHTML = `
  <div class="app">
    <a class="skip-link" href="#play">本文へスキップ</a>
    <header class="app-header">
      <div class="brand">
        ${BRAND_MARK}
        <div class="brand-text">
          <h1>layout-dojo</h1>
          <p class="tagline">枯山水に石を据えて学ぶ、FlexboxとGridの稽古</p>
        </div>
      </div>
      <div class="header-aside">
        <p class="progress" aria-live="polite">
          <span class="kicker">Cleared</span>
          <span class="progress-count" id="progress-count"></span>
          <span class="progress-bar" aria-hidden="true"><span id="progress-fill"></span></span>
        </p>
        <button type="button" class="theme-toggle" id="theme-toggle"></button>
      </div>
    </header>
    <div class="layout">
      <nav class="level-nav" aria-label="お題一覧">
        <div class="level-nav-head">
          <span class="kicker">稽古 / Keiko</span>
          <span class="nav-hint"><kbd>[</kbd><kbd>]</kbd> で移動</span>
        </div>
        <ol class="level-list" id="level-list"></ol>
      </nav>
      <main class="play" id="play" tabindex="-1">
        <div class="all-clear" id="all-clear" hidden aria-live="polite">
          ${SEAL_SOLID}
          <p>皆伝。全${levels.length}問を通しました。</p>
        </div>
        <section class="task" aria-labelledby="task-title">
          <span class="kicker task-kicker" id="task-kicker"></span>
          <h2 id="task-title"></h2>
          <p class="task-goal" id="task-goal"></p>
          <details class="hint">
            <summary>ヒントを見る</summary>
            <p class="hint-body" id="task-hint"></p>
          </details>
          <details class="hint reveal">
            <summary>お手本のCSSを見る</summary>
            <pre class="reveal-code"><code id="reveal-css"></code></pre>
          </details>
        </section>
        <section class="arena-wrap" aria-labelledby="arena-head">
          <div class="section-head">
            <span class="kicker" id="arena-head">庭 / Stage</span>
          </div>
          <div class="arena" id="arena"></div>
          <p class="arena-note">薄い枠がお手本の位置。石がすべて重なれば合格。</p>
        </section>
        <section class="answer" aria-labelledby="answer-head">
          <div class="section-head">
            <label class="kicker" id="answer-head" for="css-input">回答 / CSS</label>
            <span class="section-key"><kbd>Cmd</kbd> + <kbd>Enter</kbd> で適用</span>
          </div>
          <textarea id="css-input" class="css-input" spellcheck="false" autocomplete="off" aria-describedby="match-count"></textarea>
          <div class="answer-actions">
            <button type="button" class="button button-primary" id="apply-button">適用する</button>
            <button type="button" class="button" id="retry-button">書き直す</button>
            <span class="answer-meta" id="match-count" aria-live="polite"></span>
          </div>
          <ul class="issues" id="issues"></ul>
          <ul class="diffs" id="diffs" aria-live="polite"></ul>
          <div class="verdict" id="verdict" hidden>
            <div class="verdict-text">
              ${SEAL_SOLID}
              <p>合格。お手本と寸分違わず一致しました。</p>
            </div>
            <button type="button" class="button button-primary" id="next-button">次のお題へ</button>
          </div>
        </section>
      </main>
    </div>
    <footer class="app-footer">
      <p>
        採点は書いたプロパティではなく石の実測位置で行うため、別解でも一致すれば合格になります。
        進捗はこの端末のlocalStorageにだけ残ります。
        <a href="https://github.com/miruky/layout-dojo">ソースコード</a>
        <button type="button" class="linklike" id="clear-progress">進捗をリセット</button>
      </p>
    </footer>
  </div>`;

const arena = document.getElementById('arena') as HTMLElement;
const ghost = new Stage(arena, 'ghost');
const answer = new Stage(arena, 'answer');
const editor = document.getElementById('css-input') as HTMLTextAreaElement;
const issuesEl = document.getElementById('issues') as HTMLUListElement;
const diffsEl = document.getElementById('diffs') as HTMLUListElement;
const verdictEl = document.getElementById('verdict') as HTMLElement;
const matchCountEl = document.getElementById('match-count') as HTMLElement;
const progressCountEl = document.getElementById('progress-count') as HTMLElement;
const progressFillEl = document.getElementById('progress-fill') as HTMLElement;
const allClearEl = document.getElementById('all-clear') as HTMLElement;
const taskKickerEl = document.getElementById('task-kicker') as HTMLElement;
const taskTitleEl = document.getElementById('task-title') as HTMLElement;
const taskGoalEl = document.getElementById('task-goal') as HTMLElement;
const taskHintEl = document.getElementById('task-hint') as HTMLElement;
const revealCssEl = document.getElementById('reveal-css') as HTMLElement;
const levelListEl = document.getElementById('level-list') as HTMLOListElement;
const themeToggle = document.getElementById('theme-toggle') as HTMLButtonElement;

let current = 0;

function renderTheme(): void {
  themeToggle.innerHTML = THEME_ICON[themeMode];
  themeToggle.setAttribute(
    'aria-label',
    `配色: ${THEME_LABEL[themeMode]}。押すと${THEME_LABEL[nextTheme(themeMode)]}へ`,
  );
  themeToggle.title = `配色: ${THEME_LABEL[themeMode]}`;
}

themeToggle.addEventListener('click', () => {
  themeMode = nextTheme(themeMode);
  applyTheme(themeMode);
  renderTheme();
});

function clearedIds(): Set<string> {
  try {
    const parsed: unknown = JSON.parse(store.getItem(CLEARED_KEY) ?? '[]');
    if (Array.isArray(parsed) && parsed.every((item): item is string => typeof item === 'string')) {
      return new Set(parsed);
    }
  } catch {
    // 壊れた保存データは進捗なしとして扱う
  }
  return new Set();
}

function markCleared(id: string): void {
  const ids = clearedIds();
  ids.add(id);
  store.setItem(CLEARED_KEY, JSON.stringify([...ids]));
}

// 一覧は一度だけ組み、以降は状態だけ差し替える。毎回作り直すとフォーカスが飛び、
// 入場アニメーションも適用のたびに再生されてしまう。
const levelButtons: HTMLButtonElement[] = [];

function buildLevelList(): void {
  levelListEl.replaceChildren();
  levelButtons.length = 0;
  levels.forEach((level, index) => {
    const item = document.createElement('li');
    item.style.setProperty('--i', String(index));

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'level-button';

    const idx = document.createElement('span');
    idx.className = 'level-index';
    idx.textContent = String(index + 1);
    const name = document.createElement('span');
    name.className = 'level-name';
    name.textContent = level.title;
    button.append(idx, name);
    button.insertAdjacentHTML('beforeend', SEAL_BADGE);

    button.addEventListener('click', () => {
      selectLevel(index);
    });
    item.append(button);
    levelListEl.append(item);
    levelButtons.push(button);
  });
}

function updateLevelList(): void {
  const ids = clearedIds();
  levelButtons.forEach((button, index) => {
    const level = levels[index] as Level;
    const cleared = ids.has(level.id);
    button.classList.toggle('is-cleared', cleared);
    button.setAttribute('aria-current', String(index === current));
    button.setAttribute(
      'aria-label',
      `第${index + 1}問 ${level.title}${cleared ? '(クリア済み)' : ''}`,
    );
  });

  const cleared = ids.size;
  const total = levels.length;
  progressCountEl.innerHTML = `<b>${cleared}</b> / ${total}`;
  progressFillEl.style.width = `${total === 0 ? 0 : (cleared / total) * 100}%`;
  allClearEl.hidden = !(total > 0 && cleared === total);
}

function showIssues(issues: { reason: string }[]): void {
  issuesEl.replaceChildren();
  for (const issue of issues) {
    const item = document.createElement('li');
    item.textContent = issue.reason;
    issuesEl.append(item);
  }
}

// ずれている石を、進むべき向きで案内する。CSSにエラーがある間は出さず、
// 多すぎるときは先頭だけ見せて残りは件数で畳む。
const MAX_DIFFS = 4;

function showDiffs(result: Judgement, clean: boolean): void {
  diffsEl.replaceChildren();
  if (!clean || result.pass || result.total === 0 || result.stones.length === 0) return;

  const off = result.stones.filter((stone) => !stone.match);
  for (const stone of off.slice(0, MAX_DIFFS)) {
    const text = describeDiff(stone);
    if (!text) continue;
    const item = document.createElement('li');
    const name = document.createElement('b');
    name.textContent = `${NUMERALS[stone.index] ?? stone.index + 1}の石`;
    item.append(name, document.createTextNode(` ${text}`));
    diffsEl.append(item);
  }
  if (off.length > MAX_DIFFS) {
    const more = document.createElement('li');
    more.className = 'diffs-more';
    more.textContent = `ほか ${off.length - MAX_DIFFS} 個ずれています`;
    diffsEl.append(more);
  }
}

function applyAnswer(level: Level, animate: boolean): void {
  const before = animate ? answer.rects() : [];
  const compiled = compile(editor.value, level.allowedSelectors);
  answer.applyRules(compiled.rules);
  showIssues(compiled.issues);

  // 採点は適用直後の実測で行い、移動アニメーションはその後に始める。
  // 先にFLIPを掛けると、計測が変位中の transform を拾って合否を取り違える。
  const result = judge(ghost.rects(), answer.rects());
  answer.setFit(result.stones.map((stone) => stone.match));
  matchCountEl.textContent = `石 ${result.matched} / ${result.total}`;
  showDiffs(result, compiled.issues.length === 0);
  verdictEl.hidden = !result.pass;
  if (result.pass) {
    markCleared(level.id);
    updateLevelList();
  }

  if (animate) answer.animateFrom(before);
}

function selectLevel(index: number): void {
  const leaving = levelByIndex(current);
  if (leaving) store.setItem(CODE_KEY(leaving.id), editor.value);

  current = Math.min(Math.max(index, 0), levels.length - 1);
  const level = levelByIndex(current) as Level;
  history.replaceState(null, '', `#${current + 1}`);

  taskKickerEl.textContent = `第${current + 1}問`;
  taskTitleEl.textContent = level.title;
  taskGoalEl.textContent = level.goal;
  taskHintEl.textContent = level.hint;
  revealCssEl.textContent = level.targetCss;
  for (const d of document.querySelectorAll<HTMLDetailsElement>('.hint')) d.open = false;

  ghost.setStones(level.stones);
  answer.setStones(level.stones);
  ghost.applyRules(compile(level.targetCss, level.allowedSelectors).rules);
  editor.value = store.getItem(CODE_KEY(level.id)) ?? level.starter;
  applyAnswer(level, false);
  updateLevelList();
}

document.getElementById('apply-button')?.addEventListener('click', () => {
  const level = levelByIndex(current);
  if (!level) return;
  store.setItem(CODE_KEY(level.id), editor.value);
  applyAnswer(level, true);
});

document.getElementById('retry-button')?.addEventListener('click', () => {
  const level = levelByIndex(current);
  if (!level) return;
  editor.value = level.starter;
  store.removeItem(CODE_KEY(level.id));
  applyAnswer(level, true);
  editor.focus();
});

document.getElementById('next-button')?.addEventListener('click', () => {
  selectLevel(Math.min(current + 1, levels.length - 1));
  editor.focus();
});

document.getElementById('clear-progress')?.addEventListener('click', () => {
  store.removeItem(CLEARED_KEY);
  updateLevelList();
});

editor.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
    event.preventDefault();
    document.getElementById('apply-button')?.click();
    return;
  }
  if (event.key === 'Tab') {
    event.preventDefault();
    const { selectionStart, selectionEnd, value } = editor;
    editor.value = `${value.slice(0, selectionStart)}  ${value.slice(selectionEnd)}`;
    editor.selectionStart = selectionStart + 2;
    editor.selectionEnd = selectionStart + 2;
  }
});

// お題の移動: [ で前のお題、] で次のお題。エディタ入力中や修飾キー併用時は無効。
document.addEventListener('keydown', (event) => {
  if (event.target === editor) return;
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  if (event.key === ']') {
    event.preventDefault();
    selectLevel(Math.min(current + 1, levels.length - 1));
  } else if (event.key === '[') {
    event.preventDefault();
    selectLevel(Math.max(current - 1, 0));
  }
});

renderTheme();
buildLevelList();
const fromHash = Number.parseInt(location.hash.slice(1), 10);
selectLevel(Number.isInteger(fromHash) && fromHash >= 1 ? fromHash - 1 : 0);
