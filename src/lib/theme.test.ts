// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { store } from './storage';
import { applyTheme, isThemeMode, loadTheme, nextTheme, THEME_LABEL } from './theme';

afterEach(() => {
  store.clear();
  document.documentElement.removeAttribute('data-theme');
});

describe('theme', () => {
  it('自動・ライト・ダークの順に巡回する', () => {
    expect(nextTheme('auto')).toBe('light');
    expect(nextTheme('light')).toBe('dark');
    expect(nextTheme('dark')).toBe('auto');
  });

  it('isThemeMode が三値だけを通す', () => {
    expect(isThemeMode('auto')).toBe(true);
    expect(isThemeMode('dark')).toBe(true);
    expect(isThemeMode('sepia')).toBe(false);
    expect(isThemeMode(null)).toBe(false);
  });

  it('ライト・ダークは data-theme 属性を立て、自動は外す', () => {
    applyTheme('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    applyTheme('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    applyTheme('auto');
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });

  it('適用したテーマを保存し、読み戻せる', () => {
    applyTheme('dark');
    expect(loadTheme()).toBe('dark');
  });

  it('未保存・不正値のときは自動を返す', () => {
    expect(loadTheme()).toBe('auto');
    store.setItem('layout-dojo:theme', 'sepia');
    expect(loadTheme()).toBe('auto');
  });

  it('すべてのモードに日本語ラベルがある', () => {
    expect(THEME_LABEL.auto).toBe('自動');
    expect(THEME_LABEL.light).toBe('ライト');
    expect(THEME_LABEL.dark).toBe('ダーク');
  });
});
