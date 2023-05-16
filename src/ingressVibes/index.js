import { EUI, Elements, Events, GetLocale, Modifiers, Nodes, Proposed, SBG, t } from '../constants'
import styles from './styles.css'

const applyTranslations = (target) => {
  let translations = JSON.parse(localStorage.getItem(target))

  if (!translations) {
    return
  }

  translations.buttons.discover = t('discover')
  translations.buttons.deploy = t('deploy')
  translations.buttons.repair = t('repair')
  translations.buttons.draw = t('draw')

  localStorage.setItem(target, JSON.stringify(translations))
}

export default function AddIngressVibes() {
  const i18next_main = `i18next_${GetLocale()}-main`
  const input = document.createElement(Elements.Input)
  const settings = Nodes.SettingSections.at(0)
  if (settings) {
    const title = document.createElement(Elements.Span)
    title.innerText = t('ingressStyle')

    input.type = Elements.CheckBox
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
    localStorage.setItem(EUI.IngressTheme, 1)
    input.checked = true
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
  style.innerHTML = styles

  if (localStorage.getItem(EUI.IngressTheme) == 1) {
    document.head.appendChild(style)
    input.checked = true
    applyTranslations(i18next_main)
  }

  input.addEventListener(Events.onChange, (event) => {
    if (event.target.checked) {
      document.head.appendChild(style)
      localStorage.setItem(EUI.IngressTheme, 1)
      applyTranslations(i18next_main)
      location.reload()
    }
    else {
      style.remove()
      localStorage.setItem(EUI.IngressTheme, 0)
      localStorage.removeItem(i18next_main)
      location.reload()
    }
  })


}
