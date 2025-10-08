// 採点。お手本と回答のレイアウトを「各石の実測矩形」で突き合わせる。
// プロパティの書き方は見ないので、別解でも結果が一致していれば合格になる。

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface StoneDiff {
  index: number;
  dx: number;
  dy: number;
  dw: number;
  dh: number;
  match: boolean;
}

export interface Judgement {
  pass: boolean;
  matched: number;
  total: number;
  stones: StoneDiff[];
}

export const TOLERANCE = 1.5;

export function judge(target: Rect[], actual: Rect[], tolerance: number = TOLERANCE): Judgement {
  if (target.length !== actual.length) {
    return { pass: false, matched: 0, total: target.length, stones: [] };
  }
  const stones = target.map((expected, index) => {
    const got = actual[index] as Rect;
    const dx = got.x - expected.x;
    const dy = got.y - expected.y;
    const dw = got.width - expected.width;
    const dh = got.height - expected.height;
    const match = [dx, dy, dw, dh].every((delta) => Math.abs(delta) <= tolerance);
    return { index, dx, dy, dw, dh, match };
  });
  const matched = stones.filter((stone) => stone.match).length;
  return {
    pass: matched === target.length && target.length > 0,
    matched,
    total: target.length,
    stones,
  };
}
