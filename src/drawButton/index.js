import { Modifiers, Nodes, SBG } from '../constants'

const onPointStatsChanged = 'pointStatsChanged'
export const PointStatsChanged = {
    target: document.getElementById('i-stat__line-out'),
    config: { childList: true },
    callback: (mutationsList) => {
        const event = new Event(onPointStatsChanged, { bubbles: true })
        mutationsList[0].target.dispatchEvent(event)
    }
}

// disables draw button when outbound limit is reached
export const DisableDrawButton = () => {

    const draw = document.getElementById('draw')
    if (Nodes.InfoPopup && !!draw) {
      Nodes.InfoPopup.addEventListener(onPointStatsChanged, (event) => {
            if (event.target.innerText >= SBG.OutboundLinksLimit) {
                draw.setAttribute(Modifiers.Disabled, true)
                draw.classList.add(Modifiers.Loading)
            }
            else {
                if (draw.classList.contains(Modifiers.Loading)) {
                    draw.classList.remove(Modifiers.Loading)
                    draw.removeAttribute(Modifiers.Disabled)
                }
            }
        })
    }
}