import { GetLocale, IsPrivate, Nodes } from '../constants'

export default function ButtonIcons() {
  const i18next_main = `i18next_${GetLocale()}-main`
  let translations = JSON.parse(localStorage.getItem(i18next_main))
  if (!translations) {
    return
  }

  translations.buttons.references.manage = '♻'
  translations.buttons.references.view = '👁'

  if (IsPrivate()) {
    const settings = document.getElementById('settings')
    const leaderboard = document.getElementById('leaderboard')
    const score = document.getElementById('score')

    translations.menu.leaderboard = '🏅'
    leaderboard.innerText = '🏅'
    translations.menu.score = '📊'
    score.innerText = '📊'
    translations.menu.settings = '🔧'
    settings.innerText = '🔧'
    translations.menu.layers = '☰'
    translations.menu.follow = '💠'

    // Move all buttons after 'toggle-follow' button
    const toggleFollow = document.getElementById('toggle-follow')
    toggleFollow.after(settings)
    toggleFollow.after(leaderboard)
    toggleFollow.after(score)

    // Move 'ops' button into 'bottomleft-container'
    const bottomLeftContainer = document.querySelector('div.bottomleft-container')
    bottomLeftContainer.appendChild(Nodes.Ops)
  }

  localStorage.setItem(i18next_main, JSON.stringify(translations))
}