import { AddDiscoverProgress, DiscoverChanged } from './discoverButton'
import { DisableDrawButton, PointStatsChanged } from './drawButton'
import { EUI, Events, Sleep } from './constants'
import { ProfileStatsChanged, RemoveBadges, RenderBadges } from './badges'
import AddAnimations from './animations'
import AddCanvasStyles from './canvasStyles'
import AddColorScheme from './colorScheme'
import AddHighContrast from './highContrast'
import AddReferenceSearch from './referenceSearch'
import AddStyles from './styles'
import BeautifyCloseButtons from './closeButtons'
import ButtonIcons from './buttonIcons'
import ImportExport from './importExport'
import Informer from './informer'
import { Private } from './private'
import ZenMode from './zenMode'

const ExecuteScript = () => {

  const InitObserver = ({ target, config, callback }) =>
    target && config && callback && new MutationObserver(callback).observe(target, config)

  const InitObservers = () => [PointStatsChanged, ProfileStatsChanged, DiscoverChanged]
    .forEach(o => InitObserver(o))

  window.addEventListener(Events.onLoad, function () {
    Sleep(1400)
      .then(() => {
        AddStyles()
        AddHighContrast()
        AddAnimations()
        AddColorScheme()
        ButtonIcons()
        InitObservers()
        DisableDrawButton()
        RemoveBadges()
        AddDiscoverProgress()
        RenderBadges()
        AddReferenceSearch()
        ZenMode()
      })
  }, false)

  window.addEventListener(
    Events.onLoad,
    async function () {
      await Sleep(1500) // sleep for a while to make sure SBG is loaded
      await Promise.all([
        Informer(), AddCanvasStyles(), BeautifyCloseButtons(), ImportExport(), Private && (Private()),
      ])
    },
    false
  )
}

const RunWithOnlineUpdate = async () => {
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
      ExecuteScript()
      return
    }

    if (version < EUI.Version) {
      console.log('Hello, time traveler!')
      ExecuteScript()
      return
    }

    console.log(`Online update (${version}) found, trying to inject the script...`)

    const script = document.createElement('script')
    script.id = EUI.Id
    script.src = `https://github.com/egorantonov/sbg-enhanced/releases/download/${version}/index.js`
    script.defer = true
    script.async = true
    script.type = 'text/javascript'
    document.head.appendChild(script)
  }

  const releaseUrl = 'https://api.github.com/repos/egorantonov/sbg-enhanced/releases/latest'
  let onlineInUse = document.getElementById(EUI.Id)

  if (!onlineInUse) {
    await fetch(releaseUrl)
      .then(r => r.json())
      .then(x => processResponse(x))
  }
  else {
    ExecuteScript()
  }


}

RunWithOnlineUpdate()