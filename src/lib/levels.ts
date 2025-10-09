// お題の定義。targetCssが正解レイアウト(お手本の薄い石)を作り、
// 回答はallowedSelectorsに列挙したセレクタにだけ書ける。
// 正解のCSSも回答と同じ許可リストを通る範囲で書く。

export interface Level {
  id: string;
  title: string;
  goal: string;
  hint: string;
  stones: number;
  targetCss: string;
  starter: string;
  allowedSelectors: string[];
}

export const levels: Level[] = [
  {
    id: 'yoko-narabi',
    title: '横に並べる',
    goal: '縦に積まれた3つの石を、横一列に並べ替える。',
    hint: 'display: flex を庭(.niwa)に与えると、直下の石が横方向に流れる。',
    stones: 3,
    targetCss: '.niwa { display: flex; }',
    starter: '.niwa {\n  \n}\n',
    allowedSelectors: ['.niwa'],
  },
  {
    id: 'mannaka-yose',
    title: '中央に寄せる',
    goal: '横一列のまま、3つの石を庭の左右中央に集める。',
    hint: 'justify-content は主軸方向(今は横)の寄せ方を決める。center で中央寄せ。',
    stones: 3,
    targetCss: '.niwa { display: flex; justify-content: center; }',
    starter: '.niwa {\n  display: flex;\n}\n',
    allowedSelectors: ['.niwa'],
  },
  {
    id: 'hashi-to-hashi',
    title: '両端に開く',
    goal: '3つの石を、両端の石が庭の端に付くように等間隔で開く。',
    hint: 'justify-content: space-between は最初と最後を端に置き、間を均等に空ける。',
    stones: 3,
    targetCss: '.niwa { display: flex; justify-content: space-between; }',
    starter: '.niwa {\n  display: flex;\n}\n',
    allowedSelectors: ['.niwa'],
  },
  {
    id: 'kintou-chirashi',
    title: '均等に散らす',
    goal: '4つの石を、石と石の間も両端の隙間もすべて等しくなるように散らす。',
    hint: 'justify-content: space-evenly は石の間も端の余白もすべて同じ幅にする。space-between との違いに注目。',
    stones: 4,
    targetCss: '.niwa { display: flex; justify-content: space-evenly; }',
    starter: '.niwa {\n  display: flex;\n}\n',
    allowedSelectors: ['.niwa'],
  },
  {
    id: 'do-mannaka',
    title: 'ど真ん中',
    goal: 'ひとつの石を、庭の縦横どちらから見ても中央に据える。',
    hint: '主軸は justify-content、交差軸は align-items。両方 center にする。',
    stones: 1,
    targetCss: '.niwa { display: flex; justify-content: center; align-items: center; }',
    starter: '.niwa {\n  display: flex;\n}\n',
    allowedSelectors: ['.niwa'],
  },
  {
    id: 'shita-zoroe',
    title: '下にそろえる',
    goal: '横一列の3つの石を、列ごと庭の下端にそろえる。',
    hint: 'align-items は交差軸(今は縦)の寄せ方。flex-end で行全体が下端に付く。一つだけ動かす align-self と見比べる。',
    stones: 3,
    targetCss: '.niwa { display: flex; align-items: flex-end; }',
    starter: '.niwa {\n  display: flex;\n}\n',
    allowedSelectors: ['.niwa'],
  },
  {
    id: 'tate-osame',
    title: '縦に納める',
    goal: '3つの石を縦一列に変え、列ごと左右中央へ移す。',
    hint: 'flex-direction: column で主軸が縦になる。すると align-items が横方向の寄せになる。',
    stones: 3,
    targetCss: '.niwa { display: flex; flex-direction: column; align-items: center; }',
    starter: '.niwa {\n  display: flex;\n}\n',
    allowedSelectors: ['.niwa'],
  },
  {
    id: 'orikaeshi',
    title: '折り返す',
    goal: '8つの石を、庭からはみ出さないように16pxの間隔で折り返して敷く。',
    hint: 'flex-wrap: wrap で収まらない分が次の行へ折り返す。間隔は gap で空ける。',
    stones: 8,
    targetCss: '.niwa { display: flex; flex-wrap: wrap; gap: 16px; }',
    starter: '.niwa {\n  display: flex;\n}\n',
    allowedSelectors: ['.niwa'],
  },
  {
    id: 'gyaku-nagare',
    title: '逆から流す',
    goal: '4つの石を、一の石が右端に来るよう右から左へ並べる。',
    hint: 'flex-direction: row-reverse は主軸の向きを反転し、最初の石を右端から並べる。',
    stones: 4,
    targetCss: '.niwa { display: flex; flex-direction: row-reverse; }',
    starter: '.niwa {\n  display: flex;\n}\n',
    allowedSelectors: ['.niwa'],
  },
  {
    id: 'junban-gae',
    title: '順番を変える',
    goal: '一の石だけを列の最後尾へ回す。残りの順序は変えない。',
    hint: 'order の初期値は 0。一の石(.ishi-1)にだけ正の order を与えると後ろに回る。',
    stones: 4,
    targetCss: '.niwa { display: flex; } .ishi-1 { order: 1; }',
    starter: '.niwa {\n  display: flex;\n}\n\n.ishi-1 {\n  \n}\n',
    allowedSelectors: ['.niwa', '.ishi-1'],
  },
  {
    id: 'hitori-shizumu',
    title: 'ひとり沈む',
    goal: '横一列のうち、二の石だけを庭の下端へ沈める。',
    hint: 'align-self は自分だけ交差軸の位置を変える。flex-end で下端に付く。',
    stones: 3,
    targetCss: '.niwa { display: flex; } .ishi-2 { align-self: flex-end; }',
    starter: '.niwa {\n  display: flex;\n}\n\n.ishi-2 {\n  \n}\n',
    allowedSelectors: ['.niwa', '.ishi-2'],
  },
  {
    id: 'hitotsu-futorase',
    title: '一つ太らせる',
    goal: '横一列のうち、二の石だけを余白いっぱいに広げる。残りは元の幅のまま。',
    hint: 'flex-grow: 1 を与えた石が余った幅を吸って広がる。他の石は flex-grow が 0 のままなので大きさは変わらない。',
    stones: 3,
    targetCss: '.niwa { display: flex; } .ishi-2 { flex-grow: 1; }',
    starter: '.niwa {\n  display: flex;\n}\n\n.ishi-2 {\n  \n}\n',
    allowedSelectors: ['.niwa', '.ishi-2'],
  },
  {
    id: 'masume',
    title: '升目に敷く',
    goal: '6つの石を、同じ幅の3列に分けて敷き詰める。',
    hint: 'display: grid と grid-template-columns: 1fr 1fr 1fr で等幅3列の升目ができる。',
    stones: 6,
    targetCss: '.niwa { display: grid; grid-template-columns: 1fr 1fr 1fr; }',
    starter: '.niwa {\n  \n}\n',
    allowedSelectors: ['.niwa'],
  },
  {
    id: 'kukan-wari',
    title: '区間を割る',
    goal: '8つの石を等幅4列に分け、升目の間を12px空ける。',
    hint: '同じ幅の繰り返しは repeat(4, 1fr) と書ける。隙間は gap。',
    stones: 8,
    targetCss: '.niwa { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }',
    starter: '.niwa {\n  display: grid;\n}\n',
    allowedSelectors: ['.niwa'],
  },
  {
    id: 'oo-ishi',
    title: '大石を据える',
    goal: '3列の升目で、一の石だけを2列ぶんの幅に広げる。',
    hint: 'grid-column: span 2 で、その石が2列を占める。',
    stones: 5,
    targetCss:
      '.niwa { display: grid; grid-template-columns: repeat(3, 1fr); } .ishi-1 { grid-column: span 2; }',
    starter:
      '.niwa {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n}\n\n.ishi-1 {\n  \n}\n',
    allowedSelectors: ['.niwa', '.ishi-1'],
  },
  {
    id: 'hashira',
    title: '柱を立てる',
    goal: '2列2段の升目で、一の石だけを縦2段ぶんに伸ばして柱にする。',
    hint: 'grid-row: span 2 で、その石が縦に2段を占める。横方向の grid-column: span と対になる。',
    stones: 3,
    targetCss:
      '.niwa { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; } .ishi-1 { grid-row: span 2; }',
    starter:
      '.niwa {\n  display: grid;\n  grid-template-columns: 1fr 1fr;\n  grid-template-rows: 1fr 1fr;\n}\n\n.ishi-1 {\n  \n}\n',
    allowedSelectors: ['.niwa', '.ishi-1'],
  },
  {
    id: 'ishi-gumi',
    title: '石組み',
    goal: '名前を付けた区画に4つの石を配る。一の石は上段2列ぶん、四の石は右側2段ぶんを占める。',
    hint: 'grid-template-areas で区画に名前を付け、各石の grid-area で割り当てる。',
    stones: 4,
    targetCss: [
      '.niwa {',
      '  display: grid;',
      '  grid-template-columns: 1fr 1fr 1fr;',
      '  grid-template-rows: 1fr 1fr;',
      '  grid-template-areas: "ichi ichi shi" "ni san shi";',
      '}',
      '.ishi-1 { grid-area: ichi; }',
      '.ishi-2 { grid-area: ni; }',
      '.ishi-3 { grid-area: san; }',
      '.ishi-4 { grid-area: shi; }',
    ].join('\n'),
    starter: [
      '.niwa {',
      '  display: grid;',
      '  grid-template-columns: 1fr 1fr 1fr;',
      '  grid-template-rows: 1fr 1fr;',
      '}',
      '',
      '.ishi-1 {',
      '  ',
      '}',
      '',
    ].join('\n'),
    allowedSelectors: ['.niwa', '.ishi-1', '.ishi-2', '.ishi-3', '.ishi-4'],
  },
];

export function levelByIndex(index: number): Level | undefined {
  return levels[index];
}
