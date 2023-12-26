import { ClientData, Elements, Events, EUI, IsPrivate, Modifiers, Nodes, Sleep, t } from "../constants"
import styles from './styles.css'

export function Compatibility () {
  function Firefox() {
    // Fix score popup (can't be closed on FF)
    Nodes.GetSelector('.score.popup .score__header').addEventListener(Events.onClick, () => Nodes.ScorePopup.classList.toggle('hidden'))
  }

  const style = document.createElement(Elements.Style)
  style.dataset.id = EUI.PerformanceMode
  style.innerHTML = styles

  function PerformanceMode () {
    const browser = ClientData.GetUserAgentData?.browser
    const renderer = ClientData.GetGPU ?? ''
    if (browser == 'Webview' && renderer?.toLowerCase().indexOf('mali-g5') < 0) {
      return
    }

    // add new setting
    const input = document.createElement(Elements.Input)
    const uiSettings = Nodes.SettingSections.at(0)
    if (!uiSettings) {
      return
    }

    const title = document.createElement(Elements.Span)
    title.innerText = `[Preview] ${t('perfModeTitle')}`
    input.type = Elements.CheckBox
    input.dataset.setting = EUI.PerformanceMode
    const label = document.createElement(Elements.Label)
    label.classList.add(Modifiers.SettingsSectionItemClassName)
    label.appendChild(title)
    label.appendChild(input)
    uiSettings.appendChild(label)

    const Enable = async () => {
      if (!localStorage.getItem(EUI.PerformanceMode)) {
        alert(t('perfModeMessage'))
      }

      localStorage.setItem(EUI.PerformanceMode, 1)
      document.head.append(style)
      Nodes.GetSelector(`input[data-setting='${EUI.Animations}']`)?.setAttribute('disabled', true)
      Nodes.GetId(EUI.LinksOpacity)?.setAttribute('disabled', true)
      Nodes.GetId(EUI.RegionsOpacity)?.setAttribute('disabled', true)
    }

    const Disable = () => {
      localStorage.setItem(EUI.PerformanceMode, 0)
      style.remove()
      Nodes.GetSelector(`input[data-setting='${EUI.Animations}']`)?.toggleAttribute('disabled')
      Nodes.GetId(EUI.LinksOpacity)?.toggleAttribute('disabled')
      Nodes.GetId(EUI.RegionsOpacity)?.toggleAttribute('disabled')
    }

    if (localStorage.getItem(EUI.PerformanceMode) == 1)
    {
      input.checked = true
      Enable()
    }

    input.addEventListener(Events.onChange, (event) => {
      if (event.target.checked) {
        Enable()
      }
      else {
        Disable()
      }
    })
  }

  Firefox();
  PerformanceMode();
}