// @vitest-environment happy-dom
import { beforeAll, describe, expect, it } from 'vitest';
import { levels } from './lib/levels';

// main.ts はimport時に画面を組み立てるので、先に#appを用意してから読み込む
beforeAll(async () => {
  document.body.innerHTML = '<div id="app"></div>';
  await import('./main');
});

describe('main', () => {
  it('ヘッダー・お題一覧・庭・回答欄が組み上がる', () => {
    expect(document.querySelector('h1')?.textContent).toBe('layout-dojo');
    expect(document.querySelectorAll('.level-button').length).toBe(levels.length);
    expect(document.querySelectorAll('.stage').length).toBe(2);
    expect(document.querySelector('.css-input')).not.toBeNull();
  });

  it('最初のお題が表示され、URLハッシュに現在地が載る', () => {
    expect(document.getElementById('task-title')?.textContent).toContain(levels[0]?.title);
    expect(location.hash).toBe('#1');
    expect(document.querySelectorAll('.stage--answer .ishi').length).toBe(levels[0]?.stones);
  });

  it('お題を切り替えると本文と石の数が変わる', () => {
    const buttons = document.querySelectorAll<HTMLButtonElement>('.level-button');
    buttons[5]?.click();
    expect(document.getElementById('task-title')?.textContent).toContain(levels[5]?.title);
    expect(document.querySelectorAll('.stage--answer .ishi').length).toBe(levels[5]?.stones);
    expect(location.hash).toBe('#6');
  });

  it('許可されていないCSSを適用すると問題点が並ぶ', () => {
    const editor = document.querySelector('.css-input') as HTMLTextAreaElement;
    editor.value = '.niwa { position: absolute; }';
    (document.getElementById('apply-button') as HTMLButtonElement).click();
    expect(document.querySelectorAll('#issues li').length).toBe(1);
    expect(document.querySelector('#issues li')?.textContent).toContain('position');
  });

  it('書き直すと初期コードに戻り、問題点が消える', () => {
    (document.getElementById('retry-button') as HTMLButtonElement).click();
    const editor = document.querySelector('.css-input') as HTMLTextAreaElement;
    expect(editor.value).toBe(levels[5]?.starter);
    expect(document.querySelectorAll('#issues li').length).toBe(0);
  });
});
