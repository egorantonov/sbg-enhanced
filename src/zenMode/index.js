import { Modifiers, Nodes } from '../constants'
import { LongTouchEventListener } from '../helpers'
import { createToast } from '../utils'

export default function ZenMode() {
  const attackButton = Nodes.GetId('attack-menu')
  const zenClassName = 'zen'
  attackButton && LongTouchEventListener(attackButton, () => {
    Nodes.GetSelector('.ol-control')?.classList.toggle(Modifiers.Hidden)
    Nodes.GetSelector('.self-info')?.classList.toggle(Modifiers.Hidden)
    Nodes.GetSelector('.game-menu')?.classList.toggle(Modifiers.Hidden)
    attackButton.classList.toggle(zenClassName)
    Nodes.Ops.classList.toggle(zenClassName)
    createToast(`Zen mode ${attackButton.classList.contains(zenClassName) ? 'activated' : 'disabled' }`, 'top center')?.showToast()
  })
}