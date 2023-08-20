import { EUI, Events, Nodes, SBG, Sleep } from '../constants'

export default async function BeautifyCloseButtons() {
  const beautifyButton = (button) => {
    button.innerText = EUI.CloseButtonText
    button.dataset.round = true
  }

  const closeButtons = Nodes.GetSelectorAll('button.popup-close, button#inventory__close')
  closeButtons.forEach((button) => {
    button.innerText.toLowerCase() === SBG.DefaultCloseButtonText && beautifyButton(button)
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

  /* INVENTORY CLOSE BUTTON IS NOT POPUP-CLOSE */
  Nodes.Ops?.addEventListener(
    Events.onClick,
    async () => {
      Nodes.InventoryPopupClose.innerText === 'X' && (await Sleep(1000)) // wait for SBG CUI modify inventory close button from 'X' to '[x]'
      Nodes.InventoryPopupClose.innerText.toLowerCase() ===
        SBG.DefaultCloseButtonText &&
        (Nodes.InventoryPopupClose.dataset.round = true)
      Nodes.InventoryPopupClose.innerText = EUI.CloseButtonText
    },
    { once: true }
  )

  /* REMOVE ATTACK SLIDER CLOSE BUTTON */
  Nodes.GetId('attack-slider-close')?.remove()

  /* BACK BUTTON ON ANDROID CLOSES MENUS */
  document.addEventListener(Events.onBackButton, (e) => {
    e.preventDefault()
    closeButtons.forEach(button => button.click())
  });
}
