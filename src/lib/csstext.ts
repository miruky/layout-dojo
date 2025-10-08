// 回答CSSの解釈と検査。任意のCSSを流し込ませず、レイアウト学習に必要な
// プロパティだけを許可リストで通す。位置やサイズを直接いじる回答
// (position・margin等)はお題の趣旨が崩れるため受け付けない。

export interface Declaration {
  property: string;
  value: string;
}

export interface Rule {
  selector: string;
  declarations: Declaration[];
}

export interface Issue {
  selector?: string;
  property?: string;
  reason: string;
}

export interface ParseResult {
  rules: Rule[];
  issues: Issue[];
}

const KEYWORDS: Record<string, string[]> = {
  display: ['flex', 'inline-flex', 'grid', 'inline-grid', 'block'],
  'flex-direction': ['row', 'row-reverse', 'column', 'column-reverse'],
  'flex-wrap': ['nowrap', 'wrap', 'wrap-reverse'],
  'justify-content': [
    'flex-start',
    'flex-end',
    'center',
    'space-between',
    'space-around',
    'space-evenly',
    'start',
    'end',
  ],
  'align-items': ['flex-start', 'flex-end', 'center', 'stretch', 'baseline', 'start', 'end'],
  'align-content': [
    'flex-start',
    'flex-end',
    'center',
    'stretch',
    'space-between',
    'space-around',
    'space-evenly',
    'start',
    'end',
  ],
  'justify-items': ['start', 'end', 'center', 'stretch'],
  'align-self': ['auto', 'flex-start', 'flex-end', 'center', 'stretch', 'baseline', 'start', 'end'],
  'justify-self': ['auto', 'start', 'end', 'center', 'stretch'],
  'grid-auto-flow': ['row', 'column', 'dense', 'row dense', 'column dense'],
};

const LENGTH = /^-?\d+(\.\d+)?(px|%|em|rem|fr|vw|vh)?$/;
const INTEGER = /^-?\d+$/;
const NUMBER = /^-?\d+(\.\d+)?$/;
const GRID_LINE = /^(auto|span +\d+|-?\d+)( *\/ *(auto|span +\d+|-?\d+))?$/;
const AREA_NAME = /^[a-z][a-z0-9-]*$/;
const AREA_ROWS = /^("[a-z0-9 .-]+" *)+$/;
// repeat等の関数形と長さトークンの列。url()などの紛れ込みは関数名検査で弾く
const TRACK_CHARS = /^[a-z0-9 .%(),-]+$/;
const TRACK_FUNCTIONS = new Set(['repeat', 'minmax', 'fit-content']);

