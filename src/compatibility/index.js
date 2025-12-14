import { ToggleSettingsItem } from '../components/settingsItem'
import { Elements, Events, EUI, Nodes, t, Translations, IsPrivate } from '../constants'
import { Logger } from '../utils'
import styles from './styles.min.css'

export function Compatibility () {
  function Firefox() {
    // Fix score popup (can't be closed on FF)
    Nodes.GetSelector('.score.popup .score__header').addEventListener(Events.onClick, () => Nodes.ScorePopup.classList.toggle('hidden'))
  }

  function Portrait() {
    const portraitScreen = document.createElement(Elements.Div)
    portraitScreen.classList.add('force_portrait')
    portraitScreen.dataset.text = `↻ ${t(Translations.portraitScreen)}`
    document.body.appendChild(portraitScreen)
  }

  const style = document.createElement(Elements.Style)
  style.dataset.id = EUI.PerformanceMode
  style.innerHTML = styles

  const disabled = 'disabled'
  function PerformanceMode () {
    const globalSettings = Nodes.SettingSections.at(0)
    if (!globalSettings) {
      return
    }

    const Enable = async () => {
      if (!localStorage.getItem(EUI.PerformanceMode)) {
        alert(t(Translations.perfModeMessage))
      }

      localStorage.setItem(EUI.PerformanceMode, 1)
      document.head.append(style)
      Nodes.GetSelector(`input[data-setting='${EUI.Animations}']`)?.setAttribute(disabled, true)
      Nodes.GetId(EUI.LinksOpacity)?.setAttribute(disabled, true)
    }

    const Disable = () => {
      localStorage.setItem(EUI.PerformanceMode, 0)
      style.remove()
      Nodes.GetSelector(`input[data-setting='${EUI.Animations}']`)?.toggleAttribute(disabled)
      Nodes.GetId(EUI.LinksOpacity)?.toggleAttribute(disabled)
    }

    const toggle = ToggleSettingsItem(t(Translations.perfModeTitle), Enable, Disable, EUI.PerformanceMode)
    globalSettings.appendChild(toggle)
  }

  function CUI() {
    // Move clear cache button after layers list
    const clearCacheButton = document.querySelector('.layers-config__buttons').querySelector('button:not(#layers-config__save):not(.popup-close)')
    if (clearCacheButton) {
      const objects = document.querySelector('h4.layers-config__subheader[data-i18n="layers.objects.header"]')
      objects.before(clearCacheButton)
      clearCacheButton.classList.add('cui-clear-cache-button')
    }

    // Move reload button for webview in a compact mode
    if (localStorage.getItem(EUI.CompactView) == 1 && !IsPrivate()) {
      const reloadButton = document.querySelector('.game-menu button.fa-solid-rotate')
      if (reloadButton) {
        Nodes.Layers.after(reloadButton)
      }
    }

    // Precise colors for non-Safari
    const colorInput = Nodes.GetSelector('input[name="mapFilters_brandingColor"]')
    if (colorInput) {
      const textInput = document.createElement(Elements.Input)
      textInput.type = 'text'
      textInput.style.cssText = `
        width: 100px;
        margin: 0 auto;
        padding: 5px;
        border: none!important;
        border-radius: var(--radius5);
        color: var(--sbgcui-branding-color, var(--selection));
        background: var(--ol-subtle-background-color, #7777);
        text-transform: uppercase;
        text-align: center;
        font-weight: bolder;
      `
      textInput.value = colorInput.value.replace('#', '')
      colorInput.after(textInput)
      textInput.addEventListener(Events.onInput, (event) => {
        if (event.target.value && /[0-9a-fA-F]{6}/.test(event.target.value)) {
          colorInput.value = `#${event.target.value}`
        }
      })
    }

    const brightnessToggle = document.querySelector('input[name="mapFilters_brightness"]')
    if (brightnessToggle) {
      brightnessToggle.step = '0.1'
      brightnessToggle.max = '3'
    }
  }

  function PWA() {
    history.pushState({page: '1'}, 'game', '#_game')
    window.addEventListener('popstate', () => {
      let currentPopup = Array.from(document.querySelectorAll('.popup:not(.hidden)')).at(-1)
      if (currentPopup) {
        currentPopup.classList.add('hidden')
      }
    })
    const ids = ['ops', 'settings', 'self-info__name', 'notifs-menu', 'leaderboard', 'score', 'layers']
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i]
      const element = document.getElementById(id)
      if (!element) {
        Logger.error(`Element #${id} not found!`)
        continue
      }
      element.addEventListener(Events.onClick, () => {
        history.pushState({page: '1'}, id, `#_${id}`)
      })
    }
  }

  Firefox()
  Portrait()
  PerformanceMode()
  CUI()
  setTimeout(() => PWA(), 1000)
}