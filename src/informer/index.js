import {Backend, EUI, Elements, Events, Modifiers, Nodes, SBG, t} from '../constants'
import { showToast } from '../utils'

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
      const euiVersionKey = document.createElement(Elements.Span)
      euiVersionKey.innerText = t('enhancedUIVersion')
      const euiVersionValue = document.createElement(Elements.Span)
      euiVersionValue.innerText = `v${EUI.Version}`
      const euiVersionItem = document.createElement(Elements.Div)
      euiVersionItem.classList.add(Modifiers.SettingsSectionItemClassName)
      euiVersionItem.appendChild(euiVersionKey)
      euiVersionItem.appendChild(euiVersionValue)
      about.appendChild(euiVersionItem)

      const donateKey = document.createElement(Elements.Span)
      donateKey.innerText = t('donations')
      const donateButton = document.createElement(Elements.Button)
      donateButton.innerText = t('donate')
      donateButton.addEventListener(Events.onClick, async () => {
        let amount = +prompt(t('donateDialogue'), 200)
        if (!amount || amount < 0) {
            showToast('Введено некорректное значение!')
        }

        const userName = Nodes.GetId('self-info__name').innerText
        await fetch(`${Backend.Host}/donate?amount=${amount}&userName=${userName}`)
            .then(r => r.json())
            .then(json => {
                if (json && json.qr && json.qr.includes('https')) {
                    location.assign(json.qr)
                }
            })
            .catch(err => console.log(err.message))
      })
      const donateItem = document.createElement(Elements.Div)
      donateItem.classList.add(Modifiers.SettingsSectionItemClassName)
      donateItem.appendChild(donateKey)
      donateItem.appendChild(donateButton)
      about.appendChild(donateItem)

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
            showToast(connectionValue)
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