import { ToggleSettingsItem } from '../components/settingsItem'
import { EUI, Nodes, Sleep, Translations, t } from '../constants'
import { LongTouchEventListener } from '../helpers'

export default async function CompactView() {

  if (localStorage.getItem(EUI.CompactView) != 0) localStorage.setItem(EUI.CompactView, 1)
  const checked = localStorage.getItem(EUI.CompactView) == 1

      // CREATE SETTING
  const uiSettings = Nodes.SettingSections.at(0)

  const callback = (value) => {
    localStorage.setItem(EUI.CompactView, value)
    Nodes.SettingsPopupClose.click()
    location.reload()
  }

  const Enable = () => callback(1)

  const Disable = () => callback(0)

  if (uiSettings) {
    const compactViewItem = ToggleSettingsItem(t(Translations.compactView), Enable, Disable, EUI.CompactView, { once: true, subTitle: t(Translations.compactViewDesc) })
    uiSettings.appendChild(compactViewItem)
  }

  if (checked && Nodes.Settings) {

    //input.checked = true
    while (Nodes.Settings.innerText.includes('.')) {
      await Sleep(250)
    }

    [Nodes.Leaderboard, Nodes.Score, Nodes.Settings, Nodes.Notifs, Nodes.Layers, Nodes.ToggleFollow].forEach(n => {
      n.innerText = ''
      n.classList.add('compactview_icon')
    })

    // Move all buttons after 'toggle-follow' button
    Nodes.ToggleFollow.after(Nodes.Settings)
    Nodes.ToggleFollow.after(Nodes.Leaderboard)
    Nodes.ToggleFollow.after(Nodes.Score)
    Nodes.Attack?.after(Nodes.Ops)

    // Remove level and XP sections
    const level = Nodes.GetId('self-info__explv')
    if (level.innerText.includes('10')) {
      level.remove()
      Nodes.GetSelector('.attack-slider-highlevel')?.remove()
      Nodes.GetId('self-info__exp')?.parentElement?.remove()
      Nodes.GetSelector('div.self-info')?.classList.add('compact')
    }
  }
  else {
    [Nodes.Notifs, Nodes.Layers, Nodes.ToggleFollow].forEach(n => n.innerText === '' && (n.classList.add('compactview_icon')))
  }

  /* CUI compatibility */
  // Add long-tap shortcut to clear inventory
  const cuiInvClearButton = Nodes.GetId('sbgcui_forceclear')
  cuiInvClearButton && LongTouchEventListener(Nodes.Ops, () => {
    cuiInvClearButton.click()
  })
}