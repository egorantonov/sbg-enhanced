import { Backend, EUI, IsWebView, Nodes, SBG, Translations as i18n, t } from '../constants'
import { InfoSettingsItem, ButtonSettingsItem } from '../components/settingsItem'
import { Logger, showToast } from '../utils'
import { flavored_fetch } from '../helpers'

export default async function Informer() {
    Logger.log(`SBG Enhanced UI, version ${EUI.Version}`)

    flavored_fetch('/api/self')
    .then(r => {
        const sbgCurrentVersion = r.headers.get(SBG.Headers.VERSION)
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

        return r.json()
    })
    .then(json => localStorage.setItem(EUI.Team, json.t ?? 0))

    const about = Nodes.SettingSections.at(3)
    if (about) {
        const euiVersionInfo = InfoSettingsItem(t(i18n.enhancedUIVersion), `v${EUI.Version}`, 'eui-version')
        about.appendChild(euiVersionInfo)

        const donateCallback = async () => {
  
          let amount = +prompt(t(i18n.donateDialogue), 200)
          if (!amount || amount < 0) {
              showToast('Введено некорректное значение!')
              return
          }
  
          const userName = Nodes.GetId('self-info__name').innerText
          setTimeout(() => {
              fetch(`${Backend.Host}${Backend.Endpoints.Donate}?amount=${amount}&userName=${userName}`)
          }, 100)
          await fetch(Backend.DonationService.replace('{amount}', amount))
              .then(r => r.json())
              .then(json => {
                  if (json && json.formUrl && json.formUrl.includes('https')) {
                      if (IsWebView()) {
                          if (window['__sbg_share']['open'](json.formUrl) === false) {
                              const share = {
                                  title: 'Ссылка на донат',
                                  url: json.formUrl,
                              }
                              if ('share' in navigator) {
                                  navigator.share(share).then(...args => {
                                      console.log(args)
                                      showToast('Ссылка скопирована!')
                                  })
                              }
                              else {
                                  navigator.clipboard.writeText(json.formUrl)
                                      .then(() => {
                                          showToast('Ссылка скопирована!')
                                      })
                              }
                          }
                      }
                      else {
                          location.assign(json.formUrl)
                      }
                  }
              })
              .catch(err => {
                  Logger.error(err.message, err)
                  showToast(t(i18n.donateError))
              })
        }

        const donateButtonItem = ButtonSettingsItem(t(i18n.donations), t(i18n.donate), donateCallback, EUI.Donate, { subTitle: t(i18n.donationsDesc) })
        euiVersionInfo.after(donateButtonItem)

        const connection = navigator.connection
        if (connection) {
            const connectionItemCallback = () => {
                const connectionValue = `
                ${t(i18n.connectionPing)}:\u{a0}${connection.rtt}${t('m')}${t('s')},
                ${t(i18n.connectionLink)}:\u{a0}~${connection.downlink}mb/s,
                ${t(i18n.connectionGrade)}:\u{a0}${connection.effectiveType.toUpperCase()}
                ${(connection.type && connection.type !== 'unknown')
                        ? `, ${t(i18n.connectionType)}:\u{a0}${connection.type.toUpperCase()}`
                        : ''
                    }
            `
                showToast(connectionValue)
                localStorage.setItem(EUI.Connection, connectionValue)
            }
            const connectionItem = ButtonSettingsItem(t(i18n.connection), t(i18n.showConnection), connectionItemCallback, EUI.Connection, { subTitle: t(i18n.connectionDesc) })
            setTimeout(() => about.appendChild(connectionItem), 500)

            localStorage.removeItem(EUI.Connection)
        }
    }
}