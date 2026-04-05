import { version } from '../../package.json'
import { getUserAgentData } from '../utils/userAgentData'
import { getGPU } from '../utils/gpu'
import { getSbgSettings } from '../utils'

export const Backend = {
  Host: 'https://sbg-settings.egorantonov.workers.dev',
  Endpoints: {
    Sync: '/sync',
    Donate: '/donate'
  },
  DonationService: 'https://bd.nevalink.net:4446/?amount={amount}&user=59728'
}

export const SBG = {
  OutboundLinksLimit: 30,
  DefaultCloseButtonText: '[x]',
  CompatibleVersion: '0.6.0',
  Settings: 'settings',
  DefaultLang: 'en',
  GooglePhoto: 'https://lh3.googleusercontent.com/',
  Headers: {
    FLAVOR: 'x-sbg-flavor',
    VERSION: 'x-sbg-version'
  }
}

export const EUI = {
  Id: 'eui',
  UserId: 'eui-user-id',
  CloseButtonText: ' ✕ ',
  Incompatibility: 'eui-incompatibility',
  Version: version,
  LinksOpacity: 'eui-links-opacity',
  RegionsOpacity: 'eui-regions-opacity',
  HighContrast: 'eui-high-contrast',
  Animations: 'eui-animations',
  CompactView: 'eui-compact-view',
  Sort: 'eui-sort',
  Search: 'eui-search',
  CustomTheme: 'eui-ingress-theme',
  CommonStyles: 'eui-common-styles',
  ImmediateStyles: 'eui-immediate-styles',
  Online: 'eui-online',
  Connection: 'eui-connection',
  CloudSync: '__eui-cloud-sync',
  LastSynced: 'eui-cloud-sync',
  SettingsCache: '__settings-cache',
  PerformanceMode: 'eui-perf-mode',
  Actions: 'eui-actions',
  ActionsCurrent: '__eui-actions-current',
  ActionsLog: '__eui-actions-log',
  Avatar: 'eui-avatar',
  Progress: 'eui-progress',
  ProgressText: 'eui-progress-text',
  ProgressStepsCount: '__eui-progress-steps-count',
  ProgressStatus: 'eui-progress-status',
  SpeedoMeter: 'eui-speedometer',
  WakeLock: 'eui-wakelock',
  Donate: 'eui-donate',
  LowBattery: 20,
  Vibes: 'eui-vibes',
  Console: 'eui-console',
  ImagesCache: 'eui-images',
  SettingItem: 'eui-setting-item',
  LiquidGlass: 'eui-liquid-glass',
  Hide: 'eui-hide',
  Team: '__eui-team' // user can flip color
}

export const Events = {
  onClick: 'click',
  onChange: 'change',
  onLoad: 'load',
  onInput: 'input',
  onTouchStart: 'touchstart',
  onTouchMove: 'touchmove',
  onTouchEnd: 'touchend',
  onBackButton: 'backbutton',
  onScroll: 'scroll',
  onProfileStatsChanged: 'profileStatsChanged',
  onVisibilityChange: 'visibilitychange',
  onRelease: 'release',
  onChargingChange: 'chargingchange',
  onLevelChange: 'levelchange',
  onChargingTimeChange: 'chargingtimechange',
  onDischargingTimeChange: 'dischargingtimechange',
  onBeforeUnload: 'beforeunload'
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
  Link: 'a',
  Canvas: 'canvas'
}

export const Proposed = '-proposed'

class LazyClientData {
  GetProp(id, callback) {
    const prop = id
    if (!this[prop]) {
      let result
      try {
        result = callback()
      }
      catch (error) {
        console.log(`Error getting '${id}' client data: ${error.message}`)
        console.error(error)
      }
      this[prop] = result
    }
    return this[prop]
  }
  get GetUserAgentData() {
    return this.GetProp('userAgentData', getUserAgentData)
  }
  get GetGPU() {
    return this.GetProp('gpu', getGPU)
  }
}

