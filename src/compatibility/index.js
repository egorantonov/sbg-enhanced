import { ClientData, Elements, Events, EUI, IsPrivate, Modifiers, Nodes, Sleep, t } from "../constants"
import styles from './styles.css'

export async function Compatibility () {
  function Firefox() {
    // Fix score popup (can't be closed on FF)
    Nodes.GetSelector('.score.popup .score__header').addEventListener(Events.onClick, () => Nodes.ScorePopup.classList.toggle('hidden'))
  }

  const style = document.createElement(Elements.Style)
  style.dataset.id = EUI.PerformanceMode
  style.innerHTML = styles

  async function PerformanceMode () {
    const browser = ClientData.GetUserAgentData?.browser

    if (browser == 'Webview') {
      return
    }

    const renderer = ClientData.GetGPU ?? ''
    if (renderer?.toLowerCase().indexOf('mali-g5') < 0 && browser != 'Firefox') {
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
      Nodes.GetSelector(`input[data-setting='${EUI.Animations}']`).disabled = true
      Nodes.GetId(EUI.LinksOpacity).disabled = true
      await Sleep(1000).then(() => 
        {
          const regions = Nodes.GetId(EUI.RegionsOpacity)
          regions && (regions.disabled = true)
        }
      )
    }

    const Disable = async () => {
      localStorage.setItem(EUI.PerformanceMode, 0)
      style.remove()
      Nodes.GetSelector(`input[data-setting='${EUI.Animations}']`).disabled = false
      Nodes.GetId(EUI.LinksOpacity).disabled = false
      await Sleep(1000).then(() => 
        {
          const regions = Nodes.GetId(EUI.RegionsOpacity)
          regions && (regions.disabled = false)
        }
      )
    }

    if (localStorage.getItem(EUI.PerformanceMode) == 1)
    {
      input.checked = true
      await Enable()
    }

    input.addEventListener(Events.onChange, async (event) => {
      if (event.target.checked) {
        await Enable()
      }
      else {
        await Disable()
      }
    })
  }

  Firefox();
  PerformanceMode();
}