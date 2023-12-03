import { Events, Nodes } from "../constants"

export function Compatibility () {
  function Firefox() {
    // Fix score popup (can't be closed on FF)
    Nodes.GetSelector('.score.popup .score__header').addEventListener(Events.onClick, () => Nodes.ScorePopup.classList.toggle('hidden'))
  }

  Firefox()
}