import { AddDiscoverProgress } from '../discoverButton'
import { Elements, EUI, Events, Nodes, Sleep, t } from '../constants'
import { RemoveBadges, RenderBadges } from '../badges'
import AddAnimations from '../animations'
import AddCanvasStyles from '../canvasStyles'
import AddColorScheme from '../colorScheme'
import AddHighContrast from '../highContrast'
import AddReferenceSearch from '../referenceSearch'
import AddStyles from '../styles'
import BeautifyCloseButtons from '../closeButtons'
import CompactView from '../compactView'
import { Compatibility } from '../compatibility'
import { createToast } from '../utils'
import ImportExport from '../importExport'
import Informer from '../informer'
import InitObservers from '../observers'
import { Private } from '../private'
import { RepairButton } from '../repairButton'
import ZenMode from '../zenMode'
import styles from './styles.css'

function AddImmediateStyles() {
  const style = document.createElement(Elements.Style)
  style.dataset.id = EUI.ImmediateStyles
  try {
    document.head.appendChild(style)
  }
  catch (error) {
    console.log(error)
  }
  style.innerHTML = styles
}

function ExecuteImmediateAction() {
  Nodes.GetSelector('.fatal-error')?.addEventListener(Events.onClick, () => location.reload())
}

async function ExecuteScript () {
  let delaySyncMs = 500
  let delayAsyncMs = 1000

  const connection = navigator.connection

  if (connection) {
    delaySyncMs += connection.rtt
    delayAsyncMs += connection.rtt
  }

  AddImmediateStyles()
  ExecuteImmediateAction()

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
    Compatibility(),
    Private && (Private()),
  ]))
}

export async function RunWithOnlineUpdate() {
  const processResponse = (response) => {
    if (!response) {
      const message = 'Github releases api is unavailable. Possible network issue.'
      console.log(message)
      createToast(message)?.showToast()
      ExecuteScript()
      return
    }

    const version = response.tag_name
    if (!version) {
      const message = 'Can\'t get an online version of the script'
      console.log(message)
      createToast(message)?.showToast()
      ExecuteScript()
      return
    }

    if (version === EUI.Version) {
      console.log('Latest version already loaded')
      localStorage.setItem(EUI.Online, 0)
      ExecuteScript()
      return
    }

    const a = version.split('.').map(x => +x)
    const b = EUI.Version.split('.').map(x => +x)

    if (a[0] < b[0] || a[1] < b[1] || a[2] < b[2]) {
      const message = 'Hello, time traveler!'
      console.log(message)
      createToast(message)?.showToast()
      localStorage.setItem(EUI.Online, 0)
      ExecuteScript()
      return
    }

    console.log(`Online update (${version}) found, trying to inject the script...`)
    localStorage.getItem(EUI.Online) != 1 && alert(`${t('updateFound')}${version}`)
    localStorage.setItem(EUI.Online, 1)

    const script = document.createElement('script')
    script.id = EUI.Id
    script.src = `https://github.com/egorantonov/sbg-enhanced/releases/download/${version}/eui.user.js`
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