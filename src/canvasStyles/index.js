// eslint-disable-next-line no-unused-vars
import { EUI, Elements, Events, Modifiers, Nodes, Sleep, t } from '../constants'

async function AddLinesOpacity () {
    const getLines = () => document.querySelector('.ol-layer__lines')
    const DefaultOpacityLevel = '0.75'
  
    let item = document.createElement(Elements.Div)
    item.className = Modifiers.SettingsSectionItemClassName
  
    let title = document.createElement(Elements.Span)
    title.innerText = t('linesOpacity')
    item.appendChild(title)
  
    let range = document.createElement(Elements.Input)
    range.id = EUI.LinksOpacity
  
    range.setAttribute('type', 'range')
    range.setAttribute('min', '0')
    range.setAttribute('max', '1')
    range.setAttribute('step', '0.01')
    item.appendChild(range)
  
    const uiSettings = Nodes.SettingSections.at(1)
    uiSettings?.appendChild(item)
  
    const value = localStorage.getItem(EUI.LinksOpacity)
    range.setAttribute('value', value ?? DefaultOpacityLevel)
  
    let lines = getLines()
  
    if (!lines) { // make sure lines layer exist (or loaded if connection is throttling)
        await Sleep(2000)
        lines = getLines()
    }
  
    range.addEventListener(Events.onChange, (event) => {
        if (!lines) { // make sure lines layer exist when user change slider
            lines = getLines()
        }
  
        if (lines) {
            lines.style.filter = `opacity(${event.target.value})`
            localStorage.setItem(EUI.LinksOpacity, event.target.value)
        }
        else {
            alert(t('linesOpacityMessage'))
        }
    })
  
    if (lines) {
        lines.style.filter = `opacity(${value ?? DefaultOpacityLevel})`
    }
}

async function AddRegionsOpacity () {
    const getRegions = () => document.querySelector('.ol-layer__regions')
    const DefaultOpacityLevel = '0.5'
  
    let item = document.createElement(Elements.Div)
    item.className = Modifiers.SettingsSectionItemClassName
  
    let title = document.createElement(Elements.Span)
    title.innerText = t('regionsOpacity')
    item.appendChild(title)

    let range = document.createElement(Elements.Input)
    range.id = EUI.RegionsOpacity

    range.setAttribute('type', 'range')
    range.setAttribute('min', '0')
    range.setAttribute('max', '1')
    range.setAttribute('step', '0.05')
    item.appendChild(range)

    const uiSettings = Nodes.SettingSections.at(1)
    uiSettings?.appendChild(item)
  
    const value = localStorage.getItem(EUI.RegionsOpacity)
    range.setAttribute('value', value ?? DefaultOpacityLevel)

    let regions = getRegions()

    if (!regions) { // make sure lines layer exist (or loaded if connection is throttling)
        await Sleep(2000)
        regions = getRegions()
    }

    range.addEventListener(Events.onChange, (event) => {
        if (!regions) { // make sure lines layer exist when user change slider
            regions = getRegions()
        }
  
        if (regions) {
            regions.style.filter = `opacity(${event.target.value})`
            localStorage.setItem(EUI.LinksOpacity, event.target.value)
        }
        else {
            alert(t('linesOpacityMessage'))
        }
    })
  
    if (regions) {
        regions.style.filter = `opacity(${value ?? DefaultOpacityLevel})`
    }
}

export default async function AddCanvasStyles() {
    await AddLinesOpacity()
    await AddRegionsOpacity()
}