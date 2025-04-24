import {EUI, Nodes, SBG, Translations as i18n, t} from '../constants'
import { InfoSettingsItem, ButtonSettingsItem } from '../components/settingsItem'
import { showToast } from '../utils'

export default async function Informer() {
  console.log(`SBG Enhanced UI, version ${EUI.Version}`)
  const sbgCurrentVersion = await fetch('/api/')
    .then(response => response.headers.get(SBG.VersionHeader))

  if (sbgCurrentVersion != SBG.CompatibleVersion) {
      const alertShown = localStorage.getItem(EUI.Incompatibility)

      if (alertShown != 'true') {
          alert(`⚠️ ${t(i18n.incompatibility)} (${sbgCurrentVersion})`)
          localStorage.setItem(EUI.Incompatibility, true)
      }
  }
  else {
      localStorage.setItem(EUI.Incompatibility, false)
  }

  const about = Nodes.SettingSections.at(3)
  if (about) {
      about.appendChild(InfoSettingsItem(t(i18n.enhancedUIVersion), `v${EUI.Version}`))

      /*const donateKey = document.createElement(Elements.Span)
      donateKey.innerText = t('donations')
      const donateButton = document.createElement(Elements.Button)
      donateButton.innerText = t('donate')
      donateButton.addEventListener(Events.onClick, async () => {

        let amount = +prompt(t('donateDialogue'), 200)
        if (!amount || amount < 0) {
            showToast('Введено некорректное значение!')
            return
        }

        const userName = Nodes.GetId('self-info__name').innerText
        await fetch(`${Backend.Host}/donate?amount=${amount}&userName=${userName}`)
            .then(r => r.json())
            .then(json => {
                if (json && json.qr && json.qr.includes('https')) {
                    if (IsWebView()) {
                        if (window['__sbg_share']['open'](json.qr) === false) {
                            const share = {
                                title: 'Ссылка на донат',
                                url: json.qr,
                            }
                            if ('share' in navigator) {
                                navigator.share(share).then(...args => {
                                    console.log(args)
                                    showToast('Ссылка скопирована!')
                                })
                            }
                            else {
                                navigator.clipboard.writeText(json.qr)
                                    .then(() => {
                                        showToast('Ссылка скопирована!')
                                    })
                            }
                        }
                    }
                    else {
                        location.assign(json.qr)
                    }
                }
            })
            .catch(err => {
                console.log(err.message)
                showToast('Unexpected error, details in the console!')
            })
      })
      const donateItem = document.createElement(Elements.Div)
      donateItem.classList.add(Modifiers.SettingsSectionItemClassName)
      donateItem.appendChild(donateKey)
      donateItem.appendChild(donateButton)*/
      //setTimeout(() => about.appendChild(donateItem), 500)

      const connection = navigator.connection
      if (connection) {
        const connectionItemCallback = () => {
            const connectionValue = `
                ${t(i18n.connectionPing)}:\u{a0}${connection.rtt}${t('m')}${t('s')},
                ${t(i18n.connectionLink)}:\u{a0}~${connection.downlink}mb/s,
                ${t(i18n.connectionGrade)}:\u{a0}${connection.effectiveType.toUpperCase()}
                ${
                    (connection.type && connection.type !== 'unknown')
                        ? `, ${t(i18n.connectionType)}:\u{a0}${connection.type.toUpperCase()}` 
                        : ''
                }
            `
            showToast(connectionValue)
            localStorage.setItem(EUI.Connection, connectionValue)
        }
        const connectionItem = ButtonSettingsItem(t(i18n.connection), t(i18n.showConnection), connectionItemCallback)
        setTimeout(() => about.appendChild(connectionItem), 500)

        localStorage.removeItem(EUI.Connection)
      }
  }

  if (!localStorage.getItem(EUI.Team))
    fetch('/api/self', { headers: { authorization: `Bearer ${localStorage.auth}` }})
      .then(r => r.json())
      .then(json => localStorage.setItem(EUI.Team, json.t ?? 0))
}