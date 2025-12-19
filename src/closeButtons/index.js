import { EUI, Events, Modifiers, Nodes, Sleep } from '../constants'

export default async function BeautifyCloseButtons() {
  const beautifyButton = (button) => {
    if (button.dataset.i18n === 'buttons.cancel') return
    button.classList.remove('fa', 'fa-solid-xmark', 'sbgcui_button_reset') // CUI compatibility
    button.dataset.round = button.innerText.toLowerCase() !== 'x' 
    button.innerText = EUI.CloseButtonText
  }

  const closeButtons = Nodes.GetSelectorAll('button.popup-close, button#inventory__close')
  closeButtons.forEach((button) => beautifyButton(button))

  Nodes.InfoPopupClose.addEventListener(Events.onClick, () => {
    setTimeout(() => {
      const pbSub = document.querySelector('div.popping-button div.pb-sub')
      if (pbSub) pbSub.classList.remove(Modifiers.Hidden)
    }, 100)
  })

  /* CREDITS POPUP IS BEING FETCHED AS HTML */
  const creditsViewButton = Nodes.GetId('settings-credits')
  creditsViewButton?.addEventListener(
    Events.onClick,
    async () => {
      let creditsPopupClose = Nodes.GetSelector('.credits.popup .popup-close')

      while (!creditsPopupClose) {
        // wait for SBG fetches CREDITS POPUP
        await Sleep(250)
        creditsPopupClose = Nodes.GetSelector('.credits.popup .popup-close')
      }

      creditsPopupClose?.dataset?.round != true &&
        beautifyButton(creditsPopupClose)
    },
    { once: true }
  )

  /* REMOVE ATTACK SLIDER CLOSE BUTTON */
  Nodes.GetId('attack-slider-close')?.remove()

  /* BACK BUTTON ON ANDROID CLOSES MENUS */
  document.addEventListener(Events.onBackButton, (e) => {
    e.preventDefault()
    closeButtons.forEach(button => button.click())
    Nodes.ScorePopup?.classList.add(Modifiers.Hidden)
  })
}
