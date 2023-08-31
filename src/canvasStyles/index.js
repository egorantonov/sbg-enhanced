// eslint-disable-next-line no-unused-vars
import { EUI, Elements, Events, Modifiers, Nodes, Sleep, t } from '../constants'

export default async function AddCanvasStyles() {
    await AddLayerOpacity('.ol-layer__lines', 'linesOpacity', 'linesOpacityMessage', EUI.LinksOpacity)
    await AddLayerOpacity('.ol-layer__regions', 'regionsOpacity', 'regionsOpacityMessage', EUI.RegionsOpacity, '0.6')
}

async function AddLayerOpacity (layerClassName, innerTextTranslation, errorMessageTranslation, controlId, defaultValue = 0.75) {
    const getLayer = () => document.querySelector(layerClassName)

    let item = document.createElement(Elements.Div)
    item.className = Modifiers.SettingsSectionItemClassName

    let title = document.createElement(Elements.Span)
    title.innerText = t(innerTextTranslation)
    item.appendChild(title)

    let range = document.createElement(Elements.Input)
    range.id = controlId

    range.setAttribute('type', 'range')
    range.setAttribute('min', '0')
    range.setAttribute('max', '1')
    range.setAttribute('step', '0.01')
    item.appendChild(range)

    const uiSettings = Nodes.SettingSections.at(1)
    uiSettings?.appendChild(item)

    const value = localStorage.getItem(controlId)
    range.setAttribute('value', value ?? defaultValue)

    let layer = getLayer()

    if (!layer) { // make sure lines layer exist (or loaded if connection is throttling)
        await Sleep(2000)
        layer = getLayer()
    }

    range.addEventListener(Events.onChange, (event) => {
        if (!layer) { // make sure lines layer exist when user change slider
            layer = getLayer()
        }

        if (layer) {
            layer.style.filter = `opacity(${event.target.value})`
            localStorage.setItem(controlId, event.target.value)
        }
        else {
            alert(t(errorMessageTranslation))
        }
    })

    if (layer) {
        layer.style.filter = `opacity(${value ?? defaultValue})`
    }
}