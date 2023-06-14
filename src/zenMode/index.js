import { Modifiers, Nodes } from '../constants'
import { LongTouchEventListener } from '../helpers'

export default function ZenMode() {
  const attackButton = Nodes.GetId('attack-menu')
  attackButton && LongTouchEventListener(attackButton, () => {
    Nodes.GetSelector('.ol-control')?.classList.toggle(Modifiers.Hidden)
    Nodes.GetSelector('.self-info')?.classList.toggle(Modifiers.Hidden)
    Nodes.GetSelector('.game-menu')?.classList.toggle(Modifiers.Hidden)
    attackButton.classList.toggle('zen')
    Nodes.Ops.classList.toggle('zen')
  })
}