export const ClientData = new LazyClientData()

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
  get PrName() { return this.GetId('pr-name')}
  get Leaderboard() { return this.GetId('leaderboard') }
  get ToggleFollow() { return this.GetId('toggle-follow-btn') }
  get InfoPopupClose() { return this.GetSelector('div.info.popup button.popup-close') }
  get InventoryPopupClose() { return this.GetId('inventory__close') }
  get SettingsPopupClose() { return this.GetSelector('div.settings.popup button.popup-close') }

  get InfoPopup() { return this.GetSelector('.info.popup') }
  get ScorePopup() { return this.GetSelector('.score.popup') }
  get ProfilePopup() { return this.GetSelector('.profile.popup') }
  get InventoryPopup() { return this.GetSelector('.inventory.popup')}
  get ProfileStatsContainer() { return this.GetSelector('.pr-stats') }
  get InventoryContent() { return this.GetSelector('.inventory__content') }
  get BottomContainer() { return this.GetSelector('div.bottom-container') }
  get BottomLeftContainer() { return this.GetSelector('div.bottomleft-container') }

  get SettingSections() { return this.GetSelectorAll('.settings-section') }
  get ProfileStats() { return Array.from(document.querySelectorAll('.pr-stat')) } // no cache needed
}

export const Nodes = new LazyNodes()

export const IsPrivate = () => document.getElementById('self-info__name').innerText === String.fromCharCode(101, 121, 101, 109, 97, 120)
export const IsWebView = () => window.navigator.userAgent.toLowerCase().includes('wv')
const cuiElements = () => window.document.querySelectorAll('*[class^="sbgcui"]')
const lastElement = () => window.document.querySelector('.sbgcui_inventory__ma-shortcuts')
const svpElements = () => window.document.querySelectorAll('*[class^="svp-"]')
export const CUI = {
  Detected: () => window.cuiStatus || window.TeamColors || window.Catalysers || window.attack_slider || window.deploy_slider || window.draw_slider || window.requestEntities || window.cl || window.onerror || cuiElements()?.length, // || getSbgSettings()?.base // нестабильно, тк остаётся в localStorage
  Initializing: () => window.cuiStatus == 'initializing',
  Loaded: () => window.cuiStatus == 'loaded',// || window.TeamColors && window.Catalysers && window.attack_slider && window.deploy_slider && window.draw_slider && window.requestEntities && cuiElements()?.length && lastElement() && !document.querySelector('button.ol-rotate-reset'),
  Error: () => window.cuiStatus == 'error'
}
export const SVP = {
  Detected: () => svpElements()?.length
}

/**
 * 
 * @param {Number} ms - Sleep time in ms 
 * @returns 
 */
export const Sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export const GetLocale = () => {
  let lang = getSbgSettings()?.lang
  !!lang && lang === 'sys' && (lang = navigator.language?.slice(0,2) ?? SBG.DefaultLang)
  return lang ?? SBG.DefaultLang
}

