// eslint-disable-next-line no-unused-vars
import { EUI, Elements, Events, Modifiers, Nodes, t, Translations } from '../constants'
import { getSbgSettings } from '../utils'

// /**
//  * @deprecated Superseded by vanilla app
//  */
// export default function AddCanvasStyles() {
//     document.getElementById('regions-opacity__cur')?.parentElement?.parentElement?.remove() // remove native control
//     AddLayerOpacity(t(Translations.linesOpacity), EUI.LinksOpacity)
//     AddLayerOpacity(t(Translations.regionsOpacity), EUI.RegionsOpacity, '1')
// }

const percentsAttr = 'percents'
const valueAttr = 'value'

export default function AddCanvasStyles() {
    AddLayerOpacity(t(Translations.linesOpacity), EUI.LinksOpacity)
    VanillaRegionsOpacity()
}

function AddLayerOpacity(innerTextTranslation, controlId, defaultValue = 1) {
    /* @deprecated
    let settings = getSbgSettings()
    delete settings['opacity']
    setSbgSettings(settings)
    */

    let item = document.createElement(Elements.Div)
    item.className = Modifiers.SettingsSectionItemClassName

    let title = document.createElement(Elements.Span)
    title.innerText = innerTextTranslation
    item.appendChild(title)

    let range = document.createElement(Elements.Input)
    range.id = controlId

    range.setAttribute('type', 'range')
    range.setAttribute('min', '0')
    range.setAttribute('max', '1')
    range.setAttribute('step', '0.01')
    item.appendChild(range)

    // const uiSettings = Nodes.SettingSections.at(1)
    // uiSettings?.appendChild(item)

    const regionsOpacity = Nodes.GetSelector('label.settings-section__item:has(span.regions-opacity__range)')
    if (!regionsOpacity) {
        return
    }

    regionsOpacity.before(item)

    const value = localStorage.getItem(controlId)
    range.setAttribute(valueAttr, value ?? defaultValue)
    range.setAttribute(percentsAttr, ((value ?? defaultValue) * 100).toFixed(0))
    SetCssValue(controlId, value ?? defaultValue)

    range.disabled = localStorage.getItem(EUI.PerformanceMode) == 1
    range.addEventListener(Events.onChange, (event) => {
        SetCssValue(controlId, event.target.value)
        range.setAttribute(valueAttr, event.target.value)
        range.setAttribute(percentsAttr, (event.target.value * 100).toFixed(0))
        localStorage.setItem(controlId, event.target.value)
    })
}

function VanillaRegionsOpacity() {
    const range = Nodes.GetSelector('span.regions-opacity__range>input[type=range]')
    if (!range) {
        return
    }

    range.setAttribute('min', 0)
    range.setAttribute('max', 15)
    const value = getSbgSettings()['opacity'] ?? 2
    range.setAttribute(valueAttr, value)
    range.setAttribute(percentsAttr, (value * 100 / 15).toFixed(0))
    range.addEventListener(Events.onChange, (event) => {
        range.setAttribute(valueAttr, event.target.value)
        range.setAttribute(percentsAttr, (event.target.value * 100 / 15).toFixed(0))
    })

    Nodes.GetId('regions-opacity__cur')?.remove()
}

function SetCssValue(variable, value) {
    document.documentElement.style.setProperty(`--${variable}`, value)
}