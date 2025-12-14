import { EUI, Elements, Events, GetLocale, Modifiers, Nodes, Proposed, Sleep, t } from '../constants'
import { LongTouchEventListener } from '../helpers'

export default async function CompactView() {

  const i18next_main = `i18next_${GetLocale()}-main`
  let translations = JSON.parse(localStorage.getItem(i18next_main))
  if (translations) {
    translations.buttons.references.manage = ''
    translations.buttons.references.view = ''
  }

  // CREATE SETTING
  const input = document.createElement(Elements.Input)
  const uiSettings = Nodes.SettingSections.at(0)

  if (uiSettings) {
    const title = document.createElement(Elements.Span)
    title.innerText = t('compactView')

    input.type = Elements.CheckBox
    input.dataset.setting = EUI.CompactView
    const label = document.createElement(Elements.Label)
    label.classList.add(Modifiers.SettingsSectionItemClassName)
    label.appendChild(title)
    label.appendChild(input)
    uiSettings.appendChild(label)

    // PROPOSAL
    const compactViewProposed = localStorage.getItem(`${EUI.CompactView}${Proposed}`)
    if (compactViewProposed != 1) {
      localStorage.setItem(`${EUI.CompactView}${Proposed}`, 1)
      localStorage.setItem(EUI.CompactView, 1)
      input.checked = true
    }
  }

  const checked = localStorage.getItem(EUI.CompactView) == 1

  if (checked && Nodes.Settings) {
    input.checked = true
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

  if (translations) localStorage.setItem(i18next_main, JSON.stringify(translations))

  input.addEventListener(Events.onChange, (event) => {
    localStorage.setItem(EUI.CompactView, event.target.checked ? 1 : 0)
    Nodes.SettingsPopupClose.click()
    location.reload()
  })

  /* CUI compatibility */
  // Add long-tap shortcut to clear inventory
  const cuiInvClearButton = Nodes.GetId('sbgcui_forceclear')
  cuiInvClearButton && LongTouchEventListener(Nodes.Ops, () => {
    cuiInvClearButton.click()
  })
}