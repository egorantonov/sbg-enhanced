import { EUI, Elements, Events, GetLocale, Modifiers, Nodes, Proposed, Sleep, t } from '../constants'
import { LongTouchEventListener } from '../helpers'
import { getUserAgentData } from '../utils/userAgentData'

export default async function CompactView() {

  const i18next_main = `i18next_${GetLocale()}-main`
  let translations = JSON.parse(localStorage.getItem(i18next_main))
  if (!translations) {
    return
  }

  const isNotSafari = getUserAgentData().browser !== 'Safari' // TODO: temp fix for Safari /* CUI Compatibility */

  translations.buttons.references.manage = isNotSafari ? 'delete' : '♻'
  translations.buttons.references.view = isNotSafari ? 'visibility' : '👁'

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

    Nodes.Leaderboard.innerText = isNotSafari ? 'workspace_premium' : '🏅'
    Nodes.Score.innerText = isNotSafari ? 'bar_chart' : '📊'
    Nodes.Settings.innerText = isNotSafari ? 'Settings' : '🔧'
    Nodes.Layers.innerText && (Nodes.Layers.innerText = isNotSafari ? 'Layers' : '☰')
    Nodes.Notifs.innerText && (Nodes.Notifs.innerText = isNotSafari ? 'Notifications' : '✉')
    Nodes.ToggleFollow.innerText && (Nodes.ToggleFollow.innerText = isNotSafari ? 'my_location' : '💠')

    if (isNotSafari) { 
      const nodes = [Nodes.Leaderboard, Nodes.Score, Nodes.Settings, Nodes.Layers, Nodes.Notifs, Nodes.ToggleFollow]
      nodes.forEach(e => {
        e.classList.add('material-symbols-outlined')
      });
      Nodes.Layers.style.fontFamily = 'Material Symbols Outlined'
    }

    // Move all buttons after 'toggle-follow' button
    Nodes.ToggleFollow.after(Nodes.Settings)
    Nodes.ToggleFollow.after(Nodes.Leaderboard)
    Nodes.ToggleFollow.after(Nodes.Score)
    Nodes.Attack?.after(Nodes.Ops)

    // Move 'ops' button into 'bottomleft-container'
    //const bottomContainer = Nodes.GetSelector('div.bottom-container')
    //bottomContainer && bottomContainer.appendChild(Nodes.Ops)

    // Remove level and XP sections
    const level = Nodes.GetId('self-info__explv')
    if (level.innerText.includes('10')) {
      level.remove()
      Nodes.GetSelector('.attack-slider-highlevel')?.remove()
      const xpContainer = Nodes.GetId('self-info__exp').parentElement
      xpContainer.classList.contains('self-info__entry')
        ? xpContainer.remove()
        : (xpContainer.style.filter = 'opacity(0)') /* CUI Compatibility */
    }

    // CUI Conflict: TODO: CUI interrupts on `attackSliderOpened` event clicking on selected catalyzer
    // "Remove" attack button as useless
    /*const fire = document.getElementById('attack-slider-fire')
    const cats = document.getElementById('catalysers-list')
    const isActive = 'is-active'
    cats.addEventListener(Events.onClick, (e) => {
      if (e.target.classList.contains(isActive)
        || e.target.parentElement.classList.contains(isActive)) {
        fire.click() // TODO: CUI interrupts on `attackSliderOpened` event clicking on selected catalyzer
      }
    })
    fire.innerText = ''
    fire.style.flex = 0
    fire.style.width = 0
    fire.style.height = 0
    fire.style.border = 0
    fire.style.opacity = 0*/
  }

  localStorage.setItem(i18next_main, JSON.stringify(translations))

  input.addEventListener(Events.onChange, (event) => {
    localStorage.setItem(EUI.CompactView, event.target.checked ? 1 : 0)
    Nodes.SettingsPopupClose.click()
    location.reload()
  })

  /* CUI compatibility */
  // Add long-tap shortcut to clear inventory
  const cuiInvClearButton = Nodes.GetSelector('button.sbgcui_settings-forceclear')
  cuiInvClearButton && LongTouchEventListener(Nodes.Ops, () => {
    cuiInvClearButton.click()
  })
}