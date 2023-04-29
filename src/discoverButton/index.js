import { Elements, Modifiers, Nodes } from '../constants'


const onDiscoverChanged = 'discoverChanged'
export const DiscoverChanged = {
    target: Nodes.Discover,
    config: {
        attributes: true,
        attributeFilter: ['data-time']
    },
    callback: (mutationsList) => {
        const event = new Event(onDiscoverChanged, { bubbles: true })
        mutationsList[0].target.dispatchEvent(event)
    }
}

export const AddDiscoverProgress = () => {

    if (Nodes.InfoPopup && Nodes.Discover) {
        const discoverProgress = document.createElement(Elements.Div)
        discoverProgress.className = Modifiers.DiscoverProgressClassName
        Nodes.Discover.appendChild(discoverProgress)

        Nodes.InfoPopup.addEventListener(onDiscoverChanged, (event) => {
            let dataTimeString = event.target.dataset?.time

            if (!dataTimeString) {
                discoverProgress.style.width = 0
            }
            else if (dataTimeString.replace('s','') > 0) { // TODO: localization issue
                discoverProgress.style.width = `${100 * dataTimeString.replace('s','') / 60}%` // TODO: localization issue
            }
            else if (dataTimeString.replace('m','') > 0) { // TODO: localization issue
                discoverProgress.style.width = '100%'
            }
            else {
                discoverProgress.style.width = 0
            }
        })
    }
}