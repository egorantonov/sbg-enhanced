import { Modifiers, Nodes, SBG } from '../constants'

const onPointStatsChanged = 'pointStatsChanged'
export const PointStatsChanged = () => ({
    target: Nodes.GetId('i-stat__line-out'),
    config: { childList: true },
    callback: (mutationsList) => {
        const event = new Event(onPointStatsChanged, { bubbles: true })
        mutationsList[0].target.dispatchEvent(event)
    }
})

/**
 * Disables draw button when outbound limit is reached
 * 
 * @deprecated Superseded by vanilla app
 */
export const DisableDrawButton = () => {

    const draw = Nodes.GetId('draw')
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