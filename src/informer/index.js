import {EUI, Elements, Events, Modifiers, Nodes, SBG, t} from '../constants'
import { createToast } from '../utils'

export default async function Informer() {
  console.log(`SBG Enhanced UI, version ${EUI.Version}`)
  const sbgCurrentVersion = await fetch('/api/')
    .then(response => response.json())
    .then(json => json.v)

  if (sbgCurrentVersion != SBG.CompatibleVersion) {
      const alertShown = localStorage.getItem(EUI.Incompatibility)

      if (alertShown != 'true') {
          alert(`⚠️ ${t('incompatibility')} (${sbgCurrentVersion})`)
          localStorage.setItem(EUI.Incompatibility, true)
      }
  }
  else {
      localStorage.setItem(EUI.Incompatibility, false)
  }

  const about = Nodes.SettingSections.at(3)
  if (about) {
      const key = document.createElement(Elements.Span)
      key.innerText = t('enhancedUIVersion')
      const value = document.createElement(Elements.Span)
      value.innerText = `v${EUI.Version}`
      const item = document.createElement(Elements.Div)
      item.classList.add(Modifiers.SettingsSectionItemClassName)
      item.appendChild(key)
      item.appendChild(value)
      about.appendChild(item)

      const connection = navigator.connection
      if (connection) {
        const connectionKey = document.createElement(Elements.Span)
        connectionKey.innerText = t('connection')
        const connectionShow = document.createElement(Elements.Button)
        connectionShow.innerText = t('showConnection')
        connectionShow.addEventListener(Events.onClick, () => {
            const connectionValue = `
                ${t('connectionPing')}:\u{a0}${connection.rtt}${t('m')}${t('s')},
                ${t('connectionLink')}:\u{a0}~${connection.downlink}mb/s,
                ${t('connectionGrade')}:\u{a0}${connection.effectiveType.toUpperCase()}
                ${
                    (connection.type && connection.type !== 'unknown')
                        ? `, ${t('connectionType')}:\u{a0}${connection.type.toUpperCase()}` 
                        : ''
                }
            `
            createToast(connectionValue)?.showToast()
            localStorage.setItem(EUI.Connection, connectionValue)
        })
        const connectionItem = document.createElement(Elements.Div)
        connectionItem.classList.add(Modifiers.SettingsSectionItemClassName)
        connectionItem.appendChild(connectionKey)
        connectionItem.appendChild(connectionShow)
        about.appendChild(connectionItem)

        localStorage.removeItem(EUI.Connection)
      }
  }
}