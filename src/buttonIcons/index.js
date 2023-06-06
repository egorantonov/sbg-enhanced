import { EUI, Elements, Events, GetLocale, IsPrivate, Modifiers, Nodes, t } from '../constants'

export default function ButtonIcons() {
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
    const settings = document.getElementById('settings')
    const leaderboard = document.getElementById('leaderboard')
    const score = document.getElementById('score')
    const layers = document.getElementById('layers')
    const toggleFollow = document.getElementById('toggle-follow')

    leaderboard.innerText = '🏅'
    score.innerText = '📊'
    settings.innerText = '🔧'
    layers.innerText && (layers.innerText = '☰')
    layers.innerText && (toggleFollow.innerText = '💠')

    // Move all buttons after 'toggle-follow' button
    toggleFollow.after(settings)
    toggleFollow.after(leaderboard)
    toggleFollow.after(score)

    // Move 'ops' button into 'bottomleft-container'
    const bottomLeftContainer = document.querySelector('div.bottomleft-container')
    bottomLeftContainer.appendChild(Nodes.Ops)
  }

  localStorage.setItem(i18next_main, JSON.stringify(translations))

  input.addEventListener(Events.onChange, (event) => {
    localStorage.setItem(EUI.CompactView, event.target.checked ? 1 : 0)
    location.reload()
  })

  // CUI compatibility (Add shortcut to CUI settings)
  const cuiFavButton = document.querySelector('div.ol-control>button.sbgcui_button_reset.sbgcui_favs_star')
  if (cuiFavButton) {
    const cuiSettings = document.createElement(Elements.Button)
    cuiSettings.innerText = '⚙'
    cuiSettings.style.fontWeight = 'bold'
    cuiFavButton.before(cuiSettings)

    cuiSettings.addEventListener(Events.onClick, (e) => {
      e.stopPropagation()
      const cuiSettingsMenu = document.querySelector('form.sbgcui_settings')

      if (cuiSettingsMenu) {
        cuiSettingsMenu.classList.toggle('sbgcui_hidden')
      }
    })
  }
}