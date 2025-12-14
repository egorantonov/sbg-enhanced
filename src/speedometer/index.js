import { ToggleSettingsItem } from '../components/settingsItem'
import { EUI, Elements, Nodes, t, Translations } from '../constants'
import { Logger } from '../utils'

export default function SpeedoMeter() {

  const showSelfPos = Nodes.GetSelector('label.settings-section__item:has(input[data-setting="selfpos"])')

  if (!showSelfPos) {
    return
  }

  let watchId

  // ui
  const transform = 'translateX(75px)'
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
    backdrop-filter: var(--blur5);
    background-color: var(--background-transp);
    border: 6px solid;
    border-color: #7779;
    border-radius: 100px;
    position: fixed;
    top: 0;
    right: 0;
    margin: 14px;
    display: none;
    transform: ${transform}
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
      speedometer.style.transform = speed == 0 ? transform : 'none'
      speedometer.style.borderColor = speed > 60 ? 'var(--accent)' : '#7779'
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

  const label = ToggleSettingsItem(t(Translations.speedoMeter), () => Enable(), () => Disable(), EUI.SpeedoMeter)
  showSelfPos.before(label)
}