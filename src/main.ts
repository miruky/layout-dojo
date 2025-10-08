// 画面の組み立てと配線。お手本ステージにはお題の正解CSSを、回答ステージには
// エディタのCSSを流し、両者の石の実測位置を突き合わせて合否を出す。
// 進捗と書きかけはlocalStorageに、現在のお題はURLハッシュに残す。

import './style.css';
import { compile } from './lib/csstext';
import { judge } from './lib/judge';
import { levelByIndex, levels, type Level } from './lib/levels';
import { store } from './lib/storage';
import { Stage } from './ui/stage';

const CLEARED_KEY = 'layout-dojo:cleared';
const CODE_KEY = (id: string) => `layout-dojo:code:${id}`;

const BRAND_MARK = `
  <svg class="brand-mark" viewBox="0 0 64 64" aria-hidden="true">
    <rect x="2" y="2" width="60" height="60" rx="14" class="mark-bg" />
    <path d="M 22 12 V 52 M 42 12 V 52 M 12 22 H 52 M 12 42 H 52" class="mark-grid" />
    <circle cx="32" cy="32" r="6.5" class="mark-stone mark-stone-accent" />
    <circle cx="47" cy="17" r="4" class="mark-stone" />
    <circle cx="17" cy="47" r="4" class="mark-stone" />
  </svg>`;

const app = document.getElementById('app');
if (!app) throw new Error('#app が見つかりません');

app.innerHTML = `
  <div class="app">
    <header class="app-header">
      <div class="brand">
        ${BRAND_MARK}
        <div class="brand-text">
          <h1>layout-dojo</h1>
          <p class="tagline">石を納めて学ぶ、FlexboxとGridの道場</p>
        </div>
      </div>
      <p class="progress" id="progress" aria-live="polite"></p>
    </header>
    <div class="layout">
      <nav class="level-nav" aria-label="お題一覧">
        <ol class="level-list" id="level-list"></ol>
      </nav>
      <main class="play">
        <section class="task" aria-label="お題">
          <h2 id="task-title"></h2>
          <p id="task-goal"></p>
          <details class="hint">
            <summary>ヒントを見る</summary>
            <p id="task-hint"></p>
          </details>
        </section>
        <section class="arena-wrap" aria-label="庭">
          <div class="arena" id="arena"></div>
          <p class="arena-note">薄い枠がお手本の位置。石がすべて重なれば合格。</p>
        </section>
        <section class="answer" aria-label="回答">
          <label class="answer-label" for="css-input">回答CSS(Cmd+Enterで適用)</label>
          <textarea id="css-input" class="css-input" spellcheck="false" autocomplete="off"></textarea>
          <div class="answer-actions">
            <button type="button" class="button button-primary" id="apply-button">適用する</button>
            <button type="button" class="button" id="retry-button">書き直す</button>
            <span class="answer-meta" id="match-count" aria-live="polite"></span>
          </div>
          <ul class="issues" id="issues"></ul>
          <div class="verdict" id="verdict" hidden>
            <p>合格。お手本と寸分違わず一致しました。</p>
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
      </p>
    </footer>
  </div>`;

const arena = document.getElementById('arena') as HTMLElement;
const ghost = new Stage(arena, 'ghost');
const answer = new Stage(arena, 'answer');
const editor = document.getElementById('css-input') as HTMLTextAreaElement;
const issuesEl = document.getElementById('issues') as HTMLUListElement;
const verdictEl = document.getElementById('verdict') as HTMLElement;
const matchCountEl = document.getElementById('match-count') as HTMLElement;
const progressEl = document.getElementById('progress') as HTMLElement;
const levelListEl = document.getElementById('level-list') as HTMLOListElement;

let current = 0;

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

function renderLevelList(): void {
  const ids = clearedIds();
  levelListEl.replaceChildren();
  levels.forEach((level, index) => {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'level-button';
    button.setAttribute('aria-current', String(index === current));
    const name = document.createElement('span');
    name.textContent = `${index + 1}. ${level.title}`;
    button.append(name);
    if (ids.has(level.id)) {
      const badge = document.createElement('span');
      badge.className = 'level-badge';
      badge.textContent = '済';
      button.append(badge);
    }
    button.addEventListener('click', () => {
      selectLevel(index);
    });
    item.append(button);
    levelListEl.append(item);
  });
  progressEl.textContent = `合格 ${ids.size} / ${levels.length}`;
}

function showIssues(issues: { reason: string }[]): void {
  issuesEl.replaceChildren();
  for (const issue of issues) {
    const item = document.createElement('li');
    item.textContent = issue.reason;
    issuesEl.append(item);
  }
}

function applyAnswer(level: Level, animate: boolean): void {
  const before = animate ? answer.rects() : [];
  const compiled = compile(editor.value, level.allowedSelectors);
  answer.applyRules(compiled.rules);
  showIssues(compiled.issues);
  if (animate) answer.animateFrom(before);

  const result = judge(ghost.rects(), answer.rects());
  answer.setFit(result.stones.map((stone) => stone.match));
  matchCountEl.textContent = `石 ${result.matched} / ${result.total}`;
  verdictEl.hidden = !result.pass;
  if (result.pass) {
    markCleared(level.id);
    renderLevelList();
  }
}

function selectLevel(index: number): void {
  const leaving = levelByIndex(current);
  if (leaving) store.setItem(CODE_KEY(leaving.id), editor.value);

  current = Math.min(Math.max(index, 0), levels.length - 1);
  const level = levelByIndex(current) as Level;
  history.replaceState(null, '', `#${current + 1}`);

  (document.getElementById('task-title') as HTMLElement).textContent =
    `第${current + 1}問 ${level.title}`;
  (document.getElementById('task-goal') as HTMLElement).textContent = level.goal;
  (document.getElementById('task-hint') as HTMLElement).textContent = level.hint;
  (document.querySelector('.hint') as HTMLDetailsElement).open = false;

  ghost.setStones(level.stones);
  answer.setStones(level.stones);
  ghost.applyRules(compile(level.targetCss, level.allowedSelectors).rules);
  editor.value = store.getItem(CODE_KEY(level.id)) ?? level.starter;
  applyAnswer(level, false);
  renderLevelList();
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

const fromHash = Number.parseInt(location.hash.slice(1), 10);
selectLevel(Number.isInteger(fromHash) && fromHash >= 1 ? fromHash - 1 : 0);
