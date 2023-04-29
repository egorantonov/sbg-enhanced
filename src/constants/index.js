export const SBG = {
  OutboundLinksLimit: 20,
  DefaultCloseButtonText: '[x]',
  VersionHeader: 'sbg-version',
  CompatibleVersion: '0.2.9',
  Settings: 'settings',
  DefaultLang: 'en',
}

export const EUI = {
  CloseButtonText: ' ✕ ',
  Incompatibility: 'eui-incompatibility',
  Version: '1.6.0',
  LinksOpacity: 'eui-links-opacity',
  HighContrast: 'eui-high-contrast',
  Animations: 'eui-animations',
  Sort: 'eui-sort',
  Search: 'eui-search',
  IngressTheme: 'eui-ingress-theme',
  CommonStyles: 'eui-common-styles'
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
  Span: 'span',
  Div: 'div',
  Label: 'label',
  Style: 'style',
  CheckBox: 'checkbox',
}

export const Proposed = '-proposed'

export const Nodes = {
  InfoPopup: document.querySelector('.info.popup'),
  Discover: document.getElementById('discover'),

  ProfilePopup: document.querySelector('.profile.popup'),
  ProfileStats: document.querySelector('.pr-stats'),

  Ops: document.getElementById('ops'),
  InventoryPopupClose: document.getElementById('inventory__close'),
  InventoryContent: document.querySelector('.inventory__content'),

  SettingSections: Array.from(document.querySelectorAll('.settings-section')),
}

export const Sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const Locale = JSON.parse(localStorage.getItem(SBG.Settings))?.lang ?? SBG.DefaultLang
const Translations = {
  incompatibility: {
    en: 'Enhanced UI may be incompatible with current version of SBG',
    ru: 'Enhanced UI может быть несовместим с текущей версией игры',
  },
  enhancedUIVersion: {
    en: 'Enhanced UI Version',
    ru: 'Версия Enhanced UI',
  },
  ingressStyle: {
    en: 'Ingress Style',
    ru: 'Стиль Ингресс',
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
  searchRefPlaceholder: {
    en: 'Search refs',
    ru: 'Поиск рефов',
  },
  kilo: {
    en: 'k',
    ru: 'к', // TODO: update after localization released
  },
}

export const t = (key) => Translations[key][Locale] ?? Translations[key][SBG.DefaultLang]
