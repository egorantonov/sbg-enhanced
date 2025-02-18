import { EUI, Elements, Events, Modifiers, Nodes, t, Translations as i18n } from '../constants'
import { Logger } from '../utils'

export default function SpeedoMeter() {

  const showSelfPos = Nodes.GetSelector('label.settings-section__item:has(input[data-setting="selfpos"])')

  if (!showSelfPos) {
    return
  }

  let watchId

  // settings
  const title = document.createElement(Elements.Span)
  title.innerText = t(i18n.speedoMeter)

  const input = document.createElement(Elements.Input)
  input.type = Elements.CheckBox
  input.dataset.setting = EUI.SpeedoMeter

  const label = document.createElement(Elements.Label)
  label.classList.add(Modifiers.SettingsSectionItemClassName)
  label.appendChild(title)
  label.appendChild(input)
  showSelfPos.before(label)

  // ui
  const speedometer = document.createElement(Elements.Div)
  speedometer.id = EUI.SpeedoMeter
  speedometer.style.cssText = `
    text-align: center;
    text-shadow: none;
    font-weight: 700;
    font-size: 28px;
    line-height: 48px;
    width: 48px;
    height: 48px;
    color: var(--text);
    background-color: var(--background-transp);
    border: 6px solid var(--accent);
    border-radius: 100px;
    position: fixed;
    top: 0;
    right: 0;
    margin: 14px;
    display: none;
    transition: transform 0.25s ease-in-out;
  `
  const selfInfo = Nodes.GetSelector('.self-info')
  selfInfo.appendChild(speedometer)
  const CUISpeed = Nodes.GetSelector('.sbgcui_speed')

  // actions
  const watchSpeed = (pos1) => {
    let speed = ((pos1.coords.speed ?? 0) * 3.6).toFixed(0)
    if (speed != speedometer.textContent) {
      speedometer.textContent = speed
      speedometer.style.transform = speed == 0 ? 'translateX(75px)' : 'none'
    }
  }

  const Enable = () => {
    localStorage.setItem(EUI.SpeedoMeter, 1)
    speedometer.style.display = 'block'
    selfInfo.style.marginRight = '64px'
    speedometer.textContent = ''
    watchId = navigator.geolocation.watchPosition(watchSpeed)
    Logger.log(`Watch Id is: ${watchId}`)

    if (CUISpeed) {
      CUISpeed.style.display = 'none'
    }
  }

  const Disable = () => {
    localStorage.setItem(EUI.SpeedoMeter, 0)
    speedometer.style.display = 'none'
    selfInfo.style.marginRight = 'initial'
    speedometer.textContent = '0'
    navigator.geolocation.clearWatch(watchId)
    Logger.log(`Cleared watch with id: ${watchId}`)

    if (CUISpeed) {
      CUISpeed.style.display = 'block'
    }
  }

  if (localStorage.getItem(EUI.SpeedoMeter) == 1)
  {
    input.checked = true
    Enable()
  }

  input.addEventListener(Events.onChange, e => e.target.checked ? Enable() : Disable())
}