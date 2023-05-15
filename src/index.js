import { AddDiscoverProgress, DiscoverChanged } from './discoverButton'
import { DisableDrawButton, PointStatsChanged } from './drawButton'
import { Events, Sleep } from './constants'
import { ProfileStatsChanged, RemoveBadges, RenderBadges } from './badges'
import AddAnimations from './animations'
import AddCanvasStyles from './canvasStyles'
import AddHighContrast from './highContrast'
import AddIngressVibes from './ingressVibes'
import AddReferenceSearch from './referenceSearch'
import AddStyles from './styles'
import BeautifyCloseButtons from './closeButtons'
import ButtonIcons from './buttonIcons'
import Informer from './informer'
import Private from './private'

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
      ButtonIcons()
      AddIngressVibes()
      InitObservers()
      DisableDrawButton()
      RemoveBadges()
      AddDiscoverProgress()
      RenderBadges()
      AddReferenceSearch()
  })
}, false)

window.addEventListener(
  Events.onLoad,
  async function () {
    await Sleep(1600) // sleep for for a while to make sure SBG is loaded
    await Promise.all([
      Informer(), AddCanvasStyles(), BeautifyCloseButtons(), Private()
    ])
  },
  false
)
