// eslint-disable-next-line no-unused-vars
import { EUI, Elements, Events, Modifiers, Nodes, t, Translations } from '../constants'
import { getSbgSettings, setSbgSettings } from '../utils'

export default function AddCanvasStyles() {
    document.getElementById('regions-opacity__cur')?.parentElement?.parentElement?.remove() // remove native control
    AddLayerOpacity(t(Translations.linesOpacity), EUI.LinksOpacity)
    AddLayerOpacity(t(Translations.regionsOpacity), EUI.RegionsOpacity, '1')
}

function AddLayerOpacity(innerTextTranslation, controlId, defaultValue = 1) {
    let settings = getSbgSettings()
    delete settings['opacity']
    setSbgSettings(settings)

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
    SetCssValue(controlId, value ?? defaultValue)

    range.disabled = localStorage.getItem(EUI.PerformanceMode) == 1
    range.addEventListener(Events.onChange, (event) => {
        SetCssValue(controlId, event.target.value)
        localStorage.setItem(controlId, event.target.value)
    })
}

function SetCssValue(variable, value) {
    document.documentElement.style.setProperty(`--${variable}`, value)
}