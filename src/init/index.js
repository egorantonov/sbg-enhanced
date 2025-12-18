import { AddDiscoverProgress } from '../discoverButton'
import { CUI, Elements, EUI, Events, IsWebView, Nodes, Sleep, t, Translations } from '../constants'
import { RemoveBadges, RenderBadges } from '../badges'
import AddAnimations from '../animations'
import AddCanvasStyles from '../canvasStyles'
import AddColorScheme from '../colorScheme'
import AddHighContrast from '../highContrast'
import AddReferenceSearch from '../referenceSearch'
import AddStyles from '../styles'
import BeautifyCloseButtons from '../closeButtons'
import { Actions } from '../actions'
import { Avatars } from '../avatars'
import { Cache } from '../cache'
import CompactView from '../compactView'
import { Compatibility } from '../compatibility'
import { EuiConsole } from '../console'
import ImportExport from '../importExport'
import Informer from '../informer'
import InitObservers from '../observers'
import { Private } from '../private'
import { Progress, UpdateProgressStatus, RemoveProgress } from '../progress'
import { RepairButton } from '../repairButton'
import { showToast, Logger } from '../utils'
import SpeedoMeter from '../speedometer'
import styles from './styles.min.css'
import ZenMode from '../zenMode'
import EUIWakeLock from '../wakelock'
import Vibes from '../vibes'
// import Battery from '../battery'

function isFatalError() {
  const fatalError = Nodes.GetSelector('.fatal-error')
  if (fatalError) {
    addImmediateStyles()
    fatalError.addEventListener(Events.onClick, () => location.reload())
    return true
  }
  else return false
}

function addImmediateStyles() {
  const style = document.createElement(Elements.Style)
  style.dataset.id = EUI.ImmediateStyles
  try {
    document.head?.appendChild(style)
  }
  catch (error) {
    Logger.log(error)
  }
  style.innerHTML = styles
}

function ExecuteSyncFeatures() {
  const executions = [
    [AddStyles, 'AddStyles'],
    [AddHighContrast, 'AddHighContrast'],
    [AddCanvasStyles, 'AddCanvasStyles'],
    [AddAnimations, 'AddAnimations'],
    [AddColorScheme, 'AddColorScheme'],
    [Cache, 'Cache'],
    [InitObservers, 'InitObservers'],
    [RemoveBadges, 'RemoveBadges'],
    [RenderBadges, 'RenderBadges'],
    [Avatars, 'Avatars'],
    [RepairButton, 'RepairButton'],
    [ZenMode, 'ZenMode'],
    [SpeedoMeter, 'Speedometer'],
    [EuiConsole, 'EUI Console']
  ]

  let succeed = 0
  const total = executions.length
  for (let i = 0; i < total; i++) {
    succeed+=ExecuteSyncFeature(executions[i])
  }
  Logger.log(`Executed ${succeed} of ${total} sync features`)
}

function ExecuteSyncFeature([feature, name]) {
  let success = true
  try {
    feature()
    Logger.log(`Executed '${name}' feature`)
  }
  catch (error) {
    success = false
    const message = `'${name ?? feature.name}' ${t(Translations.featureFailed)} ${error.message}`
    showToast(message)
    Logger.error(message, error)
  }
  UpdateProgressStatus(name)
  return success
}

async function ExecuteAsyncFeatures() {
  let result = await Promise.all([
    ExecuteAsyncFeature(Informer, 'Informer'),
    ExecuteAsyncFeature(EUIWakeLock, 'WakeLock'),
    // ExecuteAsyncFeature(Battery, 'Battery'),
    ExecuteAsyncFeature(BeautifyCloseButtons, 'BeautifyCloseButtons'),
    ExecuteAsyncFeature(ImportExport, 'ImportExport'),
    ExecuteAsyncFeature(AddReferenceSearch, 'AddReferenceSearch'),
    ExecuteAsyncFeature(AddDiscoverProgress, 'AddDiscoverProgress'),
    ExecuteAsyncFeature(CompactView, 'CompactView'),
    ExecuteAsyncFeature(Compatibility, 'Compatibility'),
    ExecuteAsyncFeature(Actions, 'Actions'),
    ExecuteAsyncFeature(Vibes, 'Vibes')
  ])

  Private && (result.push(await ExecuteAsyncFeature(Private, 'Debug')))

  let succeed = result.reduce((s, e) => s+=e)
  Logger.log(`Executed ${succeed} of ${result.length} async features`)
}

