import { EUI, Elements, Events, GetLocale, Modifiers, Nodes, Proposed, SBG, Themes, t } from '../constants'
import bwStyles from './styles/bw.css'
import ingressStyles from './styles/ingress.css'
import primeStyles from './styles/prime.css'

export default function AddColorScheme() {
  const applyTranslations = (target) => {
    let tCache = JSON.parse(localStorage.getItem(target))
  
    if (!tCache) {
      return
    }
  
    tCache.buttons.discover = t('discover')
    tCache.buttons.deploy = t('deploy')
    tCache.buttons.repair = t('repair')
    tCache.buttons.draw = t('draw')
    tCache.buttons.references.manage = ''
    tCache.buttons.references.view = ''
    tCache.info.refs = '🔑 {{count}}/100'
    tCache.info.lines = t('lines')
    tCache.info.regions = t('fields')
  
    localStorage.setItem(target, JSON.stringify(tCache))
  }
  
  const removeControlChars = (target) => {
    let tCache = JSON.parse(localStorage.getItem(target))
  
    if (!tCache) {
      return
    }
  
    tCache.buttons.references.manage = ''
    tCache.buttons.references.view = ''
  
    localStorage.setItem(target, JSON.stringify(tCache))
  }

  const ensureDarkTheme = () => {
    const themeSelect = Nodes.GetSelector('.settings select[data-setting="theme"]')
    themeSelect.value = 'dark'
    themeSelect.dispatchEvent(new Event('change'))
    themeSelect.disabled = true
  }

  const i18next_main = `i18next_${GetLocale()}-main`
  removeControlChars(i18next_main)
  // const input = document.createElement(Elements.Input)
  const input = document.createElement(Elements.Select)
  const themes = [
    {
      title: Themes.Default,
      code: 0,
      innerHTML: ''
    }, 
    {
      title: Themes.Ingress,
      code: 1,
      innerHTML: ingressStyles
    },
    {
      title: Themes.Prime,
      code: 2,
      innerHTML: primeStyles
    },
    {
      title: Themes.BW,
      code: 3,
      innerHTML: bwStyles
    }
  ]
  const settings = Nodes.SettingSections.at(0)
  if (settings) {
    const title = document.createElement(Elements.Span)
    title.innerText = t('colorScheme')
    themes.forEach(t => {
      let o = document.createElement(Elements.Option)
      o.value = t.code
      o.innerText = t.title
      input.appendChild(o)
    })
    input.dataset.setting = EUI.IngressTheme
    const label = document.createElement(Elements.Label)
    label.classList.add(Modifiers.SettingsSectionItemClassName)
    label.appendChild(title)
    label.appendChild(input)
    settings.appendChild(label)
  }

  // PROPOSAL
  const themeProposed = localStorage.getItem(`${EUI.IngressTheme}${Proposed}`)
  if (themeProposed != 1) {
    localStorage.setItem(`${EUI.IngressTheme}${Proposed}`, 1)
    localStorage.setItem(EUI.IngressTheme, themes.find(t=>t.title===Themes.Prime).code)

    document.documentElement.dataset.theme = Modifiers.Auto
    let gameSettings = JSON.parse(localStorage.getItem(SBG.Settings))

    if (gameSettings) {
      gameSettings.theme = Modifiers.Auto
      localStorage.setItem(SBG.Settings, JSON.stringify(gameSettings))
    }
  }

  // STYLES
  const style = document.createElement(Elements.Style)
  style.dataset.id = EUI.IngressTheme
  document.head.appendChild(style)

  const currentTheme = localStorage.getItem(EUI.IngressTheme)
  if (currentTheme > 0) {
    style.innerHTML = themes[+currentTheme].innerHTML
    input.selectedIndex = +currentTheme
    if (currentTheme == 1 || currentTheme == 2) {
      ensureDarkTheme()
      applyTranslations(i18next_main)
    }
  }

  input.addEventListener(Events.onChange, (event) => {
    const theme = event.target.value
    if (theme == 1 || theme == 2) {
      ensureDarkTheme()
      applyTranslations(i18next_main) 
    }
    else {
      localStorage.removeItem(i18next_main)
    }
    localStorage.setItem(EUI.IngressTheme, theme)
    style.innerHTML = themes[+theme].innerHTML
    Nodes.SettingsPopupClose.click() // sync settings with cloud
    location.reload()
  })
}