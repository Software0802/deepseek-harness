/** Settings-row dictionaries for the Sakura theme. */

/** Simplified Chinese dictionary (the key-set source of truth). */
export const zh = {
  'title': '二次元主题',
  'description': '选择角色配色，并开关立绘、贴纸和花瓣动效。',
  'preset.zero-two': '02 · 樱花',
  'preset.emilia': '爱蜜莉雅 · 银霜',
  'preset.mai': '樱岛麻衣 · 暮色',
  'preset.asuna': '亚丝娜 · 闪光',
  'art': '对话区角色立绘',
  'sticker': '侧栏看板娘',
  'petals': '花瓣飘落',
  'credit': '配色与角色素材来自 Doki Theme（MIT），角色版权归原作者所有。',
}

/** Message key in this plugin's namespace. */
export type SakuraKey = keyof typeof zh

/** English dictionary. */
export const en: Record<SakuraKey, string> = {
  'title': 'Anime theme',
  'description': 'Pick a character palette and toggle the art, sticker, and petal effects.',
  'preset.zero-two': 'Zero Two · Sakura',
  'preset.emilia': 'Emilia · Frost',
  'preset.mai': 'Mai Sakurajima · Dusk',
  'preset.asuna': 'Asuna · Flash',
  'art': 'Character art behind conversations',
  'sticker': 'Sidebar sticker',
  'petals': 'Falling petals',
  'credit': 'Palettes and character art from Doki Theme (MIT); characters belong to their rights holders.',
}

/** Japanese dictionary. */
export const ja: Record<SakuraKey, string> = {
  'title': 'アニメテーマ',
  'description': 'キャラクターの配色を選び、イラスト・ステッカー・花びらの演出を切り替えます。',
  'preset.zero-two': 'ゼロツー · 桜',
  'preset.emilia': 'エミリア · 銀霜',
  'preset.mai': '桜島麻衣 · 夕暮れ',
  'preset.asuna': 'アスナ · 閃光',
  'art': '会話の背景イラスト',
  'sticker': 'サイドバーのステッカー',
  'petals': '花びらの舞い',
  'credit': '配色とキャラクター素材は Doki Theme（MIT）より。キャラクターの権利は各権利者に帰属します。',
}

/** Spanish dictionary. */
export const es: Record<SakuraKey, string> = {
  'title': 'Tema anime',
  'description': 'Elige la paleta de un personaje y activa o desactiva la ilustración, la pegatina y los pétalos.',
  'preset.zero-two': 'Zero Two · Sakura',
  'preset.emilia': 'Emilia · Escarcha',
  'preset.mai': 'Mai Sakurajima · Ocaso',
  'preset.asuna': 'Asuna · Destello',
  'art': 'Ilustración tras las conversaciones',
  'sticker': 'Pegatina de la barra lateral',
  'petals': 'Pétalos que caen',
  'credit': 'Paletas e ilustraciones de Doki Theme (MIT); los personajes pertenecen a sus titulares.',
}

/** French dictionary. */
export const fr: Record<SakuraKey, string> = {
  'title': 'Thème anime',
  'description': 'Choisissez la palette d’un personnage et activez l’illustration, l’autocollant et les pétales.',
  'preset.zero-two': 'Zero Two · Sakura',
  'preset.emilia': 'Emilia · Givre',
  'preset.mai': 'Mai Sakurajima · Crépuscule',
  'preset.asuna': 'Asuna · Éclair',
  'art': 'Illustration derrière les conversations',
  'sticker': 'Autocollant de la barre latérale',
  'petals': 'Pétales qui tombent',
  'credit': 'Palettes et illustrations issues de Doki Theme (MIT) ; les personnages appartiennent à leurs ayants droit.',
}

/** German dictionary. */
export const de: Record<SakuraKey, string> = {
  'title': 'Anime-Design',
  'description': 'Wähle eine Figurenpalette und schalte Illustration, Sticker und Blütenblätter ein oder aus.',
  'preset.zero-two': 'Zero Two · Sakura',
  'preset.emilia': 'Emilia · Frost',
  'preset.mai': 'Mai Sakurajima · Dämmerung',
  'preset.asuna': 'Asuna · Blitz',
  'art': 'Illustration hinter Unterhaltungen',
  'sticker': 'Sticker in der Seitenleiste',
  'petals': 'Fallende Blütenblätter',
  'credit': 'Paletten und Figuren aus Doki Theme (MIT); die Figuren gehören ihren Rechteinhabern.',
}

/** Russian dictionary. */
export const ru: Record<SakuraKey, string> = {
  'title': 'Аниме-тема',
  'description': 'Выберите палитру персонажа и включите или отключите арт, стикер и лепестки.',
  'preset.zero-two': 'Zero Two · Сакура',
  'preset.emilia': 'Эмилия · Иней',
  'preset.mai': 'Май Сакурадзима · Сумерки',
  'preset.asuna': 'Асуна · Вспышка',
  'art': 'Арт за диалогами',
  'sticker': 'Стикер на боковой панели',
  'petals': 'Падающие лепестки',
  'credit': 'Палитры и арт из Doki Theme (MIT); права на персонажей принадлежат их владельцам.',
}

/** Portuguese dictionary. */
export const pt: Record<SakuraKey, string> = {
  'title': 'Tema anime',
  'description': 'Escolha a paleta de um personagem e ative ou desative a ilustração, o adesivo e as pétalas.',
  'preset.zero-two': 'Zero Two · Sakura',
  'preset.emilia': 'Emilia · Geada',
  'preset.mai': 'Mai Sakurajima · Crepúsculo',
  'preset.asuna': 'Asuna · Lampejo',
  'art': 'Ilustração atrás das conversas',
  'sticker': 'Adesivo da barra lateral',
  'petals': 'Pétalas caindo',
  'credit': 'Paletas e ilustrações do Doki Theme (MIT); os personagens pertencem aos seus detentores.',
}
