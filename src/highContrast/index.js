import { EUI, Elements, Events, Modifiers, Nodes, t } from '../constants'
import styles from './styles.css'

export default function AddHighContrast() {
  const input = document.createElement(Elements.Input)
  const uiSettings = Nodes.SettingSections.at(1)
  if (uiSettings) {
    const title = document.createElement(Elements.Span)
    title.innerText = t('highContrast')

    input.type = Elements.CheckBox
    input.dataset.setting = EUI.HighContrast
    const label = document.createElement(Elements.Label)
    label.classList.add(Modifiers.SettingsSectionItemClassName)
    label.appendChild(title)
    label.appendChild(input)
    uiSettings.appendChild(label)
  }

  // STYLES
  const style = document.createElement(Elements.Style)
  style.dataset.id = EUI.HighContrast
  style.innerHTML = styles

  if (localStorage.getItem(EUI.HighContrast) == 1) {
    document.head.appendChild(style)
    input.checked = true
  }

  input.addEventListener(Events.onChange, (event) => {
    if (event.target.checked) {
      document.head.appendChild(style)
      localStorage.setItem(EUI.HighContrast, 1)
    }
    else {
      style.remove()
      localStorage.setItem(EUI.HighContrast, 0)
    }
  })
}