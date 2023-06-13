import { Modifiers, Nodes } from '../constants'
import { LongTouch } from '../helpers'

export default function ZenMode() {
  const attackButton = Nodes.GetId('attack-menu')
  attackButton && attackButton.addEventListener('touchstart', () => {
    let touchStart = Date.now()

    let timeoutID = setTimeout(() => {
      Nodes.GetSelector('.ol-control')?.classList.toggle(Modifiers.Hidden)
      Nodes.GetSelector('.self-info')?.classList.toggle(Modifiers.Hidden)
      Nodes.GetSelector('.game-menu')?.classList.toggle(Modifiers.Hidden)
      attackButton.classList.toggle('zen')
      Nodes.Ops.classList.toggle('zen')
    }, 1500)

    attackButton.addEventListener('touchend', () => { LongTouch(touchStart, timeoutID) }, { once: true })
  })
}