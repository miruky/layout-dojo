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

// 石がお手本からどれだけずれているかを、進むべき向きの言葉で表す。
// dx/dy/dw/dh は「回答 − お手本」なので、正なら逆向きに動かして詰める。
export function describeDiff(stone: StoneDiff, tolerance: number = TOLERANCE): string {
  const px = (value: number) => Math.round(Math.abs(value));
  const parts: string[] = [];
  if (stone.dx > tolerance) parts.push(`左へ ${px(stone.dx)}px`);
  else if (stone.dx < -tolerance) parts.push(`右へ ${px(stone.dx)}px`);
  if (stone.dy > tolerance) parts.push(`上へ ${px(stone.dy)}px`);
  else if (stone.dy < -tolerance) parts.push(`下へ ${px(stone.dy)}px`);
  if (stone.dw > tolerance) parts.push(`幅を ${px(stone.dw)}px 詰める`);
  else if (stone.dw < -tolerance) parts.push(`幅を ${px(stone.dw)}px 広げる`);
  if (stone.dh > tolerance) parts.push(`高さを ${px(stone.dh)}px 詰める`);
  else if (stone.dh < -tolerance) parts.push(`高さを ${px(stone.dh)}px 広げる`);
  return parts.join('、');
}
