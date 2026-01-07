import { ToggleSettingsItem } from '../components/settingsItem'
import { EUI, Elements, Nodes, Translations, t } from '../constants'
import styles from './styles.min.css'

export default function AddHighContrast() {
  const uiSettings = Nodes.SettingSections.at(1)
  if (!uiSettings) return

  // STYLES
  const style = document.createElement(Elements.Style)
  style.dataset.id = EUI.HighContrast
  style.innerHTML = styles

  const Enable = () => {
    document.head.appendChild(style)
    localStorage.setItem(EUI.HighContrast, 1)
  }

  const Disable = () => {
    style.remove()
    localStorage.setItem(EUI.HighContrast, 0)
  }

  const toggle = ToggleSettingsItem(t(Translations.highContrast), Enable, Disable, EUI.HighContrast, { subTitle: t(Translations.highContrastDesc) })
  uiSettings.appendChild(toggle)
}