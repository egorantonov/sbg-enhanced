import { AddDiscoverProgress, DiscoverChanged } from './discoverButton'
import { DisableDrawButton, PointStatsChanged } from './drawButton'
import { Events, Sleep } from './constants'
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

const InitObserver = ({target, config, callback}) =>
  target && config && callback && new MutationObserver(callback).observe(target, config)
  
const InitObservers = () => [PointStatsChanged, ProfileStatsChanged, DiscoverChanged]
  .forEach(o => InitObserver(o))

window.addEventListener(Events.onLoad, function () {
  Sleep(1500)
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
    await Sleep(1600) // sleep for for a while to make sure SBG is loaded
    await Promise.all([
      Informer(), AddCanvasStyles(), BeautifyCloseButtons(), ImportExport(), Private && (Private()),
    ])
  },
  false
)
