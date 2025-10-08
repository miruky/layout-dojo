import { describe, expect, it } from 'vitest';
import { judge, type Rect } from './judge';

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