async function ExecuteAsyncFeature(feature, name) {
  let succeed = true
  try {
    await feature()
    Logger.log(`Executed '${name}' feature`)
  }
  catch (error) {
    const message = `'${name ?? feature.name}' ${t(Translations.featureFailed)} ${error.message}`
    showToast(message)
    Logger.error(message, error)
    succeed = false
  }
  UpdateProgressStatus(name)
  return succeed
}

async function ExecuteScript () {
  if (isFatalError()) return
  let delaySyncMs = 500
  let delayAsyncMs = 1000

  const connection = navigator.connection

  if (connection) {
    delaySyncMs += connection.rtt
    delayAsyncMs += connection.rtt
  }

  if (CUI.Detected()) {
    UpdateProgressStatus(t(Translations.progressCui))
    const limit = 30
    for (let i = 1; i <= limit; i++) {
      if (CUI.Loaded()) {
        delaySyncMs = 0
        delayAsyncMs = 100
        break
      }
      if (i === limit || CUI.Error()) {
        alert(t(Translations.progressCuiFailedReload))
        location.reload()
      }
      if (i === 5) {
        confirm(t(Translations.progressCuiFailed)) && location.reload()
      }
      Logger.log(`${t(Translations.progressCui)}, try #${i}...`)
      await Sleep(1e3)
    }
  }

  await Sleep(delaySyncMs).then(() => ExecuteSyncFeatures())
  await Sleep(delayAsyncMs).then(async () => await ExecuteAsyncFeatures()).then(() => RemoveProgress())
}

export async function RunWithOnlineUpdate() {
  if (isFatalError()) return

  if (!document.getElementById(EUI.Progress) && !IsWebView()) {
    Progress()
  }

  const processResponse = (response) => {
    if (!response) {
      const message = t(Translations.githubUnavailable)
      Logger.log(message)
      showToast(message)
      ExecuteScript()
      return
    }

    const version = response?.tag_name
    if (!version) {
      const message = 'Can\'t get an online version of the script'
      Logger.log(message)
      console.error(JSON.stringify(response))
      showToast(message)
      ExecuteScript()
      return
    }

    if (version === EUI.Version) {
      Logger.log('Latest version already loaded')
      localStorage.setItem(EUI.Online, 0)
      ExecuteScript()
      return
    }

    const a = version.split('.').map(x => +x)
    const b = EUI.Version.split('.').map(x => +x)

    if (a[0] < b[0] || (a[0] === b[0] && (a[1] < b[1] || (a[1] === b[1] && a[2] < b[2])))) {
      const message = 'Hello, time traveler!'
      Logger.log(message)
      showToast(message)
      localStorage.setItem(EUI.Online, 0)
      ExecuteScript()
      return
    }

    Logger.log(`Online update (${version}) found, trying to inject the script...`)
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
  const timeout = 10000
  let onlineInUse = Nodes.GetId(EUI.Id) || IsWebView() /* APK */

  if (!onlineInUse && window.fetch) {
    try {
      //showToast(t(Translations.githubCheckingUpdates))
      UpdateProgressStatus(t(Translations.githubCheckingUpdates))
      if (/firefox/i.test(window.navigator.userAgent)) await new Promise(r => setTimeout(r, 50))
      await fetch(releaseUrl, { signal: AbortSignal.timeout(timeout) })
      .then(r => r.json())
      .then(x => processResponse(x))
    }
    catch (error) {
      if (error.name === 'TimeoutError') {
        const message = `[TimeoutError] ${t(Translations.githubUnavailable)}\r\n It took more than ${(timeout/100).toFixed(0)} seconds to get the result!`
        Logger.error(message)
        showToast(message)
      }
      else if (error.name === 'AbortError') {
        const message = '[AbortError] Fetch aborted by user action (browser stop button, closing tab, etc.'
        Logger.error(message)
        showToast(message)
      }
      else if (error.name === 'TypeError' && error.message.includes('abort')) {
        console.error('[TypeError] AbortSignal.timeout() method is not supported')
      }
      else if (['Failed to fetch', 'NetworkError when attempting to fetch resource.'].includes(error.message)) {
        const message = t(Translations.githubUnavailable)
        Logger.error(message)
        showToast(message)
      }
      else {
        Logger.error(error)
        showToast(`[Unexpected error] ${error.message}`)
      }

      ExecuteScript() // fallback
    }
  }
  else {
    ExecuteScript()
  }
}