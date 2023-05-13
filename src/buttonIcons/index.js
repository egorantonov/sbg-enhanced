import { Locale } from '../constants'

export default function ButtonIcons() {
  if (document.getElementById('self-info__name').innerText !== 'eyemax') {
    return
  }

  const i18next_main = `i18next_${Locale}-main`
  let translations = JSON.parse(localStorage.getItem(i18next_main) ?? '{}')

  translations.buttons.references.manage = '♻'
  translations.buttons.references.view = '👁'
  translations.menu.leaderboard = '🏅'
  translations.menu.score = '📊'
  translations.menu.settings = '⚙'
  translations.menu.layers = '☰'

  localStorage.setItem(i18next_main, JSON.stringify(translations))
}