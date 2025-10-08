// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { compile } from '../lib/csstext';
import { Stage } from './stage';

function mount(kind: 'ghost' | 'answer' = 'answer'): { host: HTMLElement; stage: Stage } {
  const host = document.createElement('div');
  document.body.append(host);
  return { host, stage: new Stage(host, kind) };
}

describe('Stage', () => {
  it('指定した数の石を漢数字付きで並べる', () => {
    const { host, stage } = mount();
    stage.setStones(3);
    const stones = host.querySelectorAll('.ishi');
    expect(stones.length).toBe(3);
    expect(stones[0]?.textContent).toBe('一');
    expect(stones[2]?.classList.contains('ishi-3')).toBe(true);
  });

  it('石を入れ替えると前の石は残らない', () => {
    const { host, stage } = mount();
    stage.setStones(5);
    stage.setStones(2);
    expect(host.querySelectorAll('.ishi').length).toBe(2);
  });

  it('ルールはステージのIDでスコープしてstyleに書く', () => {
    const { stage } = mount();
    const { rules } = compile('.niwa { display: flex; } .ishi-1 { order: 1; }', [
      '.niwa',
      '.ishi-1',
    ]);
    stage.applyRules(rules);
    const styles = [...document.head.querySelectorAll('style')].map((el) => el.textContent ?? '');
    const mine = styles.find((text) => text.includes('display: flex'));
    expect(mine).toBeDefined();
    expect(mine).toMatch(/#stage-answer-\d+ \.niwa \{/);
    expect(mine).toMatch(/#stage-answer-\d+ \.ishi-1 \{/);
  });

  it('再適用すると前のルールは消える', () => {
    const { host, stage } = mount();
    const id = host.querySelector('.stage')?.id as string;
    stage.applyRules(compile('.niwa { display: flex; }', ['.niwa']).rules);
    stage.applyRules(compile('.niwa { display: grid; }', ['.niwa']).rules);
    const mine = [...document.head.querySelectorAll('style')]
      .map((el) => el.textContent ?? '')
      .filter((text) => text.includes(`#${id} `));
    expect(mine.length).toBe(1);
    expect(mine[0]).toContain('display: grid');
    expect(mine[0]).not.toContain('display: flex');
  });

  it('rectsは石の数だけ矩形を返す', () => {
    const { stage } = mount();
    stage.setStones(4);
    const rects = stage.rects();
    expect(rects.length).toBe(4);
    for (const rect of rects) {
      expect(Number.isFinite(rect.x)).toBe(true);
      expect(Number.isFinite(rect.y)).toBe(true);
    }
  });

  it('setFitで一致した石にだけfitクラスが付く', () => {
    const { host, stage } = mount();
    stage.setStones(3);
    stage.setFit([true, false, true]);
    const stones = [...host.querySelectorAll('.ishi')];
    expect(stones[0]?.classList.contains('fit')).toBe(true);
    expect(stones[1]?.classList.contains('fit')).toBe(false);
    expect(stones[2]?.classList.contains('fit')).toBe(true);
  });

  it('お手本ステージは支援技術から隠す', () => {
    const { host } = mount('ghost');
    expect(host.querySelector('.stage--ghost')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('destroyでstyleごと片付く', () => {
    const { host, stage } = mount();
    const styleCount = document.head.querySelectorAll('style').length;
    stage.destroy();
    expect(document.head.querySelectorAll('style').length).toBe(styleCount - 1);
    expect(host.querySelector('.stage')).toBeNull();
  });
});
