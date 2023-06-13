import { EUI, Elements, Events, GetLocale, IsPrivate, Modifiers, Nodes, Sleep, t } from '../constants'

export default async function ButtonIcons() {
  if (IsPrivate() && !localStorage.getItem(EUI.CompactView)) {
    localStorage.setItem(EUI.CompactView, 1)
  }
  const i18next_main = `i18next_${GetLocale()}-main`
  let translations = JSON.parse(localStorage.getItem(i18next_main))
  if (!translations) {
    return
  }

  translations.buttons.references.manage = '♻'
  translations.buttons.references.view = '👁'

  // CREATE SETTING
  const input = document.createElement(Elements.Input)
  const uiSettings = Nodes.SettingSections.at(0)
  const checked = localStorage.getItem(EUI.CompactView) == 1
  if (uiSettings) {
      const title = document.createElement(Elements.Span)
      title.innerText = t('compactView')

      input.type = Elements.CheckBox
      input.dataset.setting = EUI.Animations
      const label = document.createElement(Elements.Label)
      label.classList.add(Modifiers.SettingsSectionItemClassName)
      label.appendChild(title)
      label.appendChild(input)
      uiSettings.appendChild(label)
      input.checked = checked
  }

  if (checked) {
    while (Nodes.Settings.innerText.includes('.')) {
      await Sleep(250)
    }

    Nodes.Leaderboard.innerText = '🏅'
    Nodes.Score.innerText = '📊'
    Nodes.Settings.innerText = '🔧'
    Nodes.Layers.innerText && (Nodes.Layers.innerText = '☰')
    Nodes.Layers.innerText && (Nodes.ToggleFollow.innerText = '💠')

    // Move all buttons after 'toggle-follow' button
    Nodes.ToggleFollow.after(Nodes.Settings)
    Nodes.ToggleFollow.after(Nodes.Leaderboard)
    Nodes.ToggleFollow.after(Nodes.Score)

    // Move 'ops' button into 'bottomleft-container'
    const bottomLeftContainer = Nodes.GetSelector('div.bottomleft-container')
    bottomLeftContainer && bottomLeftContainer.appendChild(Nodes.Ops)
  }

  localStorage.setItem(i18next_main, JSON.stringify(translations))

  input.addEventListener(Events.onChange, (event) => {
    localStorage.setItem(EUI.CompactView, event.target.checked ? 1 : 0)
    location.reload()
  })

  // CUI compatibility (Add shortcut to CUI settings)
  const cuiFavButton = Nodes.GetSelector('div.ol-control>button.sbgcui_button_reset.sbgcui_favs_star')
  if (cuiFavButton) {
    const cuiShortcut = document.createElement(Elements.Button)
    cuiShortcut.innerText = '⚙'
    cuiShortcut.style.fontWeight = 'bold'
    cuiFavButton.before(cuiShortcut)

    cuiShortcut.addEventListener(Events.onClick, (e) => {
      e.stopPropagation()
      const cuiSettingsMenu = Nodes.GetSelector('form.sbgcui_settings')
      if (cuiSettingsMenu) {
        cuiSettingsMenu.classList.toggle('sbgcui_hidden')
      }
    })
  }
}