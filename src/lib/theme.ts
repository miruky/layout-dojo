// テーマは「自動(OS追従)・ライト・ダーク」の3択。html の data-theme 属性で配色を切り替える。
// 自動のときは属性を外し、style.css の prefers-color-scheme に委ねる。

import { store } from './storage';

export type ThemeMode = 'auto' | 'light' | 'dark';

const THEME_KEY = 'layout-dojo:theme';
const ORDER: ThemeMode[] = ['auto', 'light', 'dark'];

export const THEME_LABEL: Record<ThemeMode, string> = {
  auto: '自動',
  light: 'ライト',
  dark: 'ダーク',
};

export function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'auto' || value === 'light' || value === 'dark';
}

export function nextTheme(mode: ThemeMode): ThemeMode {
  return ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length] as ThemeMode;
}

export function loadTheme(): ThemeMode {
  const value = store.getItem(THEME_KEY);
  return isThemeMode(value) ? value : 'auto';
}

export function applyTheme(mode: ThemeMode): void {
  const root = document.documentElement;
  if (mode === 'auto') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', mode);
  store.setItem(THEME_KEY, mode);
}
