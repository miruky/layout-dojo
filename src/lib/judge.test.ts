import { describe, expect, it } from 'vitest';
import { describeDiff, judge, type Rect, type StoneDiff } from './judge';

const rect = (x: number, y: number, width = 56, height = 56): Rect => ({ x, y, width, height });

describe('judge', () => {
  it('全石が一致すれば合格', () => {
    const target = [rect(0, 0), rect(60, 0)];
    const result = judge(target, [rect(0, 0), rect(60, 0)]);
    expect(result.pass).toBe(true);
    expect(result.matched).toBe(2);
    expect(result.stones.every((stone) => stone.match)).toBe(true);
  });

  it('許容誤差の範囲内は一致とみなす', () => {
    const result = judge([rect(0, 0)], [rect(1.2, -1.4)]);
    expect(result.pass).toBe(true);
  });

  it('許容誤差を超えるとその石だけ不一致になる', () => {
    const result = judge([rect(0, 0), rect(60, 0)], [rect(0, 0), rect(60, 10)]);
    expect(result.pass).toBe(false);
    expect(result.matched).toBe(1);
    expect(result.stones[1]?.match).toBe(false);
    expect(result.stones[1]?.dy).toBe(10);
  });

  it('大きさの違いも不一致になる', () => {
    const result = judge([rect(0, 0)], [rect(0, 0, 100, 56)]);
    expect(result.pass).toBe(false);
    expect(result.stones[0]?.dw).toBe(44);
  });

  it('石の数が違えば即不合格', () => {
    const result = judge([rect(0, 0)], []);
    expect(result.pass).toBe(false);
    expect(result.stones).toEqual([]);
  });

  it('石がひとつもない場合は合格にしない', () => {
    expect(judge([], []).pass).toBe(false);
  });
});

describe('describeDiff', () => {
  const diff = (over: Partial<StoneDiff>): StoneDiff => ({
    index: 0,
    dx: 0,
    dy: 0,
    dw: 0,
    dh: 0,
    match: false,
    ...over,
  });

  it('一致している石は空文字を返す', () => {
    expect(describeDiff(diff({ match: true }))).toBe('');
  });

  it('右にずれた石は左へ詰める向きで案内する', () => {
    expect(describeDiff(diff({ dx: 12 }))).toBe('左へ 12px');
    expect(describeDiff(diff({ dx: -8 }))).toBe('右へ 8px');
  });

  it('下にずれた石は上へ、幅が広い石は詰める向きで案内する', () => {
    expect(describeDiff(diff({ dy: 10, dw: 20 }))).toBe('上へ 10px、幅を 20px 詰める');
  });

  it('許容誤差内のずれは案内しない', () => {
    expect(describeDiff(diff({ dx: 1, dy: -1 }))).toBe('');
  });
});
