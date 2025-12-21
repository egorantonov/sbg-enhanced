import { ToggleSettingsItem } from '../components/settingsItem'
import { EUI, IsPrivate, Nodes, t, Translations } from '../constants'
import { CanvasSnowfall } from './snowflakes'

export default async function Vibes() {

  const now = new Date()
  const start = new Date('2025.12.24') // TODO: переписать на vibes array
  const finish = new Date('2026.01.08')

  if ((now < start || now > finish) && !IsPrivate()) return

  const title = t(Translations.winterVibes)
  const vibe = new CanvasSnowfall()

  //enable by default
  if (localStorage.getItem(EUI.Vibes) != 0) localStorage.setItem(EUI.Vibes, 1)

  const enable = () => {
    vibe.show()
    localStorage.setItem(EUI.Vibes, 1)
  }

  const disable = () => {
    vibe.clear()
    localStorage.setItem(EUI.Vibes, 0)
  }

  const toggle = ToggleSettingsItem(title, enable, disable, EUI.Vibes)
  Nodes.SettingSections.at(0).appendChild(toggle)
}