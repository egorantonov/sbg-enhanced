import { AddDiscoverProgress } from '../discoverButton'
import { EUI, Nodes, Sleep, t } from '../constants'
import { RemoveBadges, RenderBadges } from '../badges'
import AddAnimations from '../animations'
import AddCanvasStyles from '../canvasStyles'
import AddColorScheme from '../colorScheme'
import AddHighContrast from '../highContrast'
import AddReferenceSearch from '../referenceSearch'
import AddStyles from '../styles'
import BeautifyCloseButtons from '../closeButtons'
import CompactView from '../compactView'
import ImportExport from '../importExport'
import Informer from '../informer'
import InitObservers from '../observers'
import { Private } from '../private'
import { RepairButton } from '../repairButton'
import ZenMode from '../zenMode'

async function ExecuteScript () {
  let delaySyncMs = 500
  let delayAsyncMs = 1000

  const connection = navigator.connection

  if (connection) {
    delaySyncMs += connection.rtt
    delayAsyncMs += connection.rtt
  }

  if (window.cuiStatus) {
    for (let i = 1; i <= 10; i++) {
      if (window.cuiStatus == 'loaded') {
        delaySyncMs = 0
        delayAsyncMs = 100
        break
      } 
      console.log(`Waiting for CUI, try #${i}...`)
      await Sleep(750)
    }
  }

  await Sleep(delaySyncMs)
    .then(() => {
      AddStyles()
      AddHighContrast()
      AddAnimations()
      AddColorScheme()
      InitObservers()
      RemoveBadges()
      RenderBadges()
      RepairButton()
      ZenMode()
    })

  await Sleep(delayAsyncMs) // sleep for a while to make sure SBG is loaded
    .then(async () => await Promise.all([
    Informer(),
    AddCanvasStyles(),
    BeautifyCloseButtons(),
    ImportExport(),
    AddReferenceSearch(),
    AddDiscoverProgress(),
    CompactView(),
    Private && (Private())
  ]))
}

export async function RunWithOnlineUpdate() {
  const processResponse = (response) => {
    if (!response) {
      console.log('Github releases api is unavailable. Possible network issue.')
      ExecuteScript()
      return
    }

    const version = response.tag_name
    if (!version) {
      console.log('Can\'t get an online version of the script')
      ExecuteScript()
      return
    }

    if (version === EUI.Version) {
      console.log('Latest version already loaded')
      localStorage.setItem(EUI.Online, 0)
      ExecuteScript()
      return
    }

    if (version < EUI.Version) {
      console.log('Hello, time traveler!')
      localStorage.setItem(EUI.Online, 0)
      ExecuteScript()
      return
    }

    console.log(`Online update (${version}) found, trying to inject the script...`)
    localStorage.getItem(EUI.Online) != 1 && alert(`${t('updateFound')}${version}`)
    localStorage.setItem(EUI.Online, 1)

    const script = document.createElement('script')
    script.id = EUI.Id
    script.src = `https://github.com/egorantonov/sbg-enhanced/releases/download/${version}/index.js`
    script.defer = true
    script.type = 'text/javascript'
    document.head.appendChild(script)
  }

  const releaseUrl = 'https://api.github.com/repos/egorantonov/sbg-enhanced/releases/latest'
  let onlineInUse = Nodes.GetId(EUI.Id)

  if (!onlineInUse && window.fetch) {
    try {
      await fetch(releaseUrl)
      .then(r => r.json())
      .then(x => processResponse(x))
    }
    catch (error) {
      console.log(error)
      ExecuteScript() // fallback
    }
  }
  else {
    ExecuteScript()
  }
}