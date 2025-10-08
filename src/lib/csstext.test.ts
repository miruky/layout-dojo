import { describe, expect, it } from 'vitest';
import { compile, parseCss, validate } from './csstext';

describe('parseCss', () => {
  it('複数ルールと複数宣言を読める', () => {
    const { rules, issues } = parseCss('.niwa { display: flex; gap: 8px; }\n.ishi-1 { order: 1; }');
    expect(issues).toEqual([]);
    expect(rules.length).toBe(2);
    expect(rules[0]?.declarations).toEqual([
      { property: 'display', value: 'flex' },
      { property: 'gap', value: '8px' },
    ]);
    expect(rules[1]?.selector).toBe('.ishi-1');
  });

  it('コメントと余分な空白を無視する', () => {
    const { rules, issues } = parseCss('/* 中央寄せ */ .niwa {\n  display :  FLEX ;\n}');
    expect(issues).toEqual([]);
    expect(rules[0]?.declarations).toEqual([{ property: 'display', value: 'flex' }]);
  });

  it('閉じていないブロックは問題として報告する', () => {
    const { issues } = parseCss('.niwa { display: flex;');
    expect(issues.length).toBe(1);
    expect(issues[0]?.reason).toContain('閉じていない');
  });

  it('コロンのない宣言は問題になる', () => {
    const { rules, issues } = parseCss('.niwa { display flex; }');
    expect(rules[0]?.declarations).toEqual([]);
    expect(issues[0]?.reason).toContain('プロパティ: 値');
  });

  it('ブロック外の記述は問題になる', () => {
    const { issues } = parseCss('display: flex; .niwa { gap: 8px; }');
    expect(issues.some((issue) => issue.reason.includes('ブロックの外'))).toBe(true);
  });
});

describe('validate', () => {
  const allowed = ['.niwa', '.ishi-1'];

  it('許可リストにあるプロパティと値だけを通す', () => {
    const { rules } = parseCss('.niwa { display: grid; grid-template-columns: repeat(3, 1fr); }');
    const checked = validate(rules, allowed);
    expect(checked.issues).toEqual([]);
    expect(checked.rules[0]?.declarations.length).toBe(2);
  });

  it('レイアウト以外のプロパティを拒否する', () => {
    const { rules } = parseCss('.niwa { position: absolute; margin: 100px; display: flex; }');
    const checked = validate(rules, allowed);
    expect(checked.issues.length).toBe(2);
    expect(checked.issues[0]?.reason).toContain('使えません');
    expect(checked.rules[0]?.declarations).toEqual([{ property: 'display', value: 'flex' }]);
  });

  it('未対応の値を拒否する', () => {
    const { rules } = parseCss('.niwa { display: table; justify-content: middle; }');
    const checked = validate(rules, allowed);
    expect(checked.issues.length).toBe(2);
    expect(checked.rules).toEqual([]);
  });

  it('url()などの関数の紛れ込みを拒否する', () => {
    const { rules } = parseCss('.niwa { grid-template-columns: url(https://evil.example) 1fr; }');
    const checked = validate(rules, allowed);
    expect(checked.rules).toEqual([]);
    expect(checked.issues[0]?.reason).toContain('grid-template-columns');
  });

  it('対象外セレクタを拒否する', () => {
    const { rules } = parseCss('body { display: flex; } .ishi-1 { order: 1; }');
    const checked = validate(rules, allowed);
    expect(checked.issues[0]?.reason).toContain('書けるセレクタ');
    expect(checked.rules.length).toBe(1);
  });

  it('grid-template-areasの引用符付きの値を通す', () => {
    const { rules } = parseCss('.niwa { grid-template-areas: "a a b" "c d b"; }');
    const checked = validate(rules, allowed);
    expect(checked.issues).toEqual([]);
    expect(checked.rules[0]?.declarations[0]?.value).toBe('"a a b" "c d b"');
  });

  it('grid-columnのspan指定と行番号指定を通す', () => {
    const { rules } = parseCss('.ishi-1 { grid-column: span 2; grid-row: 1 / 3; }');
    const checked = validate(rules, allowed);
    expect(checked.issues).toEqual([]);
    expect(checked.rules[0]?.declarations.length).toBe(2);
  });
});

describe('compile', () => {
  it('解釈と検査の問題をまとめて返す', () => {
    const result = compile('.niwa { display: flex; color: red; } はみ出し', ['.niwa']);
    expect(result.rules.length).toBe(1);
    expect(result.issues.length).toBe(2);
  });

  it('空文字列は空の結果になる', () => {
    const result = compile('', ['.niwa']);
    expect(result.rules).toEqual([]);
    expect(result.issues).toEqual([]);
  });
});
