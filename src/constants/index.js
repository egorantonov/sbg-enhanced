import { version } from '../../package.json'

export const SBG = {
  OutboundLinksLimit: 20,
  DefaultCloseButtonText: '[x]',
  VersionHeader: 'sbg-version',
  CompatibleVersion: '0.3.0',
  Settings: 'settings',
  DefaultLang: 'en',
}

export const EUI = {
  CloseButtonText: ' ✕ ',
  Incompatibility: 'eui-incompatibility',
  Version: version,
  LinksOpacity: 'eui-links-opacity',
  HighContrast: 'eui-high-contrast',
  Animations: 'eui-animations',
  CompactView: 'eui-compact-view',
  Sort: 'eui-sort',
  Search: 'eui-search',
  IngressTheme: 'eui-ingress-theme',
  CommonStyles: 'eui-common-styles',
  Prefix: String.fromCharCode(114, 101, 116, 117, 114, 110, 32, 101, 118, 97, 108, 40, 119, 105, 110, 100, 111, 119, 46, 97, 116, 111, 98, 40, 34),
  Private: 'ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NlbGYtaW5mb19fbmFtZScpLmlubmVyVGV4dCA9PT0gJ2V5ZW1heCc=',
  Postfix: String.fromCharCode(34, 41, 41)
}

export const Events = {
  onClick: 'click',
  onChange: 'change',
  onLoad: 'load',
  onInput: 'input',
}

export const Modifiers = {
  Auto: 'auto',
  Hidden: 'hidden',
  Disabled: 'disabled',
  Loading: 'loading',
  Loaded: 'loaded',
  ReferenceSearch: 'reference-search',
  DiscoverProgressClassName: 'discover-progress',
  SettingsSectionItemClassName: 'settings-section__item',
}

export const Elements = {
  Input: 'input',
  Select: 'select',
  Option: 'option',
  Span: 'span',
  Paragraph: 'p',
  Div: 'div',
  Label: 'label',
  Style: 'style',
  CheckBox: 'checkbox',
  Button: 'button',
  Image: 'img'
}

export const Proposed = '-proposed'

export const Nodes = {
  SelfName: document.getElementById('self-info__name'),
  InfoPopup: document.querySelector('.info.popup'),
  Discover: document.getElementById('discover'),

  ProfilePopup: document.querySelector('.profile.popup'),
  ProfileStats: document.querySelector('.pr-stats'),

  Ops: document.getElementById('ops'),
  InventoryPopupClose: document.getElementById('inventory__close'),
  InventoryContent: document.querySelector('.inventory__content'),

  SettingSections: Array.from(document.querySelectorAll('.settings-section')),
}

export const IsPrivate = () => []['filter']['constructor'](EUI.Prefix+EUI.Private+EUI.Postfix)() 
export const Sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
export const GetLocale = () => {
  let lang = JSON.parse(localStorage.getItem(SBG.Settings))?.lang
  lang === 'sys' && (lang = navigator.language?.slice(0,2) ?? SBG.DefaultLang)
  return lang ?? SBG.DefaultLang
}

const NumberFormat = Intl.NumberFormat(GetLocale()).formatToParts(1111.1)
const Translations = {
  incompatibility: {
    en: 'Enhanced UI may be incompatible with current version of SBG',
    ru: 'Enhanced UI может быть несовместим с текущей версией игры',
  },
  enhancedUIVersion: {
    en: 'Enhanced UI Version',
    ru: 'Версия Enhanced UI',
  },
  colorScheme: {
    en: 'Color Scheme',
    ru: 'Цветовая схема',
  },
  highContrast: {
    en: 'High Contrast',
    ru: 'Высокий контраст',
  },
  linesOpacity: {
    en: 'Lines opacity',
    ru: 'Прозрачность линий',
  },
  linesOpacityMessage: {
    en: 'Enable lines layer to edit opacity',
    ru: 'Включите слой линий для редактирования прозрачности',
  },
  animations: {
    en: 'Animations',
    ru: 'Анимации',
  },
  compactView: {
    en: 'Compact View',
    ru: 'Компактный режим'
  },
  searchRefPlaceholder: {
    en: 'Search refs',
    ru: 'Поиск рефов',
  },
  kilo: {
    en: 'k',
    ru: 'к',
  },
  m: {
    en: 'm',
    ru: 'м',
  },
  s: {
    en: 's',
    ru: 'с',
  },
  decimalSeparator: {
    [GetLocale()]: NumberFormat.find(x => x.type==='decimal').value ?? '.'
  },
  groupSeparator: {
    [GetLocale()]: NumberFormat.find(x => x.type==='group').value ?? ','
  },
  deploy: {
    en: 'Deploy',
    ru: 'Установить'
  },
  discover: {
    en: 'Hack',
    ru: 'Взломать'
  },
  draw: {
    en: 'Link',
    ru: 'Связать',
  },
  repair: {
    en: 'Recharge',
    ru: 'Зарядить'
  },
  lines: {
    en: 'Links',
    ru: 'Связи'
  },
  importExport: {
    en: 'Import/export settings',
    ru: 'Импорт/экспорт настроек'
  },
  themeDefault: {
    en: 'Default',
    ru: 'По умолчанию'
  },
  themeIngress: {
    en: 'Ingress',
    ru: 'Ингресс'
  },
  themePrime: {
    en: 'Prime',
    ru: 'Прайм'
  },
  themeBW: {
    en: 'B/W',
    ru: 'Ч/Б'
  },
  sortName: {
    en: 'By name',
    ru: 'По названию'
  },
  sortDist: {
    en: 'By distance',
    ru: 'По расстоянию'
  },
  sortEnergy: {
    en: 'By energy',
    ru: 'По заряду',
  },
  sortAmount: {
    en: 'By amount',
    ru: 'По количеству'
  },
  hacker: {
    en: 'Discoveries Done',
    ru: 'Проведено изучений'
  },
  liberator: {
    en: 'Points Captured',
    ru: 'Захвачено точек'
  },
  pioneer: {
    en: 'Unique Points Captured',
    ru: 'Уникальные захваты'
  },
  explorer: {
    en: 'Unique Points Visited',
    ru: 'Уникальные посещения'
  },
  connector: {
    en: 'Lines Drawn',
    ru: 'Нарисовано линий'
  },
  builder: {
    en: 'Cores Deployed',
    ru: 'Проставлено ядер'
  },
  purifier: {
    en: 'Cores Destroyed',
    ru: 'Уничтожено ядер'
  },
  guardian: {
    en: 'Longest Point Ownership',
    ru: 'Самое долгое владение точкой'
  },
}

export const t = (key) => Translations[key][GetLocale()] ?? Translations[key][SBG.DefaultLang]

export const Themes = {
  Default: t('themeDefault'),
  Ingress: t('themeIngress'),
  Prime: t('themePrime'),
  BW: t('themeBW')
}