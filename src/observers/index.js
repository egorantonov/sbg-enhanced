
import { DiscoverChanged } from '../discoverButton'
import { PointStatsChanged } from '../drawButton'
import { ProfileStatsChanged } from '../badges'
import { ImageChanged } from '../cache'

const InitObserver = ({ target, config, callback }) =>
  target && config && callback && new MutationObserver(callback).observe(target, config)

export default function InitObservers() { 
  [PointStatsChanged(), ProfileStatsChanged(), DiscoverChanged(), ImageChanged()].forEach(o => InitObserver(o))
}
