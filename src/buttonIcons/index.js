import { GetLocale, IsPrivate } from '../constants'

export default function ButtonIcons() {
  const i18next_main = `i18next_${GetLocale()}-main`
  let translations = JSON.parse(localStorage.getItem(i18next_main))
  if (!translations) {
    return
  }

  translations.buttons.references.manage = '♻'
  translations.buttons.references.view = '👁'

  if (IsPrivate()) {
    translations.menu.leaderboard = '🏅'
    translations.menu.score = '📊'
    translations.menu.settings = '⚙'
    translations.menu.layers = '☰'
  }

  localStorage.setItem(i18next_main, JSON.stringify(translations))
}