function isTrackList(value: string): boolean {
  if (!TRACK_CHARS.test(value)) return false;
  for (const match of value.matchAll(/([a-z-]+)\(/g)) {
    if (!TRACK_FUNCTIONS.has(match[1] ?? '')) return false;
  }
  return true;
}

function isLengthList(value: string, max: number): boolean {
  const parts = value.split(/ +/);
  return parts.length >= 1 && parts.length <= max && parts.every((part) => LENGTH.test(part));
}

function isPlacePair(value: string, single: string): boolean {
  const parts = value.split(/ +/);
  const allowed = KEYWORDS[single] ?? [];
  return parts.length >= 1 && parts.length <= 2 && parts.every((part) => allowed.includes(part));
}

// プロパティごとの値検査。trueなら受理
const VALIDATORS: Record<string, (value: string) => boolean> = {
  display: (v) => (KEYWORDS['display'] ?? []).includes(v),
  'flex-direction': (v) => (KEYWORDS['flex-direction'] ?? []).includes(v),
  'flex-wrap': (v) => (KEYWORDS['flex-wrap'] ?? []).includes(v),
  'justify-content': (v) => (KEYWORDS['justify-content'] ?? []).includes(v),
  'align-items': (v) => (KEYWORDS['align-items'] ?? []).includes(v),
  'align-content': (v) => (KEYWORDS['align-content'] ?? []).includes(v),
  'justify-items': (v) => (KEYWORDS['justify-items'] ?? []).includes(v),
  'align-self': (v) => (KEYWORDS['align-self'] ?? []).includes(v),
  'justify-self': (v) => (KEYWORDS['justify-self'] ?? []).includes(v),
  'place-items': (v) => isPlacePair(v, 'align-items'),
  'place-content': (v) => isPlacePair(v, 'align-content'),
  gap: (v) => isLengthList(v, 2),
  'row-gap': (v) => isLengthList(v, 1),
  'column-gap': (v) => isLengthList(v, 1),
  order: (v) => INTEGER.test(v),
  'flex-grow': (v) => NUMBER.test(v),
  'flex-shrink': (v) => NUMBER.test(v),
  'flex-basis': (v) => v === 'auto' || v === 'content' || LENGTH.test(v),
  'grid-template-columns': isTrackList,
  'grid-template-rows': isTrackList,
  'grid-auto-columns': isTrackList,
  'grid-auto-rows': isTrackList,
  'grid-auto-flow': (v) => (KEYWORDS['grid-auto-flow'] ?? []).includes(v),
  'grid-column': (v) => GRID_LINE.test(v),
  'grid-row': (v) => GRID_LINE.test(v),
  'grid-template-areas': (v) => AREA_ROWS.test(v),
  'grid-area': (v) => AREA_NAME.test(v) || GRID_LINE.test(v),
};

export const ALLOWED_PROPERTIES = Object.keys(VALIDATORS);

// コメントを除去し、「セレクタ { 宣言 }」の並びとして読む
export function parseCss(text: string): ParseResult {
  const issues: Issue[] = [];
  const rules: Rule[] = [];
  const source = text.replace(/\/\*[\s\S]*?\*\//g, ' ');
  const blockPattern = /([^{}]+)\{([^{}]*)\}/g;
  let consumedUntil = 0;
  let match: RegExpExecArray | null;
  while ((match = blockPattern.exec(source)) !== null) {
    const between = source.slice(consumedUntil, match.index);
    if (consumedUntil !== match.index && between.trim() !== '') {
      issues.push({ reason: `ブロックの外に書かれています: ${between.trim()}` });
    }
    consumedUntil = blockPattern.lastIndex;
    let selector = (match[1] ?? '').trim().replace(/\s+/g, ' ');
    // 「display: flex; .niwa {」のように、ブロックに入り損ねた宣言を切り分ける
    const straySplit = selector.lastIndexOf(';');
    if (straySplit !== -1) {
      const stray = selector.slice(0, straySplit + 1).trim();
      if (stray !== '') issues.push({ reason: `ブロックの外に書かれています: ${stray}` });
      selector = selector.slice(straySplit + 1).trim();
    }
    if (selector === '') {
      issues.push({ reason: 'セレクタが空のブロックがあります' });
      continue;
    }
    const declarations: Declaration[] = [];
    for (const piece of (match[2] ?? '').split(';')) {
      if (piece.trim() === '') continue;
      const colon = piece.indexOf(':');
      if (colon === -1) {
        issues.push({
          selector,
          reason: `宣言の形式が「プロパティ: 値;」ではありません: ${piece.trim()}`,
        });
        continue;
      }
      const property = piece.slice(0, colon).trim().toLowerCase();
      const value = piece
        .slice(colon + 1)
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ');
      if (property === '' || value === '') {
        issues.push({ selector, reason: `プロパティか値が空です: ${piece.trim()}` });
        continue;
      }
      declarations.push({ property, value });
    }
    rules.push({ selector, declarations });
  }
  const tail = source.slice(consumedUntil);
  if (tail.trim() !== '') {
    issues.push({
      reason: `閉じていないブロックか、余分な記述があります: ${tail.trim().slice(0, 40)}`,
    });
  }
  return { rules, issues };
}

// セレクタとプロパティを許可リストで検査し、通った宣言だけを返す
export function validate(rules: Rule[], allowedSelectors: string[]): ParseResult {
  const issues: Issue[] = [];
  const accepted: Rule[] = [];
  for (const rule of rules) {
    if (!allowedSelectors.includes(rule.selector)) {
      issues.push({
        selector: rule.selector,
        reason: `このお題で書けるセレクタは ${allowedSelectors.join('、')} だけです`,
      });
      continue;
    }
    const declarations: Declaration[] = [];
    for (const declaration of rule.declarations) {
      const validator = VALIDATORS[declaration.property];
      if (!validator) {
        issues.push({
          selector: rule.selector,
          property: declaration.property,
          reason: `'${declaration.property}' はこの道場では使えません(レイアウト系プロパティのみ)`,
        });
        continue;
      }
      if (!validator(declaration.value)) {
        issues.push({
          selector: rule.selector,
          property: declaration.property,
          reason: `'${declaration.value}' は '${declaration.property}' の値として受け付けられません`,
        });
        continue;
      }
      declarations.push(declaration);
    }
    if (declarations.length > 0) accepted.push({ selector: rule.selector, declarations });
  }
  return { rules: accepted, issues };
}

export function compile(text: string, allowedSelectors: string[]): ParseResult {
  const parsed = parseCss(text);
  const checked = validate(parsed.rules, allowedSelectors);
  return { rules: checked.rules, issues: [...parsed.issues, ...checked.issues] };
}
