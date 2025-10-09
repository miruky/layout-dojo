// 庭(ステージ)の描画とCSSの適用。お手本と回答は同じDOM構造で、
// それぞれ専用の<style>にスコープ付きでルールを書き込む。
// 採点用の矩形は庭の左上を原点とした相対座標で測る。

import type { Rule } from '../lib/csstext';
import type { Rect } from '../lib/judge';

export const NUMERALS = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];

let counter = 0;

export class Stage {
  readonly root: HTMLElement;
  private readonly garden: HTMLElement;
  private readonly styleEl: HTMLStyleElement;
  private readonly scope: string;

  constructor(host: HTMLElement, kind: 'ghost' | 'answer') {
    this.scope = `stage-${kind}-${(counter += 1)}`;
    this.root = document.createElement('div');
    this.root.className = `stage stage--${kind}`;
    this.root.id = this.scope;
    if (kind === 'ghost') this.root.setAttribute('aria-hidden', 'true');
    this.garden = document.createElement('div');
    this.garden.className = 'niwa';
    this.root.append(this.garden);
    this.styleEl = document.createElement('style');
    document.head.append(this.styleEl);
    host.append(this.root);
  }

  setStones(count: number): void {
    this.garden.replaceChildren();
    for (let i = 1; i <= count; i += 1) {
      const stone = document.createElement('div');
      stone.className = `ishi ishi-${i}`;
      stone.textContent = NUMERALS[i - 1] ?? String(i);
      this.garden.append(stone);
    }
  }

  applyRules(rules: Rule[]): void {
    this.styleEl.textContent = rules
      .map((rule) => {
        const body = rule.declarations
          .map((declaration) => `  ${declaration.property}: ${declaration.value};`)
          .join('\n');
        return `#${this.scope} ${rule.selector} {\n${body}\n}`;
      })
      .join('\n');
  }

  stones(): HTMLElement[] {
    return [...this.garden.querySelectorAll<HTMLElement>('.ishi')];
  }

  rects(): Rect[] {
    const origin = this.garden.getBoundingClientRect();
    return this.stones().map((stone) => {
      const rect = stone.getBoundingClientRect();
      return {
        x: rect.x - origin.x,
        y: rect.y - origin.y,
        width: rect.width,
        height: rect.height,
      };
    });
  }

  setFit(matches: boolean[]): void {
    this.stones().forEach((stone, index) => {
      stone.classList.toggle('fit', matches[index] === true);
    });
  }

  // FLIP: 適用前の矩形との差分から、新しい位置への移動をアニメーションする
  animateFrom(before: Rect[]): void {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const after = this.rects();
    this.stones().forEach((stone, index) => {
      if (typeof stone.animate !== 'function') return;
      const from = before[index];
      const to = after[index];
      if (!from || !to) return;
      const dx = from.x - to.x;
      const dy = from.y - to.y;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
      stone.animate(
        [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0, 0)' }],
        { duration: 360, easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)' },
      );
    });
  }

  destroy(): void {
    this.styleEl.remove();
    this.root.remove();
  }
}