const NumberFormat = Intl.NumberFormat(GetLocale()).formatToParts(1234.56)
export const Translations = {
  incompatibility: {
    en: 'Enhanced UI may be incompatible with current version of SBG',
    ru: 'Enhanced UI может быть несовместим с текущей версией игры',
  },
  portraitScreen: {
    en: 'Please, rotate screen to portrait mode',
    ru: 'Переверните экран в вертикальное положение',
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
  highContrastDesc: {
    en: 'Increase contrast in bright lighting or for dark themes with OLED displays',
    ru: 'Повысить контрастность при ярком освещении или для тёмной темы и OLED экранов',
  },
  linesOpacity: {
    en: 'Lines opacity',
    ru: 'Прозрачность линий',
  },
  regionsOpacity: {
    en: 'Regions opacity',
    ru: 'Прозрачность регионов',
  },
  animations: {
    en: 'Animations',
    ru: 'Анимации',
  },
  animationsDesc: {
    en: 'Enable windows and elements animations',
    ru: 'Включить анимации окон и элементов',
  },
  compactView: {
    en: 'Compact View',
    ru: 'Компактный режим'
  },
  compactViewDesc: {
    en: 'Use icons instead of labels',
    ru: 'Использовать иконки вместо текста'
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
    // en: '.',
    // ru: ','
    [GetLocale()]: NumberFormat.find(x => x.type==='decimal').value ?? '.'
  },
  groupSeparator: {
    // en: ',',
    // ru: ' '
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
  fields: {
    en: 'Fields',
    ru: 'Поля'
  },
  importExport: {
    en: 'Import/export settings',
    ru: 'Импорт/экспорт настроек'
  },
  importExportDesc: {
    en: 'Apply or save current game settings and EUI add-on',
    ru: 'Применить или сохранить текущие настройки игры и надстройки EUI'
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
  themeMono: {
    en: 'Mono',
    ru: 'Моно'
  },
  themeEUI: {
    en: 'Enhanced UI',
    ru: 'Enhanced UI'
  },
  themeArcade: {
    en: 'Arcade',
    ru: 'Аркада'
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
  sortAnotherUselessInformation: {
    en: 'By guard',
    ru: 'По гарду'
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
  connectionDesc: {
    en: 'Check your network connectivity',
    ru: 'Проверьте свое сетевое подключение'
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
    en: 'Settings restored. Reload to apply them right now?',
    ru: 'Настройки восстановлены. Перезагрузить, чтобы применить их?'
  },
  perfModeTitle: {
    en: 'Performance mode',
    ru: 'Режим производительности'
  },
  perfModeDesc: {
    en: 'Reduce the device load',
    ru: 'Уменьшить нагрузку на устройство'
  },
  perfModeMessage: {
    en: 'Map filters, animations and blur will be disabled.\r\nUse "Carto" layer for dark theme map.',
    ru: 'Будут принудительно отключены:\r\n• Фильтры карты\r\n• Размытия элементов\r\n• Анимации\r\nДля тёмной темы карты используйте подложку "Carto".'
  },
  actions: {
    en: 'Actions',
    ru: 'Действия'
  },
  showActions: {
    en: 'Show actions 🅰',
    ru: 'Показывать действия 🅰'
  },
  actionsCapturedMessage: {
    en: 'owned by ',
    ru: 'принадлежит '
  },
  actionsNeutralizedMessage: {
    en: 'lost owner',
    ru: 'потеряла владельца'
  },
  actionsDiffMessage: {
    en: 'Some point changed ownership: ',
    ru: 'Несколько точек сменили владельца: '
  },
  actionsNeutralizedPrefix: {
    en: 'was ',
    ru: 'была '
  },
  actionsNeutralized: {
    en: 'neutralized',
    ru: 'нейтрализована'
  },
  actionsCapturedReplacer: {
    en: 'owned',
    ru: 'принадлежит'
  },
  donations: {
    en: 'Donations',
    ru: 'Донаты'
  },
  donationsDesc: {
    en: 'Send some money to support add-on development',
    ru: 'Отправить донат на поддержку скриптов'
  },
  donate: {
    en: 'Donate',
    ru: 'Задонатить'
  },
  donateDialogue: {
    en: 'Donate amount, ₽',
    ru: 'Введите сумма доната, ₽'
  },
  donateError: {
    en: 'Unexpected error during donation, try again later.',
    ru: 'Неожиданная ошибка в процессе доната, попробуйте позже.'
  },
  cuiOnMap: {
    en: 'On map',
    ru: 'На карте'
  },
  cuiRoute: {
    en: 'Route',
    ru: 'Маршрут'
  },
  githubCheckingUpdates: {
    en: 'Checking updates...',
    ru: 'Проверка обновлений...'
  },
  githubUnavailable: {
    en: 'Github API is unavailable. Possible network issue.',
    ru: 'Github API недоступен. Возможная проблема c сетью.'
  },
  clearStore: {
    en: 'Images cache',
    ru: 'Кэш картинок'
  },
  clearStoreDesc: {
    en: 'Clear point images local cache',
    ru: 'Очистить локальный кэш картинок точек'
  },
  clearStoreAction: {
    en: 'Clear',
    ru: 'Очистить'
  },
  storeCleared: {
    en: 'Store "{0}" has been cleared',
    ru: 'Хранилище "{0}" очищено'
  },
  sharePointButton: {
    en: 'Share',
    ru: 'Поделиться'
  },
  copyPosPointButton: {
    en: 'Copy position',
    ru: 'Координаты'
  },
  featureFailed: {
    en: 'feature failed. Reason:',
    ru: 'функции неуспешна. Причина:'
  },
  progress: {
    en: 'Loading...',
    ru: 'Загрузка...'
  },
  progressCui: {
    en: 'Waiting for CUI',
    ru: 'Ждём загрузку CUI'
  },
  progressCuiFailed: {
    en: 'CUI seems to be failed! \r\nConfirm to reload or cancel to wait if connection is weak.',
    ru: 'Похоже, CUI не удалось загрузить! \r\nПодтвердите для перезагрузки или отмените для ожидания загрузки.'
  },
  progressCuiFailedReload: {
    en: 'CUI seems to be failed! Force reloading...',
    ru: 'Похоже, CUI не работает! Принудительная перезагрузка...'
  },
  speedoMeter: {
    en: 'Show speed',
    ru: 'Показывать скорость'
  },
  wakeLock: {
    en: 'Keep screen always on',
    ru: 'Не выключать экран'
  },
  wakeLockDesc: {
    en: 'Depends on the device\'s power saving settings',
    ru: 'Настройка зависит от параметров энергосбережения устройства'
  },
  batteryExtraLow: {
    en: 'Attention! 🪫 {0}% battery remaining. It is recommended to enable performance mode',
    ru: 'Внимание! 🪫 Осталось {0}% заряда батареи. Рекомендуется включить режим производительности.'
  },
  batteryLow: {
    en: 'Attention! 🪫 {0}% battery remaining. The "Keep screen always on" setting will be disabled.',
    ru: 'Внимание! 🪫 Осталось {0}% заряда батареи. Настройка "Не выключать экран" будет отключена.'
  },
  batteryHighOrCharging: {
    en: '🔋 The "Keep screen always on" setting is activated.',
    ru: '🔋 Настройка "Не выключать экран" активирована.'
  },
  winterVibes: {
    en: 'Winter vibes ❄',
    ru: 'Зимнее настроение ❄'
  },
  liquidGlass: {
    en: 'Liquid Glass',
    ru: 'Жидкое стекло'
  },
  liquidGlassDesc: {
    en: 'Yes, just like in iOS',
    ru: 'Да-да, прямо как в iOS'
  }
}

export function t(key, params = []) {

  if (typeof(key) === 'object') {
    let result = key[GetLocale()] ?? key[SBG.DefaultLang] ?? '[Missing translation]'
    if (params && Array.isArray(params) && params.length) {
      for (let i = 0; i < params.length; i++) {
        result = result.replace(`{${i}}`, params[i])
      }
    }
    return result
  }

  // todo: remove after refactoring
  const entry = Translations[key]

  if (!entry) {
    console.log(`No translations for '${key}' entry`)
    return key
  }

  let translation = entry[GetLocale()] ?? entry[SBG.DefaultLang] ?? key
  if (params && Array.isArray(params) && params.length) {
    for (let i = 0; i < params.length; i++) {
      translation.replace(`{${i}}`, params[i])
    }
  }

  return translation
}

export const Themes = {
  Default: t(Translations.themeDefault),
  Ingress: t(Translations.themeIngress),
  Prime: t(Translations.themePrime),
  Mono: t(Translations.themeMono),
  EUI: t(Translations.themeEUI),
  Arcade: t(Translations.themeArcade)
}