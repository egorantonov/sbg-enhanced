import {EUI, Elements, Modifiers, Nodes, SBG, t} from '../constants'

export default async function Informer() {
  console.log(`SBG Enhanced UI, version ${EUI.Version}`)
  const sbgCurrentVersion = await fetch('/api/', {method: 'OPTIONS'})
      .then(response => response.headers.get(SBG.VersionHeader))

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

      const connection = localStorage.getItem(EUI.Connection)
      if (connection) {
        const connectionKey = document.createElement(Elements.Span)
        connectionKey.innerText = 'Connection'
        const connectionValue = document.createElement(Elements.Span)
        connectionValue.innerText = connection
        const connectionItem = document.createElement(Elements.Div)
        connectionItem.classList.add(Modifiers.SettingsSectionItemClassName)
        connectionItem.appendChild(connectionKey)
        connectionItem.appendChild(connectionValue)
        about.appendChild(connectionItem)

        localStorage.removeItem(EUI.Connection)
      }
  }
}