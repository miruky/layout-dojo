import { describe, expect, it } from 'vitest';
import { compile } from './csstext';
import { levelByIndex, levels } from './levels';

describe('levels', () => {
  it('idは一意で、本文がすべて埋まっている', () => {
    const ids = levels.map((level) => level.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const level of levels) {
      expect(level.title).not.toBe('');
      expect(level.goal).not.toBe('');
      expect(level.hint).not.toBe('');
      expect(level.stones).toBeGreaterThanOrEqual(1);
      expect(level.stones).toBeLessThanOrEqual(9);
    }
  });

  it('正解CSSは回答と同じ許可リストを問題なく通る', () => {
    for (const level of levels) {
      const compiled = compile(level.targetCss, level.allowedSelectors);
      expect(compiled.issues, `${level.id}: ${JSON.stringify(compiled.issues)}`).toEqual([]);
      expect(compiled.rules.length).toBeGreaterThan(0);
    }
  });

  it('正解CSSは初期コードと同一ではない(最初から合格になるお題がない)', () => {
    for (const level of levels) {
      const target = compile(level.targetCss, level.allowedSelectors).rules;
      const starter = compile(level.starter, level.allowedSelectors).rules;
      expect(JSON.stringify(starter), level.id).not.toBe(JSON.stringify(target));
    }
  });

  it('初期コードは問題なく解釈でき、許可セレクタだけを使う', () => {
    for (const level of levels) {
      const compiled = compile(level.starter, level.allowedSelectors);
      expect(compiled.issues, `${level.id}: ${JSON.stringify(compiled.issues)}`).toEqual([]);
    }
  });

  it('お題ごとに対象セレクタが定義され、.niwaを必ず含む', () => {
    for (const level of levels) {
      expect(level.allowedSelectors).toContain('.niwa');
    }
  });

  it('levelByIndexは範囲外でundefinedを返す', () => {
    expect(levelByIndex(0)?.id).toBe(levels[0]?.id);
    expect(levelByIndex(-1)).toBeUndefined();
    expect(levelByIndex(levels.length)).toBeUndefined();
  });
});
