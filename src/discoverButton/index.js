import { Elements, Events, Modifiers, Nodes, t } from '../constants'

const onDiscoverChanged = 'discoverChanged'
export const DiscoverChanged = () => ({
    target: Nodes.Discover,
    config: {
        attributes: true,
        attributeFilter: ['data-time']
    },
    callback: (mutationsList) => {
        const event = new Event(onDiscoverChanged, { bubbles: true })
        mutationsList[0].target.dispatchEvent(event)
    }
})

export const AddDiscoverProgress = async () => {

    if (Nodes.InfoPopup && Nodes.Discover) {
        const discoverProgress = document.createElement(Elements.Div)
        discoverProgress.className = Modifiers.DiscoverProgressClassName
        Nodes.Discover.appendChild(discoverProgress)

        Nodes.InfoPopup.addEventListener(onDiscoverChanged, (event) => {
            let dataTimeString = event.target.dataset?.time

            if (!dataTimeString) {
                discoverProgress.style.width = 0
            }
            else if (dataTimeString.replace(t('s'),'') > 0) {
                discoverProgress.style.width = `${100 * dataTimeString.replace(t('s'),'') / 60}%`
            }
            else if (dataTimeString.replace(t('m'),'') > 0) {
                discoverProgress.style.width = '100%'
            }
            else {
                discoverProgress.style.width = 0
            }
        })

        const pbSub = document.querySelector('div.pb-sub')

        const removeDefaults = () => {
            pbSub.classList.remove('hidden')
            var refHidden = pbSub.attributes.getNamedItem('data-popper-reference-hidden')
            if (refHidden) pbSub.attributes.removeNamedItem(refHidden.name)

            var escaped = pbSub.attributes.getNamedItem('data-popper-escaped')
            if (escaped) pbSub.attributes.removeNamedItem(escaped.name)
        }

        removeDefaults();

        [Nodes.Discover, pbSub].forEach(e => {
            e.addEventListener(Events.onTouchEnd, () => {
                setTimeout(() => {
                    removeDefaults()
                }, 50)
            })
        })
    }
}

