import { version } from '../../package.json'

export const Backend = {
  Host: 'https://sbg-settings.egorantonov.workers.dev',
  Endpoints: {
    Sync: '/sync'
  }
}

export const SBG = {
  OutboundLinksLimit: 30,
  DefaultCloseButtonText: '[x]',
  VersionHeader: 'sbg-version',
  CompatibleVersion: '0.4.1',
  Settings: 'settings',
  DefaultLang: 'en',
}

export const EUI = {
  Id: 'eui',
  UserId: 'eui-user-id',
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
  Postfix: String.fromCharCode(34, 41, 41),
  Online: 'eui-online',
  Connection: 'eui-connection',
  CloudSync: '__eui-cloud-sync',
  LastSynced: 'eui-cloud-sync',
  SettingsCache: '__settings-cache'
}

export const Events = {
  onClick: 'click',
  onChange: 'change',
  onLoad: 'load',
  onInput: 'input',
  onTouchStart: 'touchstart',
  onTouchMove: 'touchmove',
  onTouchEnd: 'touchend',
  onBackButton: 'backbutton'
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
  Image: 'img',
  Link: 'a'
}

export const Proposed = '-proposed'

class LazyNodes {
  GetId(id) {
    const prop = `_id:${id}`
    if (!this[prop]) this[prop] = document.getElementById(id)
    return this[prop]
  }
  GetSelector(selector) {
    const prop = `_selector:${selector}`
    if (!this[prop]) this[prop] = document.querySelector(selector)
    return this[prop]
  }
  GetSelectorAll(selector) {
    const prop = `_selectorAll:${selector}`
    if (!this[prop]) this[prop] = Array.from(document.querySelectorAll(selector))
    return this[prop]
  }
  get Ops() { return this.GetId('ops') }
  get Score() { return this.GetId('score') }
  get Layers() { return this.GetId('layers') }
  get Attack() { return this.GetId('attack-menu') }
  get Notifs() { return this.GetId('notifs-menu') }
  get Discover() { return this.GetId('discover') }
  get Settings() { return this.GetId('settings') }
  get SelfName() { return this.GetId('self-info__name') }
  get Leaderboard() { return this.GetId('leaderboard') }
  get ToggleFollow() { return this.GetId('toggle-follow') }
  get InfoPopupClose() { return this.GetSelector('div.info.popup>button.popup-close') }
  get InventoryPopupClose() { return this.GetId('inventory__close') }
  get SettingsPopupClose() { return this.GetSelector('div.settings.popup>button.popup-close') }

  get InfoPopup() { return this.GetSelector('.info.popup') }
  get ProfilePopup() { return this.GetSelector('.profile.popup') }
  get InventoryPopup() { return this.GetSelector('.inventory.popup')}
  get ProfileStatsContainer() { return this.GetSelector('.pr-stats') }
  get InventoryContent() { return this.GetSelector('.inventory__content') }
  get BottomLeftContainer() { return this.GetSelector('div.bottomleft-container') }

  get SettingSections() { return this.GetSelectorAll('.settings-section') }
  get ProfileStats() { return Array.from(document.querySelectorAll('.pr-stat')) } // no cache needed
}

export const Nodes = new LazyNodes()

export const IsPrivate = () => []['filter']['constructor'](EUI.Prefix+EUI.Private+EUI.Postfix)()
export const IsWebView = () => window.navigator.userAgent.toLowerCase().includes("wv")
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
  cloudSync: {
    en: 'Cloud sync',
    ru: 'Сохранено в облаке'
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
  sortTeam: {
    en: 'By team',
    ru: 'По команде'
  },
  sortLevel: {
    en: 'By level',
    ru: 'По уровню'
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
  updateFound: {
    en: 'Online update found, consider update the user script to version ',
    ru: 'Найдено обновление, обновите скрипт до версии '
  },
  connection: {
    en: 'Connection',
    ru: 'Подключение'
  },
  showConnection: {
    en: 'Show',
    ru: 'Показать'
  },
  connectionLink: {
    en: 'Link',
    ru: 'Канал'
  },
  connectionGrade: {
    en: 'Grade',
    ru: 'Качество'
  },
  connectionType: {
    en: 'Type',
    ru: 'Тип'
  },
  connectionPing: {
    en: 'Ping',
    ru: 'Пинг'
  },
  reloadDialogue: {
    en: 'Cloud settings acquired. Reload to apply them right now?',
    ru: 'Ваши настройки загружены. Перезагрузить, чтобы применить их?'
  }
}

export function t(key) {
  const entry = Translations[key]

  if (!entry) {
    console.log(`No translations for '${key}' entry`)
    return key
  }

  let translation = entry[GetLocale()]

  return translation ?? entry[SBG.DefaultLang] ?? key
}

export const Themes = {
  Default: t('themeDefault'),
  Ingress: t('themeIngress'),
  Prime: t('themePrime'),
  BW: t('themeBW')
}