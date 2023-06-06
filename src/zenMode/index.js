import { Modifiers, Nodes } from '../constants'

export default function ZenMode() {
  const attackButton = document.getElementById('attack-menu')
  attackButton.addEventListener('touchstart', () => {
    let touchStart = Date.now()

    let timeoutID = setTimeout(() => {
      document.querySelector('.ol-control')?.classList.toggle(Modifiers.Hidden)
      document.querySelector('.self-info')?.classList.toggle(Modifiers.Hidden)
      document.querySelector('.game-menu')?.classList.toggle(Modifiers.Hidden)
      attackButton.classList.toggle('zen')
      Nodes.Ops.classList.toggle('zen')
    }, 1500)

    attackButton.addEventListener('touchend', () => {
      let touchDuration = Date.now() - touchStart
      console.log(touchDuration)
      if (touchDuration < 1000) {
        clearTimeout(timeoutID)
      } else {
        return
      }
    }, { once: true })
  })
}