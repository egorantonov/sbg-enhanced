;(async function main() {
  const is_mobile = isMobile()
  if (!is_mobile) return switchLoading(null, false)

  const SBG_FLAVOR = 'Stock/0.7.1'
  const Packages = [
    'jQuery', 'OpenLayers',
    'i18next', 'Splide.js',
    'Toastify.js', 'Popper'
  ]
  const pkg_avail = [
    typeof $, typeof ol,
    typeof i18next, typeof Splide,
    typeof Toastify, typeof Popper
  ]
  const pkg_fail = pkg_avail.findIndex(f => f === 'undefined')
  if (pkg_fail !== -1) {
    const _text = `Failed to load the ${Packages[pkg_fail]} package. Please try again later.`
    const div = document.createElement('div')
    div.className = 'fatal-error'
    div.innerText = pkg_fail === 2
      ? _text
      : i18next.t('popups.package-fail', { name: Packages[pkg_fail] }) || _text
    document.body.innerHTML = ''
    document.body.style.display = 'grid'
    document.body.append(div)
    return
  }
  Storage.prototype.getJson = function(k){return JSON.parse(this.getItem(k))??getLocalStorageDefault(k)}
  Storage.prototype.setJson = function(k,v){this.setItem(k,JSON.stringify(typeof v==='undefined'?getLocalStorageDefault(k):v))}
  Storage.prototype.updateJson = function(k,p,v){const _=this.getJson(k),ap=p.split('.');let i=1,r=_[ap[0]];for(;i<ap.length-1;i++)r=r[ap[i]];if(ap.length>1)r[ap.at(-1)]=v;else _[ap[0]]=v;this.setJson(k,_)}

  initSettings() // это создает настройки
  let is_dark = getSettings('theme') == 'auto'
    ? matchMedia('(prefers-color-scheme: dark)').matches
    : getSettings('theme') == 'dark'

  switchLoading('i18n')
  const LANG = getSettings('lang') == 'sys' ? getLanguage() : getSettings('lang')
  const META = await (await fetch('/i18n/meta.json')).json()
  await i18next.use(i18nextHttpBackend).init({
    lng: LANG,
    supportedLngs: META.supported,
    fallbackLng: META.fallbacks,
    backend: {
      loadPath: './i18n/{{lng}}.json',
      queryStringParams: {
        rev: window.I18NRV
      }
    },
    defaultNs: 'main',
    ns: ['main'],
    load: 'languageOnly'
  })

  switchLoading('const')

  const G2T = [[], [1], [2, 4, 5], [3], [6, 7]]
  const USABLE = [6, 7]
  const RANGE = 45
  const LINES_LIMIT_OUT = 30
  const INVENTORY_LIMIT = 3000
  const COOLDOWN = 90
  const BURNOUT = 3600
  const REF_LIMIT = 100

  const LevelTargets = [1500, 5000, 12500, 25000, 60000, 125000, 350000, 675000, 1000000, Infinity]
  const Levels = []
  for (let i = 0; i < LevelTargets.length; i++) {
    const obj = { lv: i + 1, target: LevelTargets[i], total: 0 }
    for (let j = i; j > 0; j--) obj.total += LevelTargets[j - 1]
    Levels.push(obj)
  }
  const ItemTypes = [
    i18next.t('items.unknown'),
    i18next.t('items.types.core'),
    i18next.t('items.types.catalyser'),
    i18next.t('items.types.reference'),
    i18next.t('items.types.broom'),
    i18next.t('items.types.eraser'),
    i18next.t('items.types.uporin'),
    i18next.t('items.types.lens'),
  ]
  const Cores = [
    { lv: 0, eng: 0, lim: 0 }, { lv: 1, eng: 500, lim: 6 },
    { lv: 2, eng: 750, lim: 6 }, { lv: 3, eng: 1000, lim: 4 },
    { lv: 4, eng: 1500, lim: 4 }, { lv: 5, eng: 2000, lim: 3 },
    { lv: 6, eng: 2500, lim: 3 }, { lv: 7, eng: 3500, lim: 2 },
    { lv: 8, eng: 4000, lim: 2 }, { lv: 9, eng: 5250, lim: 1 },
    { lv: 10, eng: 6500, lim: 1 }
  ]
  const Catalysers = [
    { lv: 0, range: 0 }, { lv: 1, range: 42 }, { lv: 2, range: 48 },
    { lv: 3, range: 58 }, { lv: 4, range: 72 }, { lv: 5, range: 90 },
    { lv: 6, range: 112 }, { lv: 7, range: 138 }, { lv: 8, range: 164 },
    { lv: 9, range: 186 }, { lv: 10, range: 214 }
  ]
  const Weapons = {
    4: { lv: 10, range: RANGE },
    5: { lv: 20, range: 1000 }
  }
  const TeamColors = [
    {
      fill: () => is_dark || getSettings('base') == 'goo' ? '#AAAAAA80' : '#44444480',
      stroke: () => is_dark || getSettings('base') == 'goo' ? '#AAA' : '#444'
    },
    { fill: () => '#BB000080', stroke: () => '#B00' },
    { fill: () => '#00BB0080', stroke: () => '#0B0' },
    { fill: () => '#0088FF80', stroke: () => '#08F' }
  ]
  const LevelColors = ['#FECE5A', '#FFA630', '#FF7315', '#E40000', '#FD2992', '#EB26CD', '#C124E0', '#9627F4', '#6D00F5', '#3A00F7']
  const LightStrokes = ['', '#80F', '#80F', '#F80', '#F80']
  const Badges = {
    physicist: { stat: 'cores_deployed', req: [300, 3000, 15000, 45000, 90000, 180000] },
    saboteur: { stat: 'cores_destroyed', req: [450, 4500, 22500, 67500, 135000, 270000] },
    artist: { stat: 'lines', req: [50, 250, 1000, 5000, 15000, 50000] },
    agronome: { stat: 'regions', req: [30, 150, 600, 3500, 10000, 33333] },
    seeker: { stat: 'discoveries', req: [1000, 5000, 15000, 45000, 100000, 200000] },
    pilgrim: { stat: 'unique_visits', req: [100, 1000, 2500, 7500, 15000, 30000] },
    gatherer: { stat: 'unique_captures', req: [100, 1000, 2500, 7500, 15000, 30000] },
    landlord: { stat: 'captures', req: [100, 1000, 2500, 7500, 15000, 30000] },
    fan: { stat: 'total_days', req: [7, 14, 30, 90, 180, 360] },
    caretaker: { stat: 'guard_point', req: [5, 14, 30, 90, 150, 300] },
    janitor: { stat: 'brooms_used', req: [1, 5, 15, 75, 125, 250] },
  }

  class Bitfield{static MAX_BITS=32;#a=0;#b;size;constructor(r=0,s=Bitfield.MAX_BITS){this.size=s,this.#b=2**s-1,this.#a=r&this.#b};get(t){return!!(this.#a&1<<t)};set(t){return this.#a|=1<<t,this};setAll(){return this.#a=this.#b,this};setWith(t){return this.#a=t&this.#b,this};clr(t){return this.#a&=-1^1<<t,this};clrAll(){return this.#a=0,this};flip(t){return this.get(t)?this.clr(t):this.set(t),this};put(t,u){return!u?this.clr(t):this.set(t),this};isEmpty(){return 0===this.#a};isFull(){return this.#a===this.#b};forEach(t){for(let r=0;r<this.size;r++)t(this.get(r),r)};map(t){let r=[];return this.forEach((s,i)=>r.push(t(s,i))),r};toString(t=10){return this.#a.toString(t)};toNumber(){return this.#a};toArray(){return this.map(t=>t)};toSetArray(){let t=[];return this.forEach((r,s)=>r?t.push(s):void 0),t};[Symbol.iterator](){let t=0;return function*(r){for(;t<r.size;)yield r.get(t),t++}(this)}}
  function flavored_fetch(input,init={}){if(!('headers'in init))init['headers']={};init['headers']['x-sbg-flavor']=SBG_FLAVOR;init['headers']['x-local-time']=new Date().toLocaleString('sv',{timeZoneName:'longOffset'}).replace(/\s/,'T').replace(/\sGMT/,'');return fetch(input,init)}
  class PlayerMoveEvent extends Event{#pos;constructor(pos){super('playermove');this.#pos=pos}get new_position(){return this.#pos}}
  class SettingsChangeEvent extends Event{key;value;constructor(k,v){super('settingschange');this.key=k;this.value=v};flipClass(t,c,i=false){if(typeof this.value!=='boolean')return;const _=(t instanceof Element)?t:document.querySelector(t);if(_===null) return;if(!i&&this.value||i&&!this.value){_.classList.add(c)}else{_.classList.remove(c)}}}
  class TabChangeEvent extends Event{old_tab;new_tab;constructor(o,n){super('tabchange');this.old_tab=+o;this.new_tab=+n}}

  jqueryI18next.init(i18next, $, { useOptionsAttr: true })
  $('html').attr('lang', LANG)
  $('body').localize()
  $('title').text(i18next.t('title'))

  switchLoading('self')
  document.querySelector('.loading-screen__version').textContent = SBG_FLAVOR
  const self_data = {}
  let VERSION
  {
    const { request, response } = await apiQuery('self').catch(({ toast }) => apiCatch(toast))
    if (!response) return switchLoading(null, false)
    Object.assign(self_data, response)
    VERSION = request.headers.get('x-sbg-version')
  }

  updateSelfInfo()
  initSettings() // это применяет настройки

  switchLoading('inventory')
  {
    const { response } = await apiQuery('inventory').catch(({ toast }) => apiCatch(toast))
    if (!response) return switchLoading(null, false)

    localStorage.setJson('inventory-cache', response.i)
    const total = response.i.map(m => m.a).reduce((acc, e) => acc += e, 0)
    $('#self-info__inv').text(total)
      .parent().css('color', total >= INVENTORY_LIMIT ? 'var(--accent)' : '')
    $('#self-info__inv-lim').text(INVENTORY_LIMIT)
  }

  apiQuery('notifs', { latest: localStorage.getJson('pager-data').latest })
    .catch(({ toast }) => apiCatch(toast))
    .then(({ response }) => updateNotifs(response))
  setInterval(() => {
    apiQuery('notifs', { latest: localStorage.getJson('pager-data').latest })
    .catch(({ toast }) => apiCatch(toast))
    .then(({ response }) => updateNotifs(response))
  }, 60e3)

  apiQuery('effects')
    .catch(({ toast }) => apiCatch(toast))
    .then(({ response }) => {
      localStorage.setJson('active-effects', response)
    })
    .finally(updateEffects)
  setInterval(updateEffects, 60e3)

  fetch('/assets/rarities.svg').then(r => r.text().then(xml => $('body').append(xml)))

  switchLoading('ui')
  const player_feature = new ol.Feature({
    geometry: new ol.geom.Point(ol.proj.fromLonLat([0, 0]))
  })
  const player_styles = [
    new ol.style.Style({
      image: new ol.style.Icon({
        src: `/assets/player/${self_data.t}.svg`
      })
    }),
    new ol.style.Style({ // range
      geometry: new ol.geom.Circle(ol.proj.fromLonLat([0, 0]), toOLMeters(RANGE, 1)),
      stroke: new ol.style.Stroke({ color: '#F80', width: 2 })
    }),
    new ol.style.Style({ // blast range
      geometry: new ol.geom.Circle(ol.proj.fromLonLat([0, 0]), 0),
      stroke: new ol.style.Stroke({ color: '#0000', width: 2 })
    }),
    new ol.style.Style({ // max blast range
      geometry: new ol.geom.Circle(ol.proj.fromLonLat([0, 0]), 0),
      stroke: new ol.style.Stroke({ color: '#0000', width: 2, lineDash: [10] }),
      zIndex: 1
    })
  ]
  player_feature.setStyle(player_styles)

  const player_source = new ol.source.Vector({ features: [player_feature] })
  const player_layer = new ol.layer.Vector({ source: player_source, name: 'player', className: 'ol-layer__player', renderBuffer: 250, zIndex: 4 })

  const points_source = new ol.source.Vector()
  const points_layer = new ol.layer.Vector({ source: points_source, name: 'points', className: 'ol-layer__points', zIndex: 3 })

  const lines_source = new ol.source.Vector()
  const temp_lines_source = new ol.source.Vector()
  const lines_layer = new ol.layer.Vector({ source: lines_source, name: 'lines', className: 'ol-layer__lines', zIndex: 2 })
  const temp_lines_layer = new ol.layer.Vector({ source: temp_lines_source, name: 'lines', className: 'ol-layer__lines', zIndex: 2 })

  const regions_source = new ol.source.Vector()
  const regions_layer = new ol.layer.Vector({ source: regions_source, name: 'regions', className: 'ol-layer__regions', zIndex: 1 })

  const FeatureStyles = {
    POINT: (pos, team, energy) => new ol.style.Style({
      geometry: new ol.geom.Circle(pos, 12),
      renderer(coords, state) {
        const ctx = state.context
        const [[xc, yc], [xe, ye]] = coords
        const radius = Math.sqrt((xe - xc) ** 2 + (ye - yc) ** 2)

        ctx.lineWidth = is_mobile ? 6 : 2
        ctx.strokeStyle = TeamColors[team].stroke()
        ctx.fillStyle = TeamColors[team].fill()
        if (energy) {
          ctx.beginPath()
          ctx.arc(xc, yc, radius, ...calculateAngle(energy))
          ctx.lineTo(xc, yc)
          ctx.fill()

          ctx.fillStyle = TeamColors[0].fill()
          ctx.beginPath()
          ctx.arc(xc, yc, radius, ...calculateAngle(1 - energy, energy))
          ctx.lineTo(xc, yc)
          ctx.fill()
        } else {
          ctx.beginPath()
          ctx.arc(xc, yc, radius, 0, 2 * Math.PI)
          ctx.fill()
        }

        ctx.beginPath()
        ctx.arc(xc, yc, radius, 0, 2 * Math.PI)
        ctx.stroke()
      },
      zIndex: 2
    }),
    TEXT: (text) => new ol.style.Style({
      text: new ol.style.Text({
        font: '14px Manrope',
        offsetY: -15,
        text,
        fill: new ol.style.Fill({ color: '#000' }),
        stroke: new ol.style.Stroke({ color: '#FFF', width: 3 })
      }),
      zIndex: 3
    }),
    LIGHT: (pos, ids, values) => new ol.style.Style({
      geometry: new ol.geom.Circle(pos, 12),
      renderer(coords, state) {
        if (ids === 0 && navi_state.point?.g !== state.feature.getId()) return

        const ctx = state.context
        const [[xc, yc], [xe, ye]] = coords
        const radius = Math.sqrt((xe - xc) ** 2 + (ye - yc) ** 2)
        const united = (ids & 0xff) === (ids >> 8 & 0xff)
        const offset = is_mobile ? 12 : 4

        ctx.lineWidth = is_mobile ? 6 : 3
        ctx.font = `bold 46px "Manrope"`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'

        if (navi_state.active && navi_state.point?.g === state.feature.getId()) {
          const edge = radius + offset * 2
          ctx.strokeStyle = '#F00'
          ctx.beginPath()
          ctx.arc(xc, yc, edge, 0, 2 * Math.PI)
          ctx.moveTo(xc, yc - edge - offset)
          ctx.lineTo(xc, yc - edge + offset)
          ctx.moveTo(xc, yc + edge + offset)
          ctx.lineTo(xc, yc + edge - offset)
          ctx.moveTo(xc - edge - offset, yc)
          ctx.lineTo(xc - edge + offset, yc)
          ctx.moveTo(xc + edge + offset, yc)
          ctx.lineTo(xc + edge - offset, yc)
          ctx.stroke()
        }

        for (let i = 0; i < 3; i++) {
          const id = ids >> i * 8 & 0xff
          const value = values[id]
          if (typeof value === 'undefined') continue

          const is_text = i === 2
          const sector = Math.PI / 16
          const ccw = i === 0
          const mult = ccw ? -1 : 1

          if (is_text) {
            ctx.strokeStyle = '#000'
            ctx.fillStyle = '#fff'
          }

          switch (id) {
            case 1: case 2:
            case 3: case 4:
              if (!value) continue
              ctx.strokeStyle = LightStrokes[id]
              ctx.beginPath()
              if (united)
                ctx.arc(xc, yc, radius + offset, 0, 2 * Math.PI)
              else
                ctx.arc(xc, yc, radius + offset, mult * sector, Math.PI - mult * sector, ccw)
              ctx.stroke()
              break
            case 5:
              if (!is_text) {
                ctx.beginPath()
                ctx.strokeStyle = LevelColors[value - 1]
                if (united)
                  ctx.arc(xc, yc, radius + offset, 0, 2 * Math.PI)
                else
                  ctx.arc(xc, yc, radius + offset, mult * sector, Math.PI - mult * sector, ccw)
                ctx.stroke()
              } else {
                ctx.strokeText(value, xc, yc)
                ctx.fillText(value, xc, yc)
              }
              break
            case 6:
              if (!value) continue
              if (!is_text) {
                const pellets = 6
                const half = united
                  ? 1.5 * Math.PI / (pellets * 2)
                  : .75 * (Math.PI - sector * 2) / (pellets * 2)

                let angle = united
                  ? -Math.PI / 2
                  : Math.PI - mult * sector * 2
                ctx.fillStyle = is_dark ? '#c380ff' : '#80f'
                ctx.beginPath()
                for (let pellet = 0; pellet < pellets; pellet++) {
                  if (pellet === value) {
                    ctx.fill()
                    ctx.fillStyle = is_dark ? '#c380ff33' : '#80f3'
                    ctx.beginPath()
                  }
                  ctx.arc(xc, yc, radius + offset - ctx.lineWidth / 2, angle - half, angle + half)
                  ctx.arc(xc, yc, radius + offset + ctx.lineWidth / 2, angle + half, angle - half, true)
                  ctx.moveTo(xc, yc)
                  angle += united
                    ? 2 * Math.PI / pellets
                    : -mult * (Math.PI - sector * 2) / pellets
                }
                ctx.fill()
              } else {
                ctx.strokeText(value, xc, yc)
                ctx.fillText(value, xc, yc)
              }
              break
            case 7:
              if (!value) continue
              ctx.strokeText(value, xc, yc)
              ctx.fillText(value, xc, yc)
              break
            case 8:
              if (value === -1) continue
              ctx.strokeText(value, xc, yc)
              ctx.fillText(value, xc, yc)
              break
            case 9:
              if (!value) continue
              ctx.beginPath()
              ctx.strokeStyle = TeamColors[self_data.t].stroke()
              if (united)
                ctx.arc(xc, yc, radius + offset, 0, 2 * Math.PI)
              else
                ctx.arc(xc, yc, radius + offset, mult * sector, Math.PI - mult * sector, ccw)
              ctx.stroke()
              break
            case 10:
              if (!value) continue
              ctx.beginPath()
              ctx.strokeStyle = LightStrokes[1]
              if (united)
                ctx.arc(xc, yc, radius + offset, 0, 2 * Math.PI)
              else
                ctx.arc(xc, yc, radius + offset, mult * sector, Math.PI - mult * sector, ccw)
              ctx.stroke()
            default:
              continue
          }
        }
      },
      zIndex: 3
    }),
  }
  const RHN = []
  const RHA = []
  const RHS = 180 / 8
  for (let rhumb = 0; rhumb <= 8; rhumb++) {
    RHN.push(i18next.t(`info.bearing.rhumbs.${rhumb}`))
    RHA.push(RHS * (rhumb + .5))
  }

  /*class FixedPointRotate extends ol.interaction.Pointer {
    constructor(condition) {
      super({
        handleDownEvent() { return condition() },
        handleDragEvent(event) {
          const { movementX: dx, movementY: dy } = event.originalEvent
          const [cx, cy] = event.map.getPixelFromCoordinate(player_feature.getGeometry().getCoordinates())
          const [rx, ry] = event.pixel
          const phi = Math.atan2(cy - ry - dy, cx - rx - dx) - Math.atan2(cy - ry, cx - rx)
          event.map.getView().adjustRotation(phi, player_feature.getGeometry().getCoordinates())
        },
        handleUpEvent() { return false },
      })
    }
  }*/

  // EPSG:4326 - common
  // EPSG:3857 - webmercator
  const base_layer = new ol.layer.Tile({ className: 'ol-layer__base' })
  setBaselayer('cdb')
  const view = new ol.View({
    center: [0, 0],
    zoom: 17,
    minZoom: 1,
    maxZoom: 20,
    constrainResolution: true,
    constrainRotation: false,
  })
  const ViewOffsets = {
    NORMAL: 165,
    CENTER: -10
  }
  view.setProperties({ offset: [0, ViewOffsets.NORMAL] })
  const map = new ol.Map({
    target: 'map',
    layers: [base_layer, regions_layer, lines_layer, temp_lines_layer, points_layer, player_layer],
    view,
    controls: [
      new ol.control.Zoom(),
      new ol.control.Rotate({
        autoHide: false,
        label: (() => {
          const use = document.createElementNS('http://www.w3.org/2000/svg', 'use')
          use.setAttribute('href', '#fas-location-arrow-up')
          const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
          svg.setAttribute('viewBox', '0 0 512 512')
          svg.setAttribute('height', '1em')
          svg.append(use)
          return svg
        })(),
      }),
      new ol.control.ScaleLine(),
    ],
    interactions: [
      // new FixedPointRotate(() => document.querySelector('#toggle-follow').checked),
      new ol.interaction.DragPan({
        condition: () => !document.querySelector('#toggle-follow').checked,
        kinetic: new ol.Kinetic(-.005, .05, 100),
      }),
      new ol.interaction.PinchZoom(),
      new ol.interaction.PinchRotate(),
      new ol.interaction.DblClickDragZoom(),
    ],
  })
  map.setProperties({ ignore_follow: false, is_first_watched: false })
  map.once('rendercomplete', () => {
    setBaselayer()
    $('.ol-layer__base').attr('data-code', getSettings('base'))
    if (getSettings('plrhid') == true) $('.ol-layer__player').addClass('hidden')
  })

  const request_controllers = {
    entities: new AbortController(),
    points: new AbortController(),
    draw: new AbortController(),
    profile: new AbortController(),
  }

  ;(async function handleURLLinks() {
    const params = new URLSearchParams(location.search)
    history.replaceState({}, '', location.pathname)
    if (params.has('point')) {
      switchLoadingAsync('link')
      const guid = params.get('point')
      if (!guid.match(/^[a-z\d]{12}\.22a$/)) return
      map.setProperties({ ignore_follow: true })
      const { response } = await apiQuery('point', { guid }).catch(({ toast }) => apiCatch(toast))
      document.querySelector('#toggle-follow').checked = false
      localStorage.setItem('follow', false)
      view.setCenter(ol.proj.fromLonLat(response.data.c))
      await showInfo(response.data)
      switchLoadingAsync('link', true)

    } else if (params.has('player')) {
      switchLoadingAsync('link')
      const query = params.get('player')
      if (!query.match(/^[a-z\d<>]+$/i)) return
      await openProfile(query)
      switchLoadingAsync('link', true)

    } else if (params.has('ll')) {
      switchLoadingAsync('link')
      const query = params.get('ll')
      const [lon, lat] = query.split(',').map(m => parseFloat(m))
      if (isNaN(lon) || isNaN(lat)) return
      if (Math.abs(lon) > 180 || Math.abs(lat) > 90) return

      map.setProperties({ ignore_follow: true })
      $('#toggle-follow').attr('data-active', false)
      localStorage.setItem('follow', false)
      document.querySelector('#toggle-follow').checked = false
      view.setCenter(ol.proj.fromLonLat([lon, lat]))
      requestEntities()
      switchLoadingAsync('link', true)
    } else if (params.has('pager')) {
      switchLoadingAsync('link')
      const query = params.get('pager')
      const [, name, channel] = atob(query).split('\x1f')
      if (self_data.n === name) {
        switchLoadingAsync('link', true)
        return
      }

      document.addEventListener('pagerready', function() {
        switchLoadingAsync('link', true)
        const tabs = Array.from(document.querySelectorAll('.notifs__tab'))
        tabs.forEach(e => e.classList.remove('active'))
        tabs.find(f => +f.dataset['tab'] === +channel).classList.add('active')
        addMention(name, true)
        document.querySelector('#notifs-menu').dispatchEvent(new Event('click', { bubbles: false }))
      }, { once: true })
    }
  })();

  const near_points = []
  let count_regions = false
  map.on('click', e => {
    const piv = []
    const regions = [0, 0, 0]
    map.forEachFeatureAtPixel(e.pixel, (feature, layer) => {
      const name = layer.get('name')
      if (name === 'points') piv.push(feature.getId())
      if (name === 'regions' && count_regions) regions[feature.getProperties().team - 1]++
    })
    if (count_regions) createToast(String.prototype.concat(
        i18next.t('popups.pick-regions.result'), '<br>',
        i18next.t('score.red'), `: ${regions[0]}; `,
        i18next.t('score.green'), `: ${regions[1]}; `,
        i18next.t('score.blue'), `: ${regions[2]}`
    ), null, 'top right').showToast()
    if (piv.length) {
      showInfo(piv[0])

      const visible = points_source.getFeatures().map(m => {
        const pos = ol.proj.toLonLat(m.getGeometry().getCoordinates())
        return {
          g: m.getId(),
          p: pos,
          d: getDistance(pos)
        }
      })
      near_points.splice(0, Infinity, ...visible.filter(f => f.d <= RANGE).sort((a, b) => b.d - a.d))
    }
  })

  const prev_pos = {
    center: view.getCenter(),
    zoom: view.getZoom(),
    rotation: view.getRotation()
  }
  map.on('moveend', () => {
    const angle = player_styles[0].getImage().getRotation()
    player_styles[0].getImage().setRotation(angle + (view.getRotation() - prev_pos.rotation))
    player_feature.changed()
    prev_pos.rotation = view.getRotation()
    player_styles[1].getGeometry().setRadius(toOLMeters(RANGE))
    if (navi_state.active) {
      const bearing = Math.round(getBearing(navi_state.target) + getViewRotation())
      document.querySelector('#navi-bearing').style.transform = `rotate(${bearing}deg)`
    }

    const zoom = view.getZoom()
    const offset = new ol.geom.LineString([prev_pos.center, view.getCenter()])
    if (ol.sphere.getLength(offset) <= 30 && prev_pos.zoom === zoom) return
    prev_pos.center = view.getCenter()
    prev_pos.zoom = zoom
    requestEntities()
  })
  setInterval(requestEntities, 5 * 60 * 1000)

  switchLoadingAsync('geo')
  setTimeout(() => {
    document.querySelector('.loading-screen__skip')?.classList.remove('hidden')
    document.querySelector('#loading-screen__skip-btn')?.addEventListener('click', () => {
      document.querySelector('.loading-screen').remove()
    })
  }, 10000)
  let watcher
  if ('geolocation' in navigator) {
    watcher = navigator.geolocation.watchPosition(({ coords }) => {
      movePlayer([coords.longitude, coords.latitude])
      document.querySelector('#toggle-follow').checked = localStorage.getItem('follow') !== 'false'
      if (!map.getProperties().is_first_watched) {
        map.setProperties({ is_first_watched: true })
        $('#toggle-follow-btn').prop('disabled', false)
        switchLoadingAsync('geo', true)
      }
    }, error => {
      switchLoadingAsync('geo', false)
      console.error('Geolocation API got an error:', error)
      if (error.code == 1) {
        $('body').empty().css({ display: 'grid' }).append($('<div>', {
          class: 'fatal-error',
          text: i18next.t('popups.gps.denied')
        }))
      } else if (error.code == 2) {
        if (isMobile()) {
          $('body').empty().css({ display: 'grid' }).append($('<div>', {
            class: 'fatal-error',
            text: i18next.t('popups.gps.fail')
          }))
        } else {
          player_source.clear()
          $('#self-info__coord').parent().remove()
          $('#toggle-follow-btn').remove()
        }
      } else {
        const toast = createToast(i18next.t('popups.gps.generic', { code: error.code }))
        toast.options.className = 'error-toast'
        toast.showToast()
      }
    }, {
      enableHighAccuracy: true,
      maximumAge: 0
    })
  } else {
    $('body').empty().css({ display: 'grid' }).append($('<div>', {
      class: 'fatal-error',
      text: i18next.t('popups.gps.unavailable')
    }))
  }

  const timers = {
    info_controls: null, info_cooldown: null,
    player_xpup: null, attack_ring: null,
    score: null,
    damage_texts: [],
    long_tap: null,
    levelup: null,
    refs_data: null,
  }
  const point_state = {
    info: {},
    possible_lines: []
  }
  const navi_state = localStorage.getJson('navi')
  const popup_toasts = []
  const popovers = {
    ref_actions: null,
    info_tools: null,
    profile_tools: null,
  }

  const slider_config = {
    drag: 'free', snap: true, perPage: 3, pagination: false, wheel: true,
    direction: 'ltr', height: 'auto', gap: '.5em', focus: 'center', trimSpace: false
  }
  const attack_slider = new Splide('#attack-slider', slider_config)
  attack_slider.on('click', event => {
    if (attack_slider.index == event.index) return
    attack_slider.go(event.index)
  })
  attack_slider.on('move drag scroll', () => $('#attack-slider-fire').prop('disabled', true))
  attack_slider.on('moved dragged scrolled', () => {
    attack_slider.emit('active', { slide: $(attack_slider.root).find('.splide__slide.is-active') })
  })
  attack_slider.on('active', event => {
    const inventory = localStorage.getJson('inventory-cache')
    const catalyser = inventory.find(f => f.g == $(event.slide).attr('data-guid'))
    const highlevel = catalyser.l > self_data.l
    $('#attack-slider-fire').prop('disabled', highlevel)
    $('.attack-slider-highlevel').css('color', highlevel ? '#F00' : '#0000')
    if (!highlevel && catalyser.t === 2) changeSettings('lastwp', catalyser.l)

    player_styles[3].getGeometry().setRadius(toOLMeters((catalyser.t === 2
      ? Catalysers[catalyser.l]?.range
      : Weapons[catalyser.t]?.range
    ) ?? 0))
    player_feature.changed()
  })
  attack_slider.mount()

  const deploy_slider = new Splide('#deploy-slider', slider_config)
  deploy_slider.on('click', event => {
    if (deploy_slider.index == event.index) return
    deploy_slider.go(event.index)
  })
  deploy_slider.on('move drag scroll', () => $('#deploy').prop('disabled', true))
  deploy_slider.on('moved dragged scrolled', () => {
    deploy_slider.emit('active', { slide: $(deploy_slider.root).find('.splide__slide.is-active') })
  })
  deploy_slider.on('active', manageDeploy)
  deploy_slider.mount()

  slider_config.height = 100
  slider_config.perPage = 3
  slider_config.gap = '1em'
  const draw_slider = new Splide('#draw-slider', slider_config)
  draw_slider.on('click', event => {
    if (draw_slider.index == event.index) return
    draw_slider.go(event.index)
  })
  draw_slider.on('move drag scroll', () => $('#draw-slider-confirm').prop('disabled', true))
  draw_slider.on('moved dragged scrolled', () => {
    draw_slider.emit('active', { slide: $(draw_slider.root).find('.splide__slide.is-active') })
  })
  draw_slider.on('active', manageDrawing)
  draw_slider.mount()

  const hammer_info = new Hammer(document.querySelector('.info'), {
    recognizers: [
      [Hammer.Swipe, { direction: Hammer.DIRECTION_HORIZONTAL }],
    ],
  })
  hammer_info.on('swipeleft swiperight', function(event) {
    const { target, type } = event
    if (!target.classList.contains('info')) {
      let pointer = target.parentElement
      while (pointer) {
        if (pointer.classList.contains('splide')) {
          // игнорируем свайпы внутри карусели
          return false
        }
        if (pointer.classList.contains('info')) break
        pointer = pointer.parentElement
      }
    }

    if (near_points.length <= 1) return

    const guid = document.querySelector('.info').dataset['guid']
    let index = near_points.findIndex(f => f.g === guid)
    switch (type) {
      case 'swipeleft': index++; break
      case 'swiperight': index--; break
    }
    if (index >= near_points.length) index = 0
    if (index < 0) index = near_points.length - 1
    document.querySelector('#draw-count').textContent = '[...]'
    showInfo(near_points[index].g)
  })

  document.body.addEventListener('contextmenu', e => {
    e.preventDefault()
    return false
  })
  $('#self-info__name').attr('data-name', self_data.n)
  $('.profile-link').on('click', openProfile)
  $('.popup-close').on('click', e => {
    const parent = $(e.target).parents('.popup')[0]
    closePopup(parent)
  })
  $('.popup-touch').on('click touchend', function() {
    const parent = this.parentElement
    if (parent.tagName === 'BODY') {
      document.querySelectorAll('.popup:not(.hidden)').forEach(closePopup)
      return
    }
    parent.querySelectorAll('.popup:not(.hidden)').forEach(closePopup)
    parent.parentElement.prepend(this)
  })
  setInterval(function clearExpiredCache() {
    const now = Date.now()
    const cooldowns = localStorage.getJson('cooldowns')
    const refs_cache = localStorage.getJson('refs-cache')
    for (const guid in cooldowns) { if (cooldowns[guid] <= now) delete cooldowns[guid] }
    for (const guid in refs_cache) { if (refs_cache[guid] <= now) delete refs_cache[guid] }
    localStorage.setJson('cooldowns', cooldowns)
    localStorage.setJson('refs-cache', refs_cache)
  }, 5 * 60e3)

  document.querySelector('.info').addEventListener('playermove', function() {
    if (this.classList.contains('hidden') || typeof point_state.info.c === 'undefined') return
    manageControls()
    manageDeploy()
    document.querySelector('#i-stat__distance').textContent = distanceToString(getDistance(point_state.info.c))
    document.querySelector('#i-stat__bearing').style.transform = `rotate(${Math.round(getBearing(point_state.info.c) + getViewRotation())}deg)`
    const visible = points_source.getFeatures().map(m => {
      const pos = ol.proj.toLonLat(m.getGeometry().getCoordinates())
      return {
        g: m.getId(),
        p: pos,
        d: getDistance(pos)
      }
    })
    near_points.splice(0, Infinity, ...visible.filter(f => f.d <= RANGE).sort((a, b) => b.d - a.d))
  })
  document.querySelector('.navi-floater').addEventListener('playermove', updateNavi)

  async function doDiscovery() {
    const parent = this.parentElement
    parent.classList.add('locked')
    Array.from(parent.children).forEach(e => e.setAttribute('disabled', ''))
    const guid = $('.info').attr('data-guid')
    const { response } = await apiSend('discover', 'post', {
      position: ol.proj.toLonLat(player_feature.getGeometry().getCoordinates()),
      guid,
      wish: +this.dataset['wish']
    }, [$('.info')[0], 'top right']).catch(({ toast }) => apiCatch(toast, true))
    parent.classList.remove('locked')
    Array.from(parent.children).forEach(e => e.removeAttribute('disabled'))
    if (!response) return

    const cache = localStorage.getJson('inventory-cache')
    response.loot.forEach(e => {
      const item = cache.find(f => f.g === e.g)
      if (!item) cache.push(e)
      else item.a += e.a
    })
    localStorage.setJson('inventory-cache', cache)

    const total = cache.map(m => m.a).reduce((acc, e) => acc += e)
    $('#self-info__inv').text(total)
      .parent().css('color', total >= INVENTORY_LIMIT ? 'var(--accent)' : '')
    const ref = cache.find(f => f.t === 3 && f.l === $('.info').attr('data-guid'))
    $('#i-ref').text(i18next.t('info.refs', { count: ref?.a || 0, max: REF_LIMIT })).attr('data-has', ref ? 1 : 0)
    if (ref) document.querySelectorAll('.i-flag-btn').forEach(e => e.removeAttribute('disabled'))

    handleExpChange(response.xp)

    if (!getSettings('dsvhid')) {
      const toast = createToast('', $('.info')[0], 'top right')
      if (!response.loot.length) toast.options.text = i18next.t('popups.discovery.none')
      else toast.options.text = i18next.t('popups.discovery.result', { xp: response.xp.diff, loot: response.loot.map(() => '').join('<br>'), interpolation: { escapeValue: false } })
      handlePopupToasts(toast)
      $(toast.toastElement).empty().append(jquerypassargs(
        $('<div>'),
        '$1$<br>$2$',
        $('<span>', { text: i18next.t('popups.discovery.xp', { count: response.xp.diff }) }).css('color', 'var(--progress)'),
        response.loot.map(m => {
          const title = makeDropItemTitle(m)
          if (typeof title === 'string') return `${title} (x${m.a})<br>`
          else {
            title.append(` (x${m.a})<br>`)
            return title
          }
        })
      ))
    }

    const cooldowns = localStorage.getJson('cooldowns')
    cooldowns[guid] = { t: response.next, c: response.remaining }
    localStorage.setJson('cooldowns', cooldowns)
    showCooldownTimer(guid)

    if (!$('.attack-slider-wrp').hasClass('hidden')) {
      const active = document.querySelector('#catalysers-list .is-active').getAttribute('data-guid')
      let new_index = 0
      $('#catalysers-list').empty()
      const predicate = getSettings('atkord')
        ? ((a, b) => a.t === b.t ? a.l - b.l : b.t - a.t)
        : ((a, b) => a.t === b.t ? a.l - b.l : a.t - b.t)
      cache.filter(f => G2T[2].includes(f.t)).sort(predicate).forEach((e, n) => {
        const el = $('<li>', { class: 'splide__slide', 'data-guid': e.g })
        el.attr(e.t > 3 ? 'data-rarity' : 'data-level', e.l)
        el.append($('<span>', { class: 'catalysers-list__level', text: makeShortItemTitle(e) }).css('color', e.t > 3 ? 'var(--text)' : `var(--level-${e.l})`))
          .append($('<span>', { class: 'catalysers-list__amount', text: i18next.t('items.amount', { count: e.a }) }))
        $('#catalysers-list').append(el)
        if (e.g === active) new_index = n
      })
      attack_slider.refresh()
      attack_slider.go(new_index)
    }

    const active = document.querySelector('#cores-list .is-active')?.getAttribute('data-guid') ?? ''
    let new_index = 0
    $('#cores-list').empty()
    cache.filter(f => f.t === 1).sort((a, b) => a.l - b.l).forEach((e, n) => {
      $('#cores-list').append($('<li>', { class: 'splide__slide', 'data-guid': e.g, 'data-level': e.l })
        .append($('<span>', { class: 'cores-list__level', text: i18next.t('items.core-short', { level: romanize(e.l) }) }).css('color', `var(--level-${e.l})`))
        .append($('<span>', { class: 'cores-list__amount', text: i18next.t('items.amount', { count: e.a }) }))
      )
      if (e.g === active) new_index = n
    })
    deploy_slider.refresh()
    deploy_slider.go(new_index)
  }
  $('#discover').on('click', doDiscovery)
  document.querySelectorAll('.discover-mod').forEach(e => e.addEventListener('click', doDiscovery))
  $('#deploy').on('click', async () => {
    const state = $('#deploy').attr('data-state')
    $('#deploy').addClass('locked').prop('disabled', true)
    const guid = $('#cores-list li').eq(deploy_slider.index).attr('data-guid')
    let xp
    if (state === 'deploy') {
      const { response } = await apiSend('deploy', 'post', {
        guid: $('.info').attr('data-guid'),
        core: guid,
        position: ol.proj.toLonLat(player_feature.getGeometry().getCoordinates())
      }, [$('.info')[0], 'top right']).catch(({ toast }) => apiCatch(toast, true))
      $('#deploy').removeClass('locked').prop('disabled', false)
      if (!response) return
      response.data.gu = point_state.info.gu
      showInfo(response.data)
      xp = response.xp
    } else if (state === 'upgrade') {
      const { response } = await apiSend('deploy', 'post', {
        guid: $('.info').attr('data-guid'),
        core: guid,
        slot: $('.i-stat__core.selected').attr('data-guid'),
        position: ol.proj.toLonLat(player_feature.getGeometry().getCoordinates())
      }, [$('.info')[0], 'top right']).catch(({ toast }) => apiCatch(toast, true))
      $('#deploy').removeClass('locked').prop('disabled', false)
      if (!response) return
      const core = point_state.info.co.find(f => f.g == response.c.g)
      core.l = response.c.l
      core.e = response.c.e
      core.o = response.c.o
      $('#i-level').text(i18next.t('info.level', { count: response.l })).css('color', `var(--level-${response.l})`)
      $(`.i-stat__core[data-guid="${response.c.g}"]`).text(romanize(response.c.l)).css({
        '--energy': `${response.c.e}%`,
        '--bgc': `var(--level-${response.c.l})`
      })
      const info = $(`.i-stat__core-info[data-guid="${response.c.g}"] span`)
      info.eq(0).text(Math.floor(response.c.e / Cores[response.c.l].eng * 100) + '%').attr('title', `${response.c.e} / ${Cores[response.c.l].eng}`)
      info.eq(1).text(response.c.o)
      xp = response.xp
    }

    // обновляем инвентарь
    const inventory = localStorage.getJson('inventory-cache')
    const index = inventory.findIndex(f => f.g == guid)
    const item = inventory[index]
    if (--item.a == 0) {
      inventory.splice(index, 1)
      $(`#cores-list [data-guid="${guid}"]`).remove()
      deploy_slider.go('<')
    } else {
      $(`#cores-list [data-guid="${guid}"] .cores-list__amount`).text(`x${item.a}`)
    }
    deploy_slider.refresh()
    localStorage.setJson('inventory-cache', inventory)
    manageDeploy()

    // обновляем данные
    const total = inventory.map(m => m.a).reduce((acc, e) => acc += e)
    $('#self-info__inv').text(total)
      .parent().css('color', total >= INVENTORY_LIMIT ? 'var(--accent)' : '')
    handleExpChange(xp)
  })
  $('#repair').on('click', async () => {
    $('#repair').addClass('locked').prop('disabled', true)
    const guid = $('.info').attr('data-guid')
    const { response } = await apiSend('repair', 'post', {
      guid,
      position: ol.proj.toLonLat(player_feature.getGeometry().getCoordinates())
    }, [$('.info')[0], 'top right']).catch(({ toast }) => apiCatch(toast, true))
    $('#repair').removeClass('locked').prop('disabled', false)
    if (!response) return

    handleExpChange(response.xp)

    if ($('.info').hasClass('hidden')) return

    const formatter = new Intl.NumberFormat(LANG, { maximumFractionDigits: 1 })
    let eng = 0
    let eng_total = 0
    response.data.co.forEach(core => {
      const info = $(`.i-stat__core-info[data-guid="${core.g}"]`)
      const box = $(`.i-stat__core[data-guid="${core.g}"]`)
      const energy = core.e / Cores[core.l].eng * 100
      info.find('span').eq(0)
        .text(formatter.format(energy) + '%')
        .attr('title', `${core.e} / ${Cores[core.l].eng}`)
      info.find('.profile-link').attr('data-name', core.o).text(core.o)
      box.text(romanize(core.l)).css({
        '--energy': energy + '%',
        '--bgc': `var(--level-${core.l})`
      })
      eng += core.e; eng_total += Cores[core.l].eng
      const state = point_state.info.co.find(f => f.g === core.g)
      if (state) {
        state.l = core.l
        state.e = core.e
        state.o = core.o
      }
    })
    manageControls()

    point_state.info.o = response.data.o
    point_state.info.l = response.data.l
    point_state.info.te = response.data.te
    point_state.info.co = response.data.co

    const feature = points_source.getFeatureById(guid)
    if (feature) {
      feature.getStyle()[0] = FeatureStyles.POINT(ol.proj.fromLonLat(point_state.info.c), point_state.info.te, eng / eng_total)
      feature.changed()
    }
  })
  $('#draw').on('click', async () => {
    $('#draw').addClass('locked').prop('disabled', true)
    const guid = $('.info').attr('data-guid')
    if (!point_state.possible_lines.length) {
      request_controllers.draw.abort('0x00')
      request_controllers.draw = new AbortController()
      const { response } = await apiQuery('draw', {
        guid,
        position: ol.proj.toLonLat(player_feature.getGeometry().getCoordinates()),
        exref: localStorage.getJson('settings')?.exref
      }, [$('.info')[0], 'top right']).catch(({ toast }) => apiCatch(toast, true))
      if (!response) return
      point_state.possible_lines = response.data
    }
    $('#draw').removeClass('locked').prop('disabled', false)
    view.setProperties({ offset: [0, ViewOffsets.CENTER] })
    if (!point_state.possible_lines.length) {
      const toast = createToast(i18next.t('popups.lines-none'), $('.info')[0], 'top right')
      handlePopupToasts(toast)
      return
    }
    temp_lines_source.clear()
    closePopup(document.querySelector('.info'))
    $('.topleft-container, .bottomleft-container, .ol-attribution').addClass('hidden')
    $('.draw-slider-wrp').removeClass('hidden').attr({
      'data-guid': guid,
      'data-follow': localStorage.getItem('follow') ?? true
    })
    localStorage.setItem('follow', false)
    document.querySelector('#attack-menu').setAttribute('disabled', '')
    document.querySelector('.attack-slider-wrp').classList.add('hidden')
    player_styles[3].getStroke().setColor('#0000')
    $('#refs-list').empty()
    point_state.possible_lines.forEach(e => {
      const entry = $('<li>', { class: 'splide__slide', 'data-ref': e.r, 'data-point': e.p, 'data-fav': e.f })
        .append($('<div>', { class: 'refs-list__title', text: e.t }))
        .append($('<div>', { class: 'refs-list__image' }).append($('<div>').css('background-image', `url(${getPointImage(e.i)})`)))
        .append($('<div>', { class: 'refs-list__info' })
          .append($('<span>', { class: 'refs-list__distance', text: distanceToString(e.d) }))
          .append($('<span>', { class: 'refs-list__amount', text: i18next.t('items.amount', { count: e.a }) }))
      )
      if (e.f) {
        entry.find('.refs-list__title').prepend($('<svg viewBox="0 0 576 576" width="1em"><use href="#fas-star"></use></svg>'))
      }
      $('#refs-list').append(entry)
    })
    draw_slider.go(0)
    draw_slider.refresh()
  })

  $('#ops').on('click', async () => {
    if (!$('.inventory').hasClass('hidden')) return $('.inventory').addClass('hidden')
    $('#ops').prop('disabled', true)
    const { response } = await apiQuery('inventory').catch(({ toast }) => apiCatch(toast))
    $('#ops').prop('disabled', false)
    if (!response) return

    $('.inventory').removeClass('hidden')
    localStorage.setJson('inventory-cache', response.i)
    const total = response.i.reduce((acc, e) => acc += e.a, 0)
    $('#self-info__inv').text(total)
      .parent().css('color', total >= INVENTORY_LIMIT ? 'var(--accent)' : '')
    drawInventory()

    const content = document.querySelector('.inventory__content')
    if (content.getAttribute('data-tab') == 3) {
      const order = localStorage.getJson('refs-arrangement')
      const top = localStorage.getJson('refs-view').scroll ?? 0

      if (order !== null) {
        // пересортируем, чтобы новые рефы туда тоже попали
        if ((order.t ?? 0) + 5 * 60e3 <= Date.now()) {
          const view = localStorage.getJson('refs-view')
          const btn = document.querySelector('.inventory__sorter button[type="submit"]')
          const params = Object.assign({}, view)
          delete params.scroll

          btn.setAttribute('disabled', '')
          const { response } = await apiQuery('refs', params, [document.querySelector('.inventory')])
            .catch(({ toast }) => apiCatch(toast, true))
            .finally(() => btn.removeAttribute('disabled'))

          order.a = response
          localStorage.setJson('refs-arrangement', { a: response, t: Date.now() })
        }
        arrangeInventoryRefs(order.a)
      }
      content.scrollTo({ top })
      if (order === null) getRefsData(content)
    }
  })
  $('#inventory__close').on('click', () => {
    $('.inventory').addClass('hidden')
    $('.inventory__item').removeClass('selected').off('click')
    $('#inventory-delete').attr('data-del', 0).text(i18next.t('buttons.select'))
    $('#inventory-cancel').remove()
    $('.inventory__manage-amount').addClass('hidden').removeAttr('data-guid')
    $('.inventory__ma-amount').val(1).removeAttr('max')
    selected_items.splice(0, Infinity)
  })
  $('.inventory__tab').on('click', async function() {
    if ($('#inventory-delete').attr('data-del') != 0) return
    const tab = document.querySelector('.inventory__tab.active')
    const new_tab = this
    if (tab.dataset['tab'] === new_tab.dataset['tab']) return

    tab.classList.remove('active')
    new_tab.classList.add('active')
    document.querySelector('.inventory__content').dispatchEvent(new TabChangeEvent(tab.dataset['tab'], new_tab.dataset['tab']))
  })
  $('.inventory__content').on('scroll', e => getRefsData(e.target))
  document.querySelector('.inventory__content').addEventListener('tabchange', async function(event) {
    drawInventory()
    if (event.old_tab == 3) destroyPopover('ref_actions')

    if (event.new_tab == 3) {
      const order = localStorage.getJson('refs-arrangement')
      const top = localStorage.getJson('refs-view').scroll ?? 0
      if (order !== null) {
        if ((order.t ?? 0) + 5 * 60e3 <= Date.now()) {
          const view = localStorage.getJson('refs-view')
          const btn = document.querySelector('.inventory__sorter button[type="submit"]')
          const params = Object.assign({}, view)
          delete params.scroll

          btn.setAttribute('disabled', '')
          const { response } = await apiQuery('refs', params, [document.querySelector('.inventory')])
            .catch(({ toast }) => apiCatch(toast, true))
            .finally(() => btn.removeAttribute('disabled'))

          order.a = response
          localStorage.setJson('refs-arrangement', { a: response, t: Date.now() })
        }
        arrangeInventoryRefs(order.a)
      }
      this.scrollTo({ top })
      if (order === null) getRefsData(this)
    }
  })

  const selected_items = []
  $('#inventory-delete').on('click', async e => {
    if (selected_items.length) { // удаляем
      $('#inventory-delete').prop('disabled', true)
      const tab = +$('.inventory__tab.active').attr('data-tab')
      const { response } = await apiSend('inventory', 'delete', {
        selection: selected_items,
        tab
      }, [$('.inventory')[0], 'bottom left']).catch(({ toast }) => apiCatch(toast))
      $('#inventory-delete').prop('disabled', false)
      if (!response) return

      let inventory = localStorage.getJson('inventory-cache')
      $('.inventory__item').removeClass('selected').off('click')
      $(e.target).attr('data-del', 0).text(i18next.t('buttons.select'))
      $('#inventory-cancel').remove()
      destroyPopover('ref_actions')

      selected_items.forEach(e => {
        $(`.inventory__item[data-guid="${e}"]`).remove()
        $(`.splide__slide[data-guid="${e}"]`).remove()
      })
      attack_slider.refresh()
      if (tab == 2 && response.count[tab] == 0)
        $('.attack-slider-wrp').addClass('hidden')
      inventory = inventory.filter(f => !selected_items.includes(f.g))
      localStorage.setJson('inventory-cache', inventory)
      selected_items.splice(0, Infinity)

      $('.inventory__tab.active .inventory__tab-counter').text(response.count[tab])
      $('#self-info__inv').text(response.count.total)
        .parent().css('color', response.count.total >= INVENTORY_LIMIT ? 'var(--accent)' : '')
    } else if ($(e.target).attr('data-del') == 0) { // выбираем
      $('.inventory__manage-amount').addClass('hidden').removeAttr('data-guid')
      $('.inventory__ma-amount').val(1).removeAttr('max')
      destroyPopover('ref_actions')

      $(e.target).attr('data-del', 1).text(i18next.t('buttons.delete'))
      .after($('<button>', {
        id: 'inventory-cancel',
        text: i18next.t('buttons.cancel')
      }).on('click', ev => {
        $('.inventory__item').removeClass('selected').off('click.select')
        $(e.target).attr('data-del', 0).text(i18next.t('buttons.select'))
        $(ev.target).remove()
        selected_items.splice(0, Infinity)
      }))
      $('.inventory__item').on('click.select', e => {
        const element = $(e.currentTarget)
        const guid = element.attr('data-guid')
        const index = selected_items.findIndex(f => f == guid)
        if (index === -1) {
          selected_items.push(guid)
          element.addClass('selected')
        } else {
          selected_items.splice(index, 1)
          element.removeClass('selected')
        }
      })
    }
  })
  document.querySelector('#inventory-sort').addEventListener('click', () => {
    document.querySelector('.inventory__sorter').classList.toggle('hidden')
  })
  $('.inventory__ma-counter button').on('click', e => {
    const input = $('.inventory__ma-amount')
    const max = input.attr('max')
    let new_val = input.val()
    switch ($(e.target).attr('data-type')) {
      case 'minus':
        new_val--
        if (new_val < 1) new_val = max
        break
      case 'plus':
        new_val++
        if (new_val > max) new_val = 1
        break
    }
    input.val(new_val)
  })
  $('.inventory__ma-cancel').on('click', () => {
    $('.inventory__manage-amount').addClass('hidden').removeAttr('data-guid')
    $('.inventory__ma-amount').val(1).removeAttr('max')
    document.body.prepend(document.querySelector('.popup-touch'))
  })
  $('.inventory__ma-delete').on('click', e => {
    deleteInventoryItem($(e.target).parents().eq(1))
  })
  ;(function initSorterInputs() {
    const wrp = document.querySelector('.inventory__sorter')
    const view = localStorage.getJson('refs-view')
    if (view !== null) {
      const teams = new Bitfield(view.t)
      wrp.querySelector(`[name="q"][value="${view.q}"]`).checked = true
      wrp.querySelector(`[name="o"][value="${view.o}"]`).checked = true
      wrp.querySelectorAll('[name="t"]').forEach(e => e.checked = teams.get(+e.value))
    }
  })();
  document.querySelector('.inventory__sorter').addEventListener('submit', async function(event) {
    event.preventDefault()

    const view = localStorage.getJson('refs-view')
    const query = +this.querySelector('[name="q"]:checked').value
    const order = +this.querySelector('[name="o"]:checked').value

    view.q = query
    view.o = order
    if (query === 3) {
      const pos = ol.proj.toLonLat(player_feature.getGeometry().getCoordinates())
      view.p = pos
    }
    if (query !== 4) {
      const teams = new Bitfield(0, 4)
      this.querySelectorAll('[name="t"]:checked').forEach(el => teams.set(el.value))
      view.t = teams.toNumber()
    }

    const params = Object.assign({}, view)
    delete params.scroll
    const btn = this.querySelector('[type="submit"]')
    btn.setAttribute('disabled', '')

    const { response } = await apiQuery('refs', params, [this]).catch(({ toast }) => apiCatch(toast, true))
    btn.removeAttribute('disabled')

    arrangeInventoryRefs(response)
    this.classList.add('hidden')
    localStorage.setJson('refs-view', view)
    localStorage.setJson('refs-arrangement', { a: response, t: Date.now() })
  })
  document.querySelectorAll('.inventory__sorter input[name="q"]').forEach(el => el.addEventListener('change', e => {
    const disabled = e.currentTarget.value == 4
    document.querySelectorAll('.inventory__sorter input[name="t"]').forEach(el => {
      el[disabled ? 'setAttribute' : 'removeAttribute']('disabled', '')
    })
  }))
  document.querySelector('.inventory__ma-use').addEventListener('click', async function() {
    const parent = this.parentNode.parentNode
    const guid = parent.getAttribute('data-guid')
    this.setAttribute('disabled', '')

    const { response } = await apiSend('use', 'post',
      { guid },
      [document.querySelector('.inventory'), 'bottom left'])
    .catch(({ toast }) => apiCatch(toast))
    this.removeAttribute('disabled')
    parent.classList.add('hidden')
    parent.removeAttribute('data-guid')

    const effects = localStorage.getJson('active-effects')
    const cached = effects.find(f => f.t === response.t)
    if (typeof cached !== 'undefined')
      cached.x = response.x
    else
      effects.push({ t: response.t, x: response.x, i: response.i })
    localStorage.setJson('active-effects', effects)
    updateEffects()

    const item = document.querySelector(`.inventory__item[data-guid="${guid}"]`)
    if (item !== null) {
      item.querySelector('.inventory__item-descr').textContent = 'x' + response.r
      if (response.r <= 0) item.remove()
    }
  })
  const RA_BUTTONS_DATA = {
    favorite: { off: 0, ico: ['fa-star', 'fas-star'], key: 'fav' },
    locked:   { off: 1, ico: ['fas-lock-open', 'fas-lock'], key: 'lock' },
  }
  document.querySelectorAll('.inventory__ra-item button').forEach(e => {
    e.addEventListener('click', async function() {
      if (popovers.ref_actions === null) return

      const guid = popovers.ref_actions.state['guid']
      const flag = this.dataset['flag']
      if (!guid || !flag) return

      this.setAttribute('disabled', '')
      const { response } = await apiSend('marks', 'post', { guid, flag }, [document.querySelector('.inventory'), 'top right'])
        .catch(({ toast }) => apiCatch(toast))
        .finally(() => this.removeAttribute('disabled'))
      if (!response) return

      const result = response.result
      const { key, ico, off } = RA_BUTTONS_DATA[flag]
      this.querySelector('span').textContent = i18next.t('inventory.reference.actions.' + (result ? 'un' + key : key))
      this.querySelector('use').setAttribute('href', '#' + (result ? ico[1] : ico[0]))

      const entry = document.querySelector(`.inventory__item[data-guid="${guid}"]`)
      if (entry === null) return
      if (result) {
        if (entry.querySelector('.inventory__ici-' + flag) === null) {
          $(entry).find('.level-pill').after(`<svg class="inventory__ici-${flag}" viewBox="0 0 576 576" width="1em"><use href="#${ico[1]}"></use></svg>`)
        }
      } else {
        entry.querySelector('.inventory__ici-' + flag).remove()
      }

      const inventory = localStorage.getJson('inventory-cache')
      const item = inventory.find(f => f.g === guid)
      if (typeof item !== 'undefined') {
        const bf = new Bitfield(item.f)
        bf.put(off, result)
        item.f = bf.toNumber()
        localStorage.setJson('inventory-cache', inventory)
      }
    })
  })

  $('#i-ref').on('click', () => {
    const shadow = document.querySelector('.popup-touch')
    const cache = JSON.parse(localStorage.getItem('inventory-cache') || '[]')
      .find(f => f.t == 3 && f.l == $('.info').attr('data-guid'))
    if (!cache) return
    const el = $('.inventory__manage-amount').clone()
    el[0].classList.add('popup')
    el[0].classList.add('pp-removable')
    el.removeClass('hidden').attr({
      'data-guid': cache.g,
      'data-tab': cache.t
    })
    $('.info').prepend(shadow).append(el)
    const input = el.find('.inventory__ma-amount')
    el.find('.inventory__ma-item').text(i18next.t('items.types.references'))
    el.find('.inventory__ma-brief').text(i18next.t('items.brief.reference'))
    el.find('.inventory__ma-max').text(cache.a)
    input.attr('max', cache.a).val(1)
    el.find('.inventory__ma-counter button').on('click', e => {
      const max = input.attr('max')
      let new_val = input.val()
      switch ($(e.target).attr('data-type')) {
        case 'minus':
          new_val--
          if (new_val < 1) new_val = max
          break
        case 'plus':
          new_val++
          if (new_val > max) new_val = 1
          break
      }
      input.val(new_val)
    })
    el.find('.inventory__ma-cancel').on('click', () => {
      el.remove()
      document.body.prepend(shadow)
    })
    el.find('.inventory__ma-delete').on('click', async e => {
      if (await deleteInventoryItem($(e.target).parents().eq(1))) {
        el.remove()
        document.body.prepend(shadow)
      }
    })
    el.find('.inventory__ma-use').remove()
  })
  document.querySelectorAll('.i-flag-btn').forEach(e => {
    e.addEventListener('click', async function() {
      const guid = point_state.info.g
      const flag = this.dataset['flag']
      if (!guid || !flag) return

      const inventory = localStorage.getJson('inventory-cache')
      const item = inventory.find(f => f.l === guid)
      if (typeof item === 'undefined') return

      this.setAttribute('disabled', '')
      const { response } = await apiSend('marks', 'post', { guid: item.g, flag },
        [document.querySelector('.info'), 'top right'])
        .catch(({ toast }) => apiCatch(toast))
        .finally(() => this.removeAttribute('disabled'))
      if (!response) return

      const result = response.result
      const { ico, off } = RA_BUTTONS_DATA[flag]
      this.querySelector('use').setAttribute('href', '#' + (result ? ico[1] : ico[0]))

      const bf = new Bitfield(item.f)
      bf.put(off, result)
      item.f = bf.toNumber()
      localStorage.setJson('inventory-cache', inventory)
    })
  })
  document.querySelector('#i-tools').addEventListener('click', function() {
    const el = document.querySelector('.info-tools')

    if (popovers.info_tools === null) {
      popovers.info_tools = Popper.createPopper(this, el, {
        placement: 'left-start',
      })
      el.classList.remove('hidden')
    } else {
      destroyPopover('info_tools')
    }
  })
  document.querySelector('#i-share').addEventListener('click', function() {
    const link = `${location.protocol}//${location.host}/l/p/${point_state.info.g}`
    invokeShare({
      title: i18next.t('popups.point.share-title', { title: point_state.info.t }),
      url: link
    }, {
      plain: link,
      text: i18next.t('popups.point.copy-url'),
      parent: $('.info')[0],
      position: 'top right'
    })
  })
  document.querySelector('#i-copy-pos').addEventListener('click', function() {
    const pos = point_state.info.c.slice().reverse()
    invokeShare({ title: point_state.info.t, text: pos }, {
      plain: pos,
      text: i18next.t('popups.point.copy-pos'),
      parent: $('.info')[0],
      position: 'top right'
    })
  })
  document.querySelector('#i-navigate').addEventListener('click', function() {
    const json = point_state.info
    if (isInRange(json.c)) {
      const toast = createToast(i18next.t('popups.point.navi-nouse'), document.querySelector('.info'), 'top right')
      handlePopupToasts(toast)
      return
    }
    if (navi_state.point.g === json.g) {
      navi_state.active = false
      navi_state.target = []
      navi_state.point = {}
      this.classList.remove('active')
    } else {
      navi_state.active = true
      navi_state.target = json.c
      navi_state.point = {
        g: json.g,
        i: json.i,
        t: json.t,
        te: json.te,
        dt: Date.now(),
      }
      this.classList.add('active')
    }
    localStorage.setJson('navi', navi_state)
    points_source.changed()
    updateNavi()
  })
  document.querySelector('#i-report').addEventListener('click', function() {
    const reason = prompt(i18next.t('info.report-prompt'))
    if (!reason) return

    this.setAttribute('disabled', '')
    const response = apiSend('report', 'post',
      { form: 1, subject: point_state.info.g, details: { reason } },
      [document.querySelector('.info'), 'top right']
    ).catch(({ toast }) => apiCatch(toast, true))
      .finally(() => this.removeAttribute('disabled'))
    if (!response) return

    const toast = createToast(i18next.t('notifs.report-success'), document.querySelector('.info'), 'top right')
    handlePopupToasts(toast)
  })

  $('#score').on('click', async () => {
    if (!$('.score').hasClass('hidden')) return $('.score').addClass('hidden')
    $('#score').prop('disabled', true)
    const { response } = await apiQuery('score').catch(({ toast }) => apiCatch(toast))
    $('#score').prop('disabled', false)
    if (!response) return

    $('.score').removeClass('hidden')
    makeScore(response)
    setTimeout(updateTimers)
    timers.score = setInterval(updateTimers, 1000)

    function updateTimers() {
      const now = new Date()
      const check = new Date()
      const decay = new Date()
      check.setMinutes(check.getMinutes() + 60); check.setMinutes(0, 0, 0)
      if (now.getMinutes() >= 30) decay.setMinutes(decay.getMinutes() + 60); decay.setMinutes(30, 0, 0)

      const until_check = Math.floor((check.getTime() - now.getTime()) / 1000)
      $('#timer-check').text(timeToHMS(until_check, false))
      $('#timer-decay').text(timeToHMS((decay.getTime() - now.getTime()) / 1000, false))

      if (until_check == 3598)
        apiQuery('score').catch(({ toast }) => apiCatch(toast)).then(({ response }) => makeScore(response))
    }
  })
  ;(function initLBSelect() {
    $('.leaderboard__term').html(i18next.t('leaderboard.sort-by', {
      element: '<select id="leaderboard__term-select"></select>'
    }))
    const stats = {
      general: ['xp'],
      points: ['captures', 'neutralizes', 'cores_deployed',
      'cores_destroyed', 'owned'],
      drawing: ['lines', 'max_line', 'lines_destroyed', 'regions', 'max_region', 'regions_destroyed'],
      exploration: ['discoveries', 'unique_visits', 'unique_captures', 'days'],
      misc: ['brooms_used'],
    }
    const container = $('#leaderboard__term-select')
    for (const section in stats) {
      container.append($('<option>', { text: i18next.t(`leaderboard.sort-sections.${section}`), disabled: '' }))
      stats[section].forEach(e => {
        container.append($('<option>', { value: e, text: i18next.t(`leaderboard.sort-terms.${e}`) }))
      })
    }
    container.on('change', () => drawLeaderboard())

    document.querySelectorAll('.ld-navi').forEach(e => e.addEventListener('click', navigateLeaderboard))
    document.querySelector('#ld-page').addEventListener('change', navigateLeaderboard)
  })();
  $('#leaderboard').on('click', () => {
    if (!$('.leaderboard').hasClass('hidden')) return $('.leaderboard').addClass('hidden')
    drawLeaderboard()
  })
  $('.outer-link').on('click', confirmOuter)

  $('#attack-menu').on('click', async () => {
    const inventory = localStorage.getJson('inventory-cache')
    const predicate = getSettings('atkord')
      ? ((a, b) => a.t === b.t ? a.l - b.l : b.t - a.t)
      : ((a, b) => a.t === b.t ? a.l - b.l : a.t - b.t)
    const weapons = inventory.filter(f => G2T[2].includes(f.t)).sort(predicate)
    if (!weapons.length) {
      const toast = createToast(i18next.t('popups.no-weapons'))
      toast.showToast()
      return
    }
    $('.attack-slider-wrp').toggleClass('hidden')
    if ($('.attack-slider-wrp').hasClass('hidden')) {
      view.setProperties({ offset: [0, ViewOffsets.NORMAL] })
      player_styles[3].getStroke().setColor('#0000')
      movePlayer(ol.proj.toLonLat(player_feature.getGeometry().getCoordinates()))
      return
    }
    player_styles[3].getStroke().setColor(is_dark ? '#FAA' : '#800')

    const strat = getSettings('strtwp')
    const lastwp = getSettings('lastwp') ?? null
    let level_buf = strat === 'low' ? Infinity : -Infinity
    let new_index = 0
    const checkout = (index, level) => {
      new_index = index
      level_buf = level
    }

    $('#catalysers-list').empty()
    weapons.forEach((e, n) => {
      const el = $('<li>', { class: 'splide__slide', 'data-guid': e.g })
      el.attr(e.t > 3 ? 'data-rarity' : 'data-level', e.l)
      el.append($('<span>', { class: 'catalysers-list__level', text: makeShortItemTitle(e) }).css('color', e.t > 3 ? 'var(--text)' : `var(--level-${e.l})`))
        .append($('<span>', { class: 'catalysers-list__amount', text: i18next.t('items.amount', { count: e.a }) }))
      $('#catalysers-list').append(el)
      if (e.t === 2) {
        switch (strat) {
          default:
          case 'high':
            if (e.l <= self_data.l && e.l > level_buf) checkout(n, e.l)
            break
          case 'low':
            if (e.l <= self_data.l && e.l < level_buf) checkout(n, e.l)
            break
          case 'latest':
            if ((lastwp === null && e.l <= self_data.l && e.l > level_buf) || e.l === lastwp)
              checkout(n, e.l)
            break
        }
      }
    })
    attack_slider.refresh()
    attack_slider.go(new_index)

    view.setProperties({ offset: [0, ViewOffsets.CENTER] })
    movePlayer(ol.proj.toLonLat(player_feature.getGeometry().getCoordinates()))
  })
  $('#attack-slider-fire').on('click', async () => {
    const guid = $('#catalysers-list li').eq(attack_slider.index).attr('data-guid')
    const inventory = localStorage.getJson('inventory-cache')
    const index = inventory.findIndex(f => f.g === guid)
    const item = inventory[index]

    if ([4, 5].includes(item.t)) {
      const proof = confirm(i18next.t('popups.attack-confirmation.' + item.t))
      if (!proof) return
    }

    $('#attack-slider-fire').prop('disabled', true)
    const { response } = await apiSend('attack2', 'post', {
      position: ol.proj.toLonLat(player_feature.getGeometry().getCoordinates()),
      guid
    }).catch(({ toast }) => apiCatch(toast))
    $('#attack-slider-fire').prop('disabled', false)
    if (!response) return

    // вешаем стили на точки
    const highlight = localStorage.getJson('map-config')?.h ?? 0
    response.c.forEach(e => {
      const feature = points_source.getFeatureById(e.guid)
      if (!feature) return
      const pos = feature.getGeometry().getCoordinates()
      const prop = feature.getProperties()
      const style = feature.getStyle()
      const diff = +((e.energy - prop.energy) * 100).toFixed(2)
      const cores_diff = e.cores - prop.cores

      let notif
      if (cores_diff < 0) { // ядра выбиты
        notif = i18next.t('popups.attack-notifs.knocked')
        if (cores_diff < -1)
          notif = i18next.t('popups.attack-notifs.combo', { n: -cores_diff })
      } else if (cores_diff > 0) { // ядра подставлены
        notif = i18next.t('popups.attack-notifs.inserted')
      } else if (diff <= 0) { // нанесен урон
        notif = i18next.t('popups.attack-notifs.damage', { n: Math.round(diff) })
      } else if (diff > 0) { // ведется чардж
        notif = i18next.t('popups.attack-notifs.repaired')
      }
      if (typeof notif !== 'undefined')
        style.push(FeatureStyles.TEXT(notif))

      if (e.energy <= 0) style[0] = FeatureStyles.POINT(pos, 0, 0)
      else style[0] = FeatureStyles.POINT(pos, e.team, e.energy)
      style[1] = FeatureStyles.LIGHT(pos, highlight, prop.highlight)
      feature.setProperties({
        team: e.energy <= 0 ? 0 : e.team,
        cores: e.cores,
        energy: e.energy,
      })
      feature.changed()
    })
    response.l.forEach(e => {
      const feature = lines_source.getFeatureById(e)
      if (!feature) return
      lines_source.removeFeature(feature)
    })
    response.r.forEach(e => {
      const feature = regions_source.getFeatureById(e)
      if (!feature) return
      regions_source.removeFeature(feature)
    })
    timers.damage_texts.push(setTimeout(() => {
      response.c.forEach(e => {
        const feature = points_source.getFeatureById(e.guid)
        timers.damage_texts.shift()
        let opacity = 1
        const timer = setInterval(() => {
          opacity -= .1
          const font = feature?.getStyle()?.at(-1)?.getText()
          if (!font) return clearInterval(timer)
          font.setFill(new ol.style.Fill({ color: `rgba(0, 0, 0, ${opacity})` }))
          font.setStroke(new ol.style.Stroke({ color: `rgba(255, 255, 255, ${opacity})`, width: 3 }))
          if (opacity <= 0) {
            clearInterval(timer)
            feature.getStyle().splice(2, 1)
          }
          feature.changed()
        }, 50)
      })
    }, 2500))

    // обновляем инвентарь
    if (response.ca != null) {
      inventory.splice(index, 1)
      $(`#catalysers-list [data-guid="${guid}"]`).remove()
      attack_slider.go('<')
    } else {
      item.a--
      $(`#catalysers-list [data-guid="${guid}"] .catalysers-list__amount`).text(i18next.t('items.amount', { count: item.a }))
    }
    attack_slider.refresh()
    if (inventory.filter(f => f.t == 2).length == 0)
      $('.attack-slider-wrp').addClass('hidden')
    localStorage.setJson('inventory-cache', inventory)

    // если это был ластик, показываем эффект
    if (item.t === 5) {
      const effects = localStorage.getJson('active-effects')
      const poison = effects.find(f => f.t === 200)
      const expiration = new Date(Date.now() + 3 * 86.4e6).toISOString()
      if (typeof poison === 'undefined')
        effects.push({ t: 200, x: expiration, i: '\u{1f9ea}' })
      else
        poison.x = expiration
      localStorage.setJson('active-effects', effects)
      updateEffects()
    }

    // показываем анимации и обновляем данные
    const total = inventory.reduce((acc, e) => acc += e.a, 0)
    $('#self-info__inv').text(total)
      .parent().css('color', total >= INVENTORY_LIMIT ? 'var(--accent)' : '')
    explodeRange(item.t === 2
      ? Catalysers[item.l]
      : Weapons[item.t]
    )
    handleExpChange(response.xp)
  })
  $('#draw-slider-confirm').on('click', async () => {
    $('#draw-slider-confirm').prop('disabled', true)
    const from = $('.draw-slider-wrp').attr('data-guid')
    const to = $('#refs-list li').eq(draw_slider.index).attr('data-point')
    const { response } = await apiSend('draw', 'post', {
      from, to,
      position: ol.proj.toLonLat(player_feature.getGeometry().getCoordinates())
    }).catch(({ toast }) => apiCatch(toast))
    $('#draw-slider-confirm').prop('disabled', false)
    if (!response) return

    const arc = turf.greatCircle(...response.line.c, { npoints: 5 })
    arc.geometry.coordinates = arc.geometry.coordinates.map(m => ol.proj.fromLonLat(m))
    const format = new ol.format.GeoJSON()
    const feature = format.readFeature(arc)
    feature.setId(response.line.g)
    feature.setProperties({ team: self_data.t })
    feature.setStyle(new ol.style.Style({
      stroke: new ol.style.Stroke({ color: TeamColors[self_data.t].stroke(), width: 2 })
    }))
    lines_source.addFeature(feature)

    if (response.reg.length) {
      const toast = createToast(i18next.t('popups.new-regions', {
        count: response.reg.length,
        area: areaToString(response.reg.reduce((acc, e) => acc += e.a, 0)),
        max: areaToString(response.reg[0].a)
      }), null, 'top right')
      handlePopupToasts(toast)

      response.reg.forEach(e => {
        const ts = []
        for (let i = 1; i <= 3; i++)
          ts.push(turf.greatCircle(e.c[0][i - 1], e.c[0][i], { npoints: 5 }).geometry.coordinates)
        const n = ts.flat().map(m => ol.proj.fromLonLat(m))
        n[n.length - 1] = n[0]

        const f = new ol.Feature({ geometry: new ol.geom.Polygon([n]) })
        f.setId(e.g)
        f.setProperties({ team: self_data.t })
        f.setStyle(new ol.style.Style({
          fill: new ol.style.Fill({ color: TeamColors[self_data.t].stroke() + '3' })
        }))
        regions_source.addFeature(f)
      })
    }

    if (typeof point_state.info?.li?.o !== 'undefined') point_state.info.li.o++
    if (typeof point_state.info?.r !== 'undefined') point_state.info.r += response.reg.length
    if (point_state.possible_lines.length) {
      const index = point_state.possible_lines.findIndex(f => f.p === to)
      if (index !== -1) point_state.possible_lines.splice(index, 1)
    }

    $(`#refs-list .splide__slide.is-active`).remove()
    draw_slider.refresh()
    if (!$('#refs-list li').length || point_state.info?.li?.o >= LINES_LIMIT_OUT) closeDrawSlider()

    const inventory = localStorage.getJson('inventory-cache')
    if (response.ref.a <= 0) {
      const index = inventory.findIndex(f => f.g == response.ref.g)
      inventory.splice(index, 1)
    } else {
      const item = inventory.find(f => f.g == response.ref.g)
      item.a--
    }
    localStorage.setJson('inventory-cache', inventory)
    const total = inventory.reduce((acc, e) => acc += e.a, 0)
    $('#self-info__inv').text(total)
      .parent().css('color', total >= INVENTORY_LIMIT ? 'var(--accent)' : '')

    handleExpChange(response.xp)
  })
  $('#attack-slider-close').on('click', () => {
    $('.attack-slider-wrp').addClass('hidden')
    view.setProperties({ offset: [0, ViewOffsets.NORMAL] })
    player_styles[3].getStroke().setColor('#0000')
    movePlayer(ol.proj.toLonLat(player_feature.getGeometry().getCoordinates()))
  })
  $('#draw-slider-close').on('click', closeDrawSlider)
  document.querySelectorAll('.slider-button__nav').forEach(e => e.addEventListener('click', function() {
    const wrp = this.parentElement.parentElement.parentElement.querySelector('.splide')
    const slider = { attack_slider, draw_slider }[wrp.id.replace(/-/g, '_')]
    switch (this.getAttribute('data-dir')) {
      case 'F': slider.go(0); break
      case 'L': slider.go(wrp.querySelector('.splide__list').children.length - 1); break
    }
  }))

  document.querySelector('#toggle-follow').checked = localStorage.getItem('follow') != 'false'
  $('#toggle-follow-btn').on('click', e => {
    const active = localStorage.getItem('follow') != 'false'
    localStorage.setItem('follow', !active)
    document.querySelector('#toggle-follow').checked = !active
    if (!active) {
      movePlayer(ol.proj.toLonLat(player_feature.getGeometry().getCoordinates()))
      if (view.getZoom() < 17) view.setZoom(17)
    }
  })

  ;(function prepareLayers() {
    document.querySelector('#map-lights-bottom').innerHTML = document.querySelector('#map-lights-top').innerHTML
  })();
  $('#layers').on('click', () => {
    if (!$('.layers-config').hasClass('hidden')) return $('.layers-config').addClass('hidden')
    $('.layers-config').removeClass('hidden')
    const data = localStorage.getJson('map-config')
    const layers = new Bitfield(data.l)
    layers.forEach((e, n) => $(`[name="layer"][value="${n}"]`).prop('checked', e))
    document.querySelectorAll('.layers-config__select').forEach((e, n) => {
      e.value = data.h >> n * 8 & 0xff
    })
    updateSettings()
  })
  $('[name="baselayer"]').on('change', e => {
    const value = $(e.target).val()
    changeSettings('base', value)
    setBaselayer()
  })
  $('#layers-config__save').on('click', async e => {
    const button = $(e.target)
    const data = localStorage.getJson('map-config')
    const layers = new Bitfield()
    $('[name="layer"]').each((_, e) => layers.put($(e).val(), $(e).prop('checked')))
    data.l = layers.toNumber()
    data.h = Array.from(document.querySelectorAll('.layers-config__select'))
      .reduce((acc, e, n) => acc += e.value << n * 8, 0)
    localStorage.setJson('map-config', data)
    button.prop('disabled', true)
    await requestEntities()
    button.prop('disabled', false)
    $('.layers-config').addClass('hidden')
  })

  ;(function fillLangList() {
    const allowed = ['sys', 'en', 'ru']
    allowed.forEach(e => {
      $('[data-setting="lang"]').append($('<option>', {
        value: e,
        text: e == 'sys' ? i18next.t('settings.global.language-sys') : capitalize(new Intl.DisplayNames([e], { type: 'language' }).of(e))
      }).prop('selected', e == 'sys'))
    })
  })();
  ;(function buildGarbageTable() {
    const tbody = document.querySelector('.garbage-table tbody')
    const half = Levels.length / 2

    const th = document.createElement('th')
    th.scope = 'row'

    const input = document.createElement('input')
    input.type = 'number'
    input.className = 'garbage-value'
    input.value = -1
    input.min = -1
    input.max = 3000

    for (let i = 1; i <= half; i++) {
      const row = document.createElement('tr')
      const i2 = i + half
      row.innerHTML = String.prototype.concat(
        `<th scope="row" style="color: var(--level-${i})">${romanize(i)}</th>`,
        `<td><input type="number" class="garbage-value" min="-1" max="3000" value="-1" data-ref="1-${i}"></td>`,
        `<td><input type="number" class="garbage-value" min="-1" max="3000" value="-1" data-ref="2-${i}"></td>`,
        `<th scope="row" style="color: var(--level-${i2})">${romanize(i2)}</th>`,
        `<td><input type="number" class="garbage-value" min="-1" max="3000" value="-1" data-ref="1-${i2}"></td>`,
        `<td><input type="number" class="garbage-value" min="-1" max="3000" value="-1" data-ref="2-${i2}"></td>`,
      )
      tbody.append(row)
    }
  })();
  ;(async function getServerSettings() {
    const { response } = await apiQuery('settings')
      .catch(({ toast }) => apiCatch(toast))
    for (const key in response) {
      const value = response[key]
      if (typeof value === 'boolean') {
        document.querySelector(`[data-setting="${key}"]`).checked = value
      }
      if (key === 'garbage') {
        for (let i = 1; i <= value.length; i++) {
          document.querySelector(`.garbage-value[data-ref="1-${i}"]`).value = value[i - 1][0]
          document.querySelector(`.garbage-value[data-ref="2-${i}"]`).value = value[i - 1][1]
        }
      }
    }
  })();
  $('#settings').on('click', () => {
    if (!$('.settings').hasClass('hidden')) return $('.settings').addClass('hidden')
    $('.settings').removeClass('hidden')
    updateSettings()
  })
  $('#settings').one('click', () => {
    if (self_data.tg) {
      const span = document.createElement('span')
      span.textContent = i18next.t('telegram.linked')
      span.style.color = 'var(--progress)'
      document.querySelector('#settings-telegram').append(span)
    } else {
      const login = 'sbg_game_testbot'
      const script = document.createElement('script')
      script.async = true
      script.src = 'https://telegram.org/js/telegram-widget.js?21'
      script.dataset['telegramLogin'] = login
      script.dataset['size'] = 'medium'
      script.dataset['userpic'] = false
      script.dataset['onauth'] = 'onTelegramAuth(user)'
      script.dataset['requestAccess'] = 'write'
      script.className = 'telegram-auth-button'
      script.addEventListener('load', function() {
        this.remove()
        const target = document.querySelector('#telegram-login-' + login)
        if (target === null) return
        target.style.width = '38px'
        target.style.borderRadius = '18px'
      })
      script.addEventListener('error', function() {
        const span = document.createElement('span')
        span.textContent = i18next.t('popups.network-fail')
        span.style.color = 'var(--accent)'
        this.after(span)
        this.remove()
      })
      document.querySelector('#settings-telegram').append(script)
    }
    $('#version').text(`v${VERSION}`)
  })
  $('[data-setting="lang"]').on('change', e => {
    changeSettings('lang', $(e.target).val())
    location.reload()
  })
  document.querySelectorAll('[data-setting]').forEach(el => {
    const tag = el.tagName
    if (tag !== 'SELECT' && tag !== 'INPUT') return
    if (!el.dataset['setting']) return
    if (typeof el.dataset['server'] !== 'undefined') return

    el.addEventListener('change', function() {
      const key = this.dataset['setting']
      if (!key) return

      const value = this.getAttribute('type') === 'checkbox'
        ? (typeof this.dataset['invert'] === 'undefined'
            ? this.checked
            : !this.checked)
        : this.value
      changeSettings(key, value)
      this.dispatchEvent(new SettingsChangeEvent(key, value))
    })
  })
  document.querySelector('[data-setting="theme"]').addEventListener('settingschange', ({ value }) => {
    $('html').attr('data-theme', value)
    $('meta[name="color-scheme"]').attr('content', value == 'auto' ? 'light dark' : value)
    is_dark = value == 'auto' ? matchMedia('(prefers-color-scheme: dark)').matches : value == 'dark'
    requestEntities()
    setBaselayer()
  })
  document.querySelector('[data-setting="imghid"]').addEventListener('settingschange', event => {
    event.flipClass('.i-image-box', 'imghid')
  })
  document.querySelector('[data-setting="plrhid"]').addEventListener('settingschange', event => {
    event.flipClass('.ol-layer__player', 'hidden')
  })
  document.querySelector('[data-setting="selfpos"]').addEventListener('settingschange', event => {
    event.flipClass(document.querySelector('#self-info__coord').parentElement, 'hidden', true)
  })
  document.querySelector('[data-setting="efmode"]').addEventListener('settingschange', ({ value }) => {
    document.querySelector('.effects').setAttribute('data-mode', value)
  })
  document.querySelector('[data-setting="ptcmir"]').addEventListener('settingschange', event => {
    event.flipClass('.i-buttons', 'mirrored')
  })
  $('.regions-opacity__range input').on('input', e => {
    const val = +$(e.target).val()
    $('#regions-opacity__cur').text(Math.round(val / 15 * 100) + '%')
    changeSettings('opacity', val)
  })
  document.querySelector('[data-setting="useadu"]').addEventListener('settingschange', ({ value }) => {
    document.querySelector('.deploy').dataset['magic'] = +value
  })
  $('#settings-credits').on('click', async e => {
    if ($('.credits').length) return $('.credits').removeClass('hidden')
    $(e.target).prop('disabled', true)
    const request = await fetch('/fragments/credits.html', {
      method: 'get',
      headers: {
        'accept-language': LANG
      }
    })
    const response = await request.text()
    $(e.target).prop('disabled', false)
    const el = $(response)
    el.find('.profile-link').on('click', openProfile)
    el.find('.outer-link').on('click', confirmOuter)
    el.find('.popup-close').on('click', e => closePopup(e.currentTarget.parentElement))
    $('.settings').after(el)
  })
  document.querySelector('#garbage-save').addEventListener('click', async function() {
    const values = {}
    for (let i = 1; i <= 10; i++) {
      const crs = +document.querySelector(`.garbage-value[data-ref="1-${i}"]`).value ?? -1
      const cat = +document.querySelector(`.garbage-value[data-ref="2-${i}"]`).value ?? -1
      values[i] = [crs, cat]
    }
    const inputs = document.querySelectorAll('.garbage-value')
    this.setAttribute('disabled', '')
    inputs.forEach(e => e.setAttribute('disabled', ''))
    apiSend('settings', 'post', { garbage: values }, [document.querySelector('.settings'), 'top right'])
      .catch(({ toast }) => apiCatch(toast, true))
      .finally(() => {
        this.removeAttribute('disabled')
        inputs.forEach(e => e.removeAttribute('disabled'))
      })
  })
  document.querySelectorAll('.settings-section__item > input[data-server]').forEach(e => e.addEventListener('click', function() {
    const setting = this.dataset['setting']
    const value = this.checked
    if (typeof setting === 'undefined' || setting === '') return

    const inputs = document.querySelectorAll('.settings-section__item > input[data-server]')
    inputs.forEach(e => e.setAttribute('disabled', ''))
    apiSend('settings', 'post', { [setting]: value }, [document.querySelector('#settings'), 'top right'])
      .catch(({ toast }) => {
        this.checked = !value
        apiCatch(toast, true)
      })
      .finally(() => inputs.forEach(e => e.removeAttribute('disabled')))
  }))

  document.querySelector('#notifs-menu').addEventListener('click', () => {
    const popup = document.querySelector('.notifs')
    popup.classList.remove('hidden')

    const data = localStorage.getJson('pager-data')
    const new_tab = +popup.querySelector('.notifs__tab.active').dataset['tab']

    const range = document.querySelector('#nr-range')
    range.value = data.range

    const list = popup.querySelector('.notifs__list')
    list.dataset['latest'] = data.latest
    list.dispatchEvent(new TabChangeEvent(null, new_tab))

    data.channel = new_tab
    data.latest = new Date().toISOString()
    localStorage.setJson('pager-data', data)
  })
  document.querySelectorAll('.notifs__tab').forEach(e => {
    if (+e.dataset['tab'] === localStorage.getJson('pager-data').channel)
      e.classList.add('active')

    e.addEventListener('click', function() {
      if (this.classList.contains('locked')) return

      const anchor = document.querySelector(this.parentElement.dataset['anchor'])
      if (!anchor) return

      const tabs = Array.from(this.parentElement.children)
      const tab = tabs.find(f => f.classList.contains('active'))
      const new_tab = this
      if (tab?.dataset['tab'] === new_tab.dataset['tab']) return

      tab?.classList.remove('active')
      new_tab.classList.add('active')
      anchor.dispatchEvent(new TabChangeEvent(tab?.dataset['tab'], new_tab.dataset['tab']))
      localStorage.updateJson('pager-data', 'channel', +new_tab.dataset['tab'])
    })
  })
  document.querySelector('.notifs__list').addEventListener('tabchange', async function(event) {
    if (document.querySelector('.notifs__tab.locked') !== null) return

    const data = {
      channel: event.new_tab,
    }
    if (event.new_tab === 1 || event.new_tab === 4) {
      data['range'] = +document.querySelector('#nr-range').value
      data['pos'] = ol.proj.toLonLat(player_feature.getGeometry().getCoordinates())
    }

    const tabs = Array.from(document.querySelectorAll('.notifs__tab'))
    tabs.forEach(e => e.classList.add('locked'))
    document.querySelector('#nr-range').setAttribute('disabled', '')
    document.querySelector('#notifs-message').setAttribute('disabled', '')
    document.querySelector('#notifs-send').setAttribute('disabled', '')
    this.dataset['state'] = 'loading'
    const { response } = await apiQuery('notifs', data, [document.querySelector('.notifs'), 'top center'])
      .catch(({ toast }) => apiCatch(toast))
      .finally(() => {
        tabs.forEach(e => e.classList.remove('locked'))
        document.querySelector('#nr-range').removeAttribute('disabled')
        document.querySelector('#notifs-message').removeAttribute('disabled')
        document.querySelector('#notifs-send').removeAttribute('disabled')
        this.dataset['state'] = 'idle'
      })
    if (!response) {
      let tab = tabs.find(f => f.dataset['tab'] == event.new_tab)
      if (tab) tab.classList.remove('active')
      tab = tabs.find(f => f.dataset['tab'] == event.old_tab)
      if (tab) tab.classList.add('active')

      return
    }

    this.dataset['tab'] = event.new_tab
    this.dataset['state'] = 'fresh'
    Array.from(this.children).forEach(e => e.remove())

    const input = document.querySelector('#notifs-message')
    input.removeAttribute('disabled')
    input.setAttribute('placeholder', i18next.t('notifs.placeholder-message'))

    const send = document.querySelector('#notifs-send')
    send.removeAttribute('disabled')

    if (event.new_tab === 3) {
      input.setAttribute('disabled', '')
      input.setAttribute('placeholder', i18next.t('notifs.placeholder-readonly'))
      send.setAttribute('disabled', '')
    }

    const params = {
      config: {
        hour: '2-digit',
        minute: '2-digit',
        second: event.new_tab === 3 ? '2-digit' : void 0,
      },
      latest: this.dataset['latest'],
      found_latest: false,
    }

    const wrp = document.querySelector('.notifs__list')
    response.list.reverse().forEach(entry => {
      const el = makeNotifsEntry(event.new_tab, entry, params)
      wrp.append(el)
    })
    const latest = wrp.querySelector('.latest')
    const top = latest?.offsetTop ?? wrp.scrollHeight
    wrp.scrollTo({ behavior: 'instant', top, left: 0 })

    updateNotifs()
  })
  document.querySelector('.notifs__list').addEventListener('scroll', async function() {
    if (this.dataset['state'] === 'fresh') {
      this.dataset['state'] = 'idle'
      return
    }
    if (this.scrollTop > 0 || this.dataset['state'] !== 'idle') return

    const tab = +document.querySelector('.notifs__tab.active').dataset['tab']
    const offset = +document.querySelector('.notifs__entry').dataset['id']
    const data = {
      channel: tab,
      offset
    }
    if (tab === 1 || tab === 4) {
      data['range'] = +document.querySelector('#nr-range').value
      data['pos'] = ol.proj.toLonLat(player_feature.getGeometry().getCoordinates())
    }

    this.dataset['state'] = 'loading'
    document.querySelectorAll('.notifs__tab').forEach(e => e.classList.add('locked'))
    document.querySelector('#nr-range').setAttribute('disabled', '')
    const { response } = await apiQuery('notifs', data, [document.querySelector('.notifs'), 'top center'])
      .catch(({ toast }) => apiCatch(toast))
      .finally(() => {
        document.querySelectorAll('.notifs__tab').forEach(e => e.classList.remove('locked'))
        document.querySelector('#nr-range').removeAttribute('disabled')
        this.dataset['state'] = 'idle'
      })

    let new_offset = 0
    if (!response.list.length) {
      this.dataset['state'] = 'full'
      return
    }
    for (const entry of response.list) {
      const el = makeNotifsEntry(tab, entry, {
        config: {
          hour: '2-digit',
          minute: '2-digit',
        },
      })
      this.prepend(el)
      new_offset += el.clientHeight
    }
    if (this.scrollTop === 0) new_offset -= 5
    this.scrollTo({ behavior: 'instant', top: this.scrollTop + new_offset, left: 0 })
  })
  document.querySelector('#notifs-message').addEventListener('keypress', async function(event) {
    if (event.repeat) return true
    if (event.key === 'Enter') {
      sendNotif()
    }
  })
  document.querySelector('#notifs-send').addEventListener('click', function() {
    sendNotif()
  })
  document.querySelector('#nr-range').addEventListener('input', function() {
    const datalist = Array.from(this.nextElementSibling.children).find(f => f.value === this.value)
    const range = +datalist.dataset['range']
    document.querySelector('#nr-value').textContent = this.value < 9
      ? i18next.t('units.n-km', { count: range })
      : '∞ ' + i18next.t('units.km')
  })
  document.querySelector('#nr-range').addEventListener('change', function() {
    localStorage.updateJson('pager-data', 'range', +this.value)
    const list = document.querySelector('.notifs__list')
    list.dispatchEvent(new TabChangeEvent(+list.dataset['tab'], +list.dataset['tab']))
  })
  document.dispatchEvent(new Event('pagerready'))

  document.querySelector('#reload').addEventListener('click', () => location.reload())
  $('.region-picker').on('click', () => {
    if (count_regions) $('.region-picker').removeClass('active')
    else $('.region-picker').addClass('active')
    count_regions = !count_regions
  })

  $('#logout').on('click', async () => {
    const proof = confirm(i18next.t('popups.logout'))
    if (!proof) return
    clearStorage()
    location.href = '/login'
  })
  document.querySelector('#change-login').addEventListener('click', async function() {
    const value = prompt(i18next.t('popups.change-login'))
    if (!value) return
    this.setAttribute('disabled', '')
    const result = await apiSend('account', 'post', { param: 'login', value })
      .catch(({ error }) => alert(error))
      .finally(() => this.removeAttribute('disabled'))
    if (!result?.response) return
    if (result.response.notice) return alert(result.response.notice)
    alert(i18next.t('popups.change-login-done'))
    location.reload()
  })
  document.querySelector('#change-pass').addEventListener('click', async function() {
    const value = prompt(i18next.t('popups.change-pass'))
    if (!value) return
    this.setAttribute('disabled', '')
    const result = await apiSend('account', 'post', { param: 'pass', value })
      .catch(({ error }) => alert(error))
      .finally(() => this.removeAttribute('disabled'))
    if (!result?.response) return
    if (result.response.notice) return alert(result.response.notice)
    alert(i18next.t('popups.change-pass-done'))
  })
  document.querySelector('#change-team').addEventListener('click', async function() {
    const allowed = [1, 2, 3].filter(f => f !== self_data.t)
      .map(m => m + ' — ' + i18next.t(`inventory.sorter.filters.${m}`))
      .join(';\n')
    const value = parseInt(prompt(i18next.t('popups.change-team', { list: allowed })))
    if (!value) return
    this.setAttribute('disabled', '')
    const result = await apiSend('account', 'post', { param: 'team', value })
      .catch(({ error }) => alert(error))
      .finally(() => this.removeAttribute('disabled'))
    if (!result?.response) return
    if (result.response.notice) return alert(result.response.notice)
    alert(i18next.t('popups.change-team-done'))
    location.reload()
  })

  document.querySelectorAll('.pr-stats-tab').forEach(e => e.addEventListener('click', function() {
    const anchor = document.querySelector(this.parentElement.dataset['anchor'])
    if (!anchor) return

    const tabs = Array.from(this.parentElement.children)
    const tab = tabs.find(f => f.classList.contains('active'))
    const new_tab = this
    if (tab?.dataset['tab'] === new_tab.dataset['tab']) return

    tab?.classList.remove('active')
    new_tab.classList.add('active')
    anchor.dispatchEvent(new TabChangeEvent(tab?.dataset['tab'], new_tab.dataset['tab']))
  }))
  document.querySelector('#pr-button__tools').addEventListener('click', function() {
    const el = document.querySelector('.pr-tools')

    if (popovers.profile_tools === null) {
      popovers.profile_tools = Popper.createPopper(this, el, {
        placement: 'left-end',
      })
      el.classList.remove('hidden')
    } else {
      destroyPopover('profile_tools')
    }
  })

  ;(function initCompass() {
    if (!('AbsoluteOrientationSensor' in window)) return console.warn('AOSensor is not supported')
    if (!('permissions' in navigator)) return console.warn('Permissions API is not available')
    const sensor = new AbsoluteOrientationSensor({ frequency: 45 })
    Promise.all([
      navigator.permissions.query({ name: 'accelerometer' }),
      navigator.permissions.query({ name: 'magnetometer' }),
      navigator.permissions.query({ name: 'gyroscope' }),
    ]).then((results) => {
      if (!results.every((result) => result.state === 'granted')) {
        const toast = createToast(i18next.t('popups.compass.rejected'))
        toast.options.className = 'error-toast'
        toast.showToast()
        return
      }
      sensor.addEventListener('error', () => {
        const toast = createToast(i18next.t('popups.compass.unavailable'))
        toast.options.className = 'error-toast'
        toast.showToast()
      })
      sensor.addEventListener('reading', () => {
        const angle = Math.round(sensor.quaternion[2] * 180)
        player_styles[0].getImage().setRotation((-angle * Math.PI / 180) + view.getRotation())
        player_feature.changed()
      })
      sensor.start()
    }).catch(() => {
      const toast = createToast(i18next.t('popups.compass.request'))
      toast.options.className = 'error-toast'
      toast.showToast()
    })
  })();
  document.querySelector('.navi-floater').addEventListener('click', function(event) {
    if (!navi_state.active) return
    if (event.target.classList.contains('navi-sizer')) return
    document.querySelector('#toggle-follow').checked = false
    localStorage.setItem('follow', false)
    view.setCenter(ol.proj.fromLonLat(navi_state.target))
    if (view.getZoom() < 15) view.setZoom(17)
  })
  document.querySelector('.navi-sizer').addEventListener('click', function() {
    if (!navi_state.active) return
    const floater = this.parentElement
    navi_state.closed = floater.classList.toggle('closed')
    localStorage.setJson('navi', navi_state)
  })

  window.onTelegramAuth = async (data) => {
    const { request, response } = await apiSend('link', 'post', JSON.stringify(data))
    if (request.status !== 200) {
      $('#telegram-login-sbg_game_bot').after($('<div>', { text: i18next.t('telegram.failed'), class: 'tg-error' }).css('color', 'var(--accent)'))
      console.error('Error while linking TG:', response)
    }
    if (response.al) console.warn('Note: Telegram account is already linked')
    $('#telegram-login-sbg_game_bot').after($('<span>', { text: i18next.t('telegram.done') }).css('color', 'var(--progress)'))
    $('#telegram-login-sbg_game_bot, .telegram-auth-button, .tg-error').remove()
  }

  // todo перехват ошибок в ходе инициализации
  switchLoading(null, true)

  // DEV SPOOFING
  $('body').on('keydown', event => {
    const allowed = ['testuser', 'Nerotu']
    if (!allowed.includes(self_data.n)) return
    const pos = ol.proj.toLonLat(player_feature.getGeometry().getCoordinates())
    const accuracy = event.altKey ? 4 : 1
    if (event.code == 'ArrowDown') { pos[1] -= .00005 / accuracy; movePlayer(pos) }
    if (event.code == 'ArrowUp') { pos[1] += .00005 / accuracy; movePlayer(pos) }
    if (event.code == 'ArrowLeft') { pos[0] -= .0001 / accuracy; movePlayer(pos) }
    if (event.code == 'ArrowRight') { pos[0] += .0001 / accuracy; movePlayer(pos) }
  })

  async function showInfo(data) {
    let json
    if (typeof data === 'string') { // дан guid
      request_controllers.points.abort('0x00')
      request_controllers.points = new AbortController()
      const { response } = await apiQuery('point', {
        guid: data,
        position: ol.proj.toLonLat(player_feature.getGeometry().getCoordinates())
      }).catch(({ toast }) => apiCatch(toast))
      if (!response) return
      json = response.data
    } else if (typeof data === 'object') json = data // даны данные
    else return // ничего не дано
    // вписываемся в кэш (нужно для карусельки с деплоем)
    point_state.info = json

    const feature = points_source.getFeatureById(json.g)
    const team_color = `var(--team-${json.te})`
    const percent_format = new Intl.NumberFormat(LANG, { maximumFractionDigits: 1 })

    let eng = 0
    let eng_total = 0
    json.co.forEach(c => { eng += c.e; eng_total += Cores[c.l].eng })

    if (feature) {
      const prop = feature.getProperties()
      const style = feature.getStyle()
      const pos = ol.proj.fromLonLat(json.c)
      style[0] = FeatureStyles.POINT(pos, json.te, eng / eng_total)
      style[1] = FeatureStyles.LIGHT(pos, localStorage.getJson('map-config')?.h ?? 0, prop.highlight)
      feature.changed()
    }

    const inventory = localStorage.getJson('inventory-cache')
    const ref = inventory.find(f => f.t === 3 && f.l === json.g)

    $('.info').removeClass('hidden').attr('data-guid', json.g)
    $('#i-title').text(json.t)
    $('#i-image').css('background-image', `url('${getPointImage(json.i)}')`)
    $('#i-level').text(i18next.t('info.level', { count: json.l })).css('color', `var(--level-${json.l})`)
    $('#i-ref').text(i18next.t('info.refs', { count: ref?.a || 0, max: REF_LIMIT })).attr('data-has', ref ? 1 : 0)
    $('#i-stat__distance').text(distanceToString(getDistance(json.c)))
    $('#i-stat__owner').text(json.o || i18next.t('info.na')).css('color', team_color).attr('data-name', json.o)
    document.querySelector('#i-stat__bearing').style.transform = `rotate(${Math.round(getBearing(json.c) + getViewRotation())}deg)`
    ;(function prepareGuard() {
      const target = document.querySelector('#i-stat__guard')
      if (json.gu !== null) {
        target.classList.remove('hidden')
        target.innerText = i18next.t('info.guard', { count: json.gu ?? 0 })
      } else {
        target.classList.add('hidden')
      }
    })();
    if (typeof json.li !== 'undefined') {
      $('#i-stat__line-in').text(json.li.i)
      $('#i-stat__line-out').text(json.li.o)
    }
    if (typeof json.r !== 'undefined') $('#i-stat__region').text(json.r)
    ;(function prepareNavi() {
      const btn = document.querySelector('#i-navigate')
      if (navi_state.active && navi_state.point.g === json.g)
        btn.classList.add('active')
      else btn.classList.remove('active')
    })();
    ;(function prepareFlags() {
      const is_fav = !!(ref?.f & 0b1)
      const is_lock = !!(ref?.f & 0b10)
      let button = document.querySelector('.info [data-flag="favorite"]')
      button.querySelector('use').setAttribute('href', `#${is_fav ? 'fas' : 'fa'}-star`)
      if (typeof ref === 'undefined') button.setAttribute('disabled', '')
      else button.removeAttribute('disabled')

      button = document.querySelector('.info [data-flag="locked"]')
      button.querySelector('use').setAttribute('href', '#fas-lock' + (is_lock ? '' : '-open'))
      if (typeof ref === 'undefined') button.setAttribute('disabled', '')
      else button.removeAttribute('disabled')
    })();
    $('#deploy').attr('data-state', 'deploy').text(i18next.t('buttons.deploy'))
    $('.i-stat__cores').empty()
    for (let i = 0; i < 6; i++) {
      const core = json.co[i]
      const box = $('<div>', { class: 'i-stat__core' })
      const label = $('<div>', { class: 'i-stat__core-info' })
      if (!core) {
        label.append($('<span>', { text: '—' }))
        .append($('<span>', { text: i18next.t('info.na') }).css('color', 'var(--team-0)'))
      } else {
        const energy = core.e / Cores[core.l].eng * 100
        box.text(romanize(core.l)).css({
          '--energy': `${energy}%`,
          '--bgc': `var(--level-${core.l})`
        }).attr('data-guid', core.g)
        label.append($('<span>', {
          text: `${percent_format.format(energy)}%`,
          title: `${core.e} / ${Cores[core.l].eng}`
        })).append($('<span>', {
          class: 'profile-link',
          'data-name': core.o,
          text: core.o
        }).on('click', openProfile).css('color', team_color))
        .attr('data-guid', core.g)
      }
      $('.i-stat__cores').append(...(i % 2 == 0 ? [label, box] : [box, label]))
    }
    $('.i-stat__core[data-guid]').on('click', e => {
      const target = $(e.target)
      if (target.hasClass('selected')) {
        $('#deploy').attr('data-state', 'deploy').text(i18next.t('buttons.deploy'))
        target.removeClass('selected')
        manageDeploy()
        adjustDeploymentSlider()
        return
      }
      $('.i-stat__core').removeClass('selected')
      target.addClass('selected')
      $('#deploy').attr('data-state', 'upgrade').text(i18next.t('buttons.upgrade'))
      adjustDeploymentSlider()
      manageDeploy()
    })

    $('#cores-list').empty()
    inventory.filter(f => f.t == 1).sort((a, b) => a.l - b.l).forEach((e, n) => {
      $('#cores-list').append($('<li>', { class: 'splide__slide', 'data-guid': e.g, 'data-level': e.l })
        .append($('<span>', { class: 'cores-list__level', text: i18next.t('items.core-short', { level: romanize(e.l) }) }).css('color', `var(--level-${e.l})`))
        .append($('<span>', { class: 'cores-list__amount', text: i18next.t('items.amount', { count: e.a }) }))
      )
    })
    deploy_slider.refresh()
    adjustDeploymentSlider()
    manageDeploy()

    ;(function prepareRing() {
      const ring = document.querySelector('.discovery-ring')
      const w = ring.clientWidth
      const h = ring.clientHeight
      const p = (w + h) * 2
      ring.classList.remove('init')
      ring.setAttribute('viewBox', `0 0 ${w} ${h}`)
      ring.style.setProperty('--prm', p)
      ring.style.setProperty('--off', 0)
      ring.children.item(0).setAttribute('d', `M ${w / 2},0 H ${w} V ${h} H 0 V 0 Z`)
    })()
    const exists = showCooldownTimer(json.g)
    if (!exists) {
      $('#discover').removeAttr('data-time')
      document.querySelector('.discover').classList.remove('locked')
    }

    manageControls()

    const draw_counter = document.querySelector('#draw-count')
    if (!draw_counter.textContent.match(/^\[\d+\]$/)) {
      point_state.possible_lines = []
      request_controllers.draw.abort('0x00')
      request_controllers.draw = new AbortController()
      draw_counter.textContent = '[...]'
      apiQuery('draw', {
        guid: json.g,
        position: ol.proj.toLonLat(player_feature.getGeometry().getCoordinates()),
        exref: localStorage.getJson('settings')?.exref,
        lite: 1
      }, [$('.info')[0], 'top right'])
      .then(({ response }) => {
        point_state.possible_lines = response.data
        draw_counter.textContent = `[${response.data.length}]`
      })
      .catch(() => {
        draw_counter.textContent = '[N/A]'
      })
    }
  }
  function getPointImage(data) {
    if (data === null)
      return '/photos/no_image.png'
    if (data.match(/^sbg:/))
      return `/photos/${data.slice(4)}`
    return `https://lh3.googleusercontent.com/${data}`
  }

  function updateSelfInfo() {
    const formatter = new Intl.NumberFormat(LANG)
    const explv = Levels[self_data.l - 1]
    $('#self-info__name').text(self_data.n).css('color', `var(--team-${self_data.t})`)
    if (explv.target !== Infinity)
      $('#self-info__exp').text(`${formatter.format(self_data.x - explv.total)} / ${formatter.format(explv.target)}`)
    else
      $('#self-info__exp').text(formatter.format(self_data.x))
    $('#self-info__explv').text(i18next.t('self-info.lv', { count: explv ? explv.lv.toString().padStart(2, '0') : 10 }))
  }
  function movePlayer(coords) {
    $('#self-info__coord').text(coords.slice().reverse().map(m => m.toFixed(5)).join(', '))
    const pos = ol.proj.fromLonLat(coords)
    player_feature.getGeometry().setCoordinates(pos)
    player_styles.slice(1, 4).forEach(e => e.getGeometry().setCenter(pos))

    const pme = new PlayerMoveEvent(coords)
    document.querySelector('.info').dispatchEvent(pme)
    document.querySelector('.navi-floater').dispatchEvent(pme)

    ;(function() {
      const follow = localStorage.getItem('follow') === 'true'
      const { is_first_watched, ignore_follow } = map.getProperties()
      if (is_first_watched && (follow && !ignore_follow)) view.setCenter(pos)
      else if (!is_first_watched && (follow || !ignore_follow)) view.setCenter(pos)
    })();
  }
  function manageControls() {
    const inventory = localStorage.getJson('inventory-cache')
    const in_range = isInRange(point_state.info.c)
    $('.discover:not(.locked) > button').prop('disabled', !in_range)
    $('#repair:not(.locked)').prop('disabled', !((in_range || (!in_range && inventory.find(f => f.l === point_state.info.g))) && point_state.info.te == self_data.t))
    const outbound = point_state.info.li?.o || 0
    $('#draw:not(.locked)').prop('disabled', !(in_range && point_state.info.te == self_data.t && point_state.info.co.length >= 6 && outbound < LINES_LIMIT_OUT))
  }
  function manageDeploy() {
    if ($('.info').hasClass('hidden')) return
    const inventory = localStorage.getJson('inventory-cache')
    const level = +document.querySelector('#cores-list').children.item(deploy_slider.index)?.getAttribute('data-level') ?? 0
    const limit = Cores[level]?.lim || 0
    const state = $('#deploy').attr('data-state')
    const errors = ['',
      i18next.t('popups.no-cores'),
      i18next.t('popups.point.enemy'),
      i18next.t('popups.point.range'),
      i18next.t('popups.point.full-deploy'),
      i18next.t('popups.highlevel-core'),
      i18next.t('popups.not-upgrade'),
      i18next.t('popups.cores-limit', { count: limit })
    ]
    let error = 0
    const info = point_state.info
    if (inventory.filter(f => f.t === 1).length === 0) error = 1
    else if (info.te != 0 && info.te != self_data.t) error = 2
    else if (info.c.length && !isInRange(info.c)) error = 3
    else if (info.co.length === 6 && state === 'deploy') error = 4
    else if (level > self_data.l) error = 5
    else if (info.co.find(f => f.g === $('.i-stat__core.selected').attr('data-guid'))?.l >= level) {
      error = 6
      if (adjustDeploymentSlider()) error = 0
    }
    else if (info.co.filter(f => f.o === self_data.n && f.l === level).length >= limit && limit > 0) {
      error = 7
      if (adjustDeploymentSlider()) error = 0
    }

    if (error == 1) $('#deploy-slider').addClass('hidden')
    else if ($('#deploy-slider').hasClass('hidden')) $('#deploy-slider').removeClass('hidden')

    $('#deploy:not(.locked)').prop('disabled', Boolean(error))
    $('.deploy-slider-error').text(errors[error])
    .css('color', error ? '#F00' : '#0000')
  }
  Array.prototype.findLastIndex = function(predicate) {
    for (let index = this.length - 1; index >= 0; index--) {
      if (predicate(this[index], index, this))
        return index
    }
    return -1
  }
  function adjustDeploymentSlider() {
    if (!getSettings('useadu')) return false

    const info = point_state.info
    if (info.te !== 0 && info.te !== self_data.t) return false

    const self_cores = info.co.filter(f => f.o === self_data.n).reduce((acc, e) => (acc[e.l] = (acc[e.l] ?? 0) + 1, acc), {})
    const state = document.querySelector('#deploy').getAttribute('data-state')
    const children = Array.from(document.querySelector('#cores-list').children)

    let index = -1
    if (state === 'deploy' && info.co.length < 6) {
      const strat = getSettings('strtdl')
      const predicate = f => {
        const level = f.getAttribute('data-level')
        return level <= self_data.l && (self_cores[level] || 0) < (Cores[level]?.lim || 0)
      }
      switch (strat) {
        default:
        case 'high': index = children.findLastIndex(predicate); break
        case 'low':  index = children.findIndex(predicate); break
      }
    } else if (state === 'upgrade') {
      const slot = document.querySelector('.i-stat__core.selected').getAttribute('data-guid')
      const core = info.co.find(f => f.g === slot)
      if (typeof core === 'undefined') return false

      const strat = getSettings('strtup')
      const predicate = f => {
        const level = f.getAttribute('data-level')
        return level > core.l && level <= self_data.l && (self_cores[level] || 0) < (Cores[level]?.lim || 0)
      }
      switch (strat) {
        default:
        case 'low':  index = children.findIndex(predicate); break
        case 'high': index = children.findLastIndex(predicate); break
      }
      if (index === -1) {
        const strat = getSettings('strtuo')
        const level = (function() {
          switch (strat) {
            default:
            case 'low':  return info.co.reduce((r, e) =>
              e.l < r && e.g !== core.g && e.l < self_data.l && (self_cores[e.l + 1] || 0) < (Cores[e.l + 1]?.lim || 0) ? r = e.l : r,
              Infinity
            )
            case 'high': return info.co.reduce((r, e) =>
              e.l > r && e.g !== core.g && e.l < self_data.l && (self_cores[e.l + 1] || 0) < (Cores[e.l + 1]?.lim || 0) ? r = e.l : r,
              -Infinity
            )
          }
        })()
        if (isFinite(level)) {
          // проверяем, можно ли заапгрейдить предложенный минимальный/максимальный уровень
          // это делается просто: смотрим лимиты у коров не ниже, чем предложенный
          let upgradable = false
          for (let test_level = level + 1; test_level <= Math.min(Cores.length - 1, self_data.l); test_level++) {
            if (self_cores[test_level] >= Cores[test_level]?.lim) continue
            upgradable = true
            break
          }

          if (upgradable) {
            const next = info.co.find(f => f.g !== slot && f.l === level)
            const slots = Array.from(document.querySelectorAll('.i-stat__core[data-guid]'))
            slots.forEach(e => e.classList.remove('selected'))
            slots.find(f => f.getAttribute('data-guid') === next.g).classList.add('selected')
            adjustDeploymentSlider()
          }
        }
      }
    }

    if (index === -1) return false
    deploy_slider.go(index)
    return true
  }
  function showCooldownTimer(guid) {
    const ring = document.querySelector('.discovery-ring')
    const cooldowns = localStorage.getJson('cooldowns')
    clearInterval(timers.info_cooldown)
    if (typeof cooldowns[guid] === 'undefined') return false
    ring.classList.remove('init')
    update()
    timers.info_cooldown = setInterval(() => { ring.classList.add('init'); update() }, 1000)
    return true

    function update() {
      if (typeof cooldowns[guid] === 'undefined') return clearInterval(timers.info_cooldown)
      const diff = Math.round((cooldowns[guid].t - Date.now()) / 1000)
      const prm = +ring.style.getPropertyValue('--prm')
      if (diff > 0) {
        document.querySelector('.discover').classList.add('locked')
        document.querySelectorAll('.discover > button').forEach(e => e.setAttribute('disabled', ''))
        $('#discover').attr('data-time', timeToString(diff))
        let max = COOLDOWN
        if (cooldowns[guid].c > 0) $('#discover').attr('data-remain', cooldowns[guid].c)
        else {
          $('#discover').removeAttr('data-remain')
          max = BURNOUT
        }
        ring.style.setProperty('--off', Math.min((max - diff + 1) / max * prm, prm))
      } else {
        document.querySelector('.discover').classList.remove('locked')
        $('#discover').removeAttr('data-time').removeAttr('data-remain')
        delete cooldowns[guid]
        localStorage.setJson('cooldowns', cooldowns)
        clearInterval(timers.info_cooldown)
        manageControls()
      }
    }
  }
  function manageDrawing(event) {
    $('#draw-slider-confirm').prop('disabled', false)
    const data = point_state.possible_lines.find(f => f.r == $(event.slide).attr('data-ref'))
    const arc = turf.greatCircle(...data.g, { npoints: 5 })
    arc.geometry.coordinates = arc.geometry.coordinates.map(m => ol.proj.fromLonLat(m))
    const format = new ol.format.GeoJSON()
    const feature = format.readFeature(arc)
    feature.setId(data.r)
    feature.setProperties({ point: data.p })
    feature.setStyle(new ol.style.Style({
      stroke: new ol.style.Stroke({ color: is_dark ? '#FFF' : '#000', width: 2, lineDash: [4] })
    }))
    temp_lines_source.clear()
    temp_lines_source.addFeature(feature)

    const pos = data.g[1].slice()
    view.setCenter(ol.proj.fromLonLat(pos))
    // view.adjustCenter(view.getProperties().offset)
  }
  function closeDrawSlider() {
    $('.draw-slider-wrp').addClass('hidden')
    $('.topleft-container, .bottomleft-container, .ol-attribution').removeClass('hidden')
    document.querySelector('.info').classList.remove('hidden')
    clearInterval(timers.info_controls)
    temp_lines_source.clear()
    localStorage.setItem('follow', $('.draw-slider-wrp').attr('data-follow'))
    view.setProperties({ offset: [0, ViewOffsets.NORMAL] })
    view.setCenter(player_feature.getGeometry().getCoordinates())
    // view.adjustCenter(view.getProperties().offset)
    document.querySelector('#attack-menu').removeAttribute('disabled')
    document.querySelector('#i-stat__line-out').textContent = point_state.info?.li?.o ?? 0
    document.querySelector('#i-stat__region').textContent = point_state.info?.r ?? 0
    document.querySelector('#draw-count').textContent = `[${point_state.possible_lines.length}]`
  }
  function showExpDiff(diff) {
    if (diff == 0) return
    clearTimeout(timers.player_xpup)
    $('.xp-diff').removeClass('active')
    setTimeout(() => {
      $('.xp-diff').addClass('active').text(`+${diff} ${i18next.t('units.pts-xp')}`)
      timers.player_xpup = setTimeout(() => $('.xp-diff').removeClass('active'), 1000)
    }, 1)
  }
  function handleExpChange(data) {
    const old_level = self_data.l
    self_data.x = data.cur
    self_data.l = getLevelByExp(data.cur).lv
    showExpDiff(data.diff)
    updateSelfInfo()

    if (self_data.l === old_level) return
    apiQuery('levelup').then(({ response }) => {
      console.log(response)
      clearInterval(timers.levelup)
      timers.levelup = setInterval(async () => {
        console.log('checking for levelup')
        if (document.querySelector('.popup:not(.hidden)') !== null) return
        clearInterval(timers.levelup)

        const popup = document.querySelector('.popup.levelup')
        const rewards = popup.querySelector('.levelup-rewards')
        popup.classList.remove('hidden')
        document.querySelector('.popup-touch').classList.remove('hidden')

        const pill = popup.querySelector('.level-pill')
        pill.setAttribute('data-level', response.level)
        pill.style.background = `var(--level-${response.level})`
        pill.innerText = response.level

        ;[...rewards.querySelectorAll('span')].forEach(e => e.remove())
        for (const entry of response.reward) {
          const item = makeDropItemTitle({ t: entry.type, l: entry.level })[0]
          item.append(` (x${entry.amount})`)
          rewards.append(item)
        }

        // полностью обновляем инвентарь
        // слайдеры трогать не надо, они это сделают сами
        const { response: inventory } = await apiQuery('inventory').catch(({ toast }) => apiCatch(toast))
        localStorage.setJson('inventory-cache', inventory.i)
        const total = inventory.i.reduce((acc, e) => acc += e.a, 0)
        $('#self-info__inv').text(total)
          .parent().css('color', total >= INVENTORY_LIMIT ? 'var(--accent)' : '')
      }, 1000)
    })
  }
  function drawInventory() {
    const tab = $('.inventory__tab.active').attr('data-tab')
    const inventory = localStorage.getJson('inventory-cache')
    $('.inventory__content').empty().attr('data-tab', tab)
    inventory.filter(f => G2T[tab].includes(f.t)).sort((a, b) => a.t - b.t).forEach(createInventoryItem)
    $('.inventory__tab').each((_, tab) => {
      const category = $(tab).attr('data-tab')
      const total = inventory.reduce(((acc, e) => acc += G2T[category].includes(e.t) ? e.a : 0), 0)
      $(tab).find('.inventory__tab-counter').text(total)
    })
    $('#inventory-sort').prop('disabled', tab != 3)
  }
  function createInventoryItem(data) {
    function manageItem() {
      if ($('#inventory-delete').attr('data-del') != 0) return
      const item = (localStorage.getJson('inventory-cache')).find(f => f.g == data.g)
      if (!item) return
      const shadow = document.querySelector('.popup-touch')
      const title_alt = title.clone().replaceWith($('<div>'))
      const text = title_alt.text()
      if (data.t == 3) title_alt.text(text.slice(text.indexOf(')') + 1)).css('font-size', '.8em')
      document.querySelector('.inventory').prepend(shadow)
      $('.inventory__manage-amount').removeClass('hidden').attr({
        'data-guid': data.g,
        'data-tab': G2T.findIndex(f => f.includes(data.t))
      })
      $('.inventory__ma-brief').text(getItemBrief(data.t))
      $('.inventory__ma-item').empty().append(title_alt)
      $('.inventory__ma-amount').attr('max', item.a)
      $('.inventory__ma-max').text(item.a)
      if (USABLE.includes(+data.t))
        document.querySelector('.inventory__ma-use').classList.remove('hidden')
      else
        document.querySelector('.inventory__ma-use').classList.add('hidden')
    }

    const container = $('<div>', { class: 'inventory__item' })
    const title = $('<span>', { class: `inventory__item-title ${data.t > 3 ? `has-rarity rarity-${data.l}` : ''}`, text: makeItemTitle(data) })
    const descr = $('<span>', { class: 'inventory__item-descr', text: i18next.t('items.amount', { count: data.a }) })
    container.attr('data-guid', data.g)
    if (data.t == 3) {
      const controls = $('<button>', { class: 'inventory__item-controls' })
        .html('<svg viewBox="0 0 512 512" height="1.5em"><use href="#fas-ellipsis-vertical"></use></svg>')
        .on('click', function() {
          const el = document.querySelector('.inventory__ref-actions')

          if (popovers.ref_actions === null || popovers.ref_actions.state['guid'] !== data.g) {
            const inventory = localStorage.getJson('inventory-cache')
            const item = inventory.find(f => f.g === data.g)
            const is_fav = !!(item?.f & 0b1)
            const is_lock = !!(item?.f & 0b10)

            popovers.ref_actions = Popper.createPopper(this, el, {
              placement: 'right-start',
              modifiers: [
                { name: 'flip', options: { fallbackPlacements: ['bottom-start'] } },
              ],
            })
            popovers.ref_actions.state['guid'] = data.g
            el.classList.remove('hidden')
            el.querySelector('#inventory__ra-manage').onclick = manageItem

            let button = el.querySelector('.inventory__ra-item [data-flag="favorite"]')
            button.querySelector('span').textContent = i18next.t('inventory.reference.actions.' + (is_fav ? 'unfav' : 'fav'))
            button.querySelector('use').setAttribute('href', `#${is_fav ? 'fas' : 'fa'}-star`)

            button = el.querySelector('.inventory__ra-item [data-flag="locked"]')
            button.querySelector('span').textContent = i18next.t('inventory.reference.actions.' + (is_lock ? 'unlock' : 'lock'))
            button.querySelector('use').setAttribute('href', '#fas-lock' + (is_lock ? '' : '-open'))
          } else {
            destroyPopover('ref_actions')
          }
        })
      descr.empty()
        .append($('<span>')
          .append('<svg viewBox="0 0 512 512" height="1em"><use href="#fas-user"></use></svg>')
          .append($('<span>', { class: 'iid-owner', text: i18next.t('inventory.reference.default') }).css('font-style', 'italic'))
        )
        .append($('<span>')
          .append('<svg viewBox="0 0 512 512" height="1em"><use href="#fas-bolt"></use></svg>')
          .append($('<span>', { class: 'iid-energy', text: '---' }))
        )
        .append($('<span>')
          .append('<svg viewBox="0 0 512 512" height="1em"><use href="#fas-flag"></use></svg>')
          .append($('<span>', { class: 'iid-guard', text: '---' }))
        )
        .append($('<span>')
          .append('<svg viewBox="0 0 512 512" height="1em"><use href="#fas-location-dot"></use></svg>')
          .append($('<span>', { class: 'iid-distance', text: '---' }))
        )
      title
        .prepend($('<span>', { class: 'iid-amount', text: `(x${data.a})` }))
        .prepend($('<span>', { class: 'level-pill', text: '?' }).css('background', '#000'))
      container.attr('data-ref', data.l)
        .append(controls)
        .append($('<div>', { class: 'inventory__item-left' }).append(title).append(descr)
          .on('click', event => {
            if ($('#inventory-delete').attr('data-del') != 0) return
            if (event.target?.className?.match(/profile-link/)) return
            document.querySelector('#toggle-follow').checked = false
            localStorage.setItem('follow', false)
            view.setCenter(ol.proj.fromLonLat(data.c))
            closePopup(document.querySelector('.inventory'))
          }))
        .append($('<button>', { class: 'inventory__ic-repair', html: String.prototype.concat(
          '<svg viewBox="0 0 512 512" height="2em"><use href="#fas-wrench"></use></svg>',
        ) }).prop('disabled', true))

        if (!!(data.f & 0b10)) {
          container[0].classList.add('lock')
          title.find('.level-pill').after('<svg class="inventory__ici-locked" viewBox="0 0 576 576" width="1em"><use href="#fas-lock"></use></svg>')
        }
        if (!!(data.f & 0b1)) {
          container[0].classList.add('favorite')
          title.find('.level-pill').after('<svg class="inventory__ici-favorite" viewBox="0 0 576 576" width="1em"><use href="#fas-star"></use></svg>')
        }
    } else {
      container.css('text-align', 'center').on('click', manageItem)
      title.css('color', data.t > 3 ? 'var(--text)' : `var(--level-${data.l})`)
      descr.css('font-size', '1em')
      container.append(title).append(descr)
    }
    $('.inventory__content').append(container)
  }
  function getRefsData(target) {
    const { scrollTop, clientHeight } = target

    const view = localStorage.getJson('refs-view')
    view.scroll = scrollTop
    localStorage.setJson('refs-view', view)

    clearTimeout(timers.refs_data)
    timers.refs_data = setTimeout(() => {
      $('.inventory__item').each(async (_, e) => {
        if (!$(e).attr('data-ref')) return
        if (!(
          e.offsetTop <= scrollTop + clientHeight * 2 &&
          e.offsetTop >= scrollTop - clientHeight &&
          !e.className.match(/\b(?:loaded|loading|hidden)\b/)
        )) return
        const guid = $(e).attr('data-ref')
        const cache = localStorage.getJson('refs-cache')
        const pos = (localStorage.getJson('inventory-cache')).find(f => f.l == guid && f.t == 3).c

        $(e).addClass('loading')
        if (typeof cache[guid] !== 'undefined') {
          cache[guid].c = pos
          makeEntry(e, cache[guid])
        }
        const { response } = await apiQuery('point', {
          guid: $(e).attr('data-ref'),
          status: 1
        }).catch(err => {
          const target = $(e).find('.inventory__item-descr')
          target.text(i18next.t('inventory.reference.failed', { reason: err.error }))
          $(e).removeClass('loading').addClass('loaded')
          return { response: null }
        })
        if (!response) return
        const data = response.data
        cache[guid] = {
          te: data.te, co: data.co,
          e: data.e, l: data.l,
          o: data.o,
          t: Date.now() + 5 * 60e3
        }
        localStorage.setJson('refs-cache', cache)
        makeEntry(e, data)
      })
    }, 500)

    function makeEntry(e, data) {
      $(e).find('.inventory__item-title .level-pill').text(data.l).attr('data-level', data.l).css('background', `var(--level-${data.l})`)
      const target = $(e).find('.inventory__item-descr')
      const formatter = new Intl.NumberFormat(LANG, { maximumFractionDigits: 1 })
      target.find('.iid-owner').replaceWith($('<u>', { class: 'iid-owner profile-link' }).text(data.o ?? 'n/a').attr('data-name', data.o ?? 'n/a').on('click', openProfile))
      target.find('.iid-energy').text(`${formatter.format(data.e)}%\xa0@\xa0${data.co}`)
      target.find('.iid-distance').text(distanceToString(getDistance(data.c)))
      if (data.o === self_data.n)
        target.find('.iid-guard').text(i18next.t('units.n-days', { count: data.gu ?? -1 }))
          .parent().css('visibility', '')
      else
        target.find('.iid-guard').parent().css('visibility', 'hidden')
      $(e).removeClass('loading').addClass('loaded')
      e.style.setProperty('--bg', `var(--team-${data.te ?? 0})`)
      e.style.setProperty('--energy', data.e + '%')

      const repair = e.querySelector('.inventory__ic-repair')
      if (data.te === self_data.t && data.co > 0 && data.e < 100)
        repair.removeAttribute('disabled')
      else repair.setAttribute('disabled', '')
      repair.onclick = async function() {
        this.classList.add('locked')
        this.setAttribute('disabled', '')
        const guid = data.g
        const { response } = await apiSend('repair', 'post', {
          guid,
          position: ol.proj.toLonLat(player_feature.getGeometry().getCoordinates())
        }, [document.querySelector('.inventory'), 'top center']).catch(({ toast }) => apiCatch(toast, true))
        this.classList.remove('locked')
        this.removeAttribute('disabled')
        if (!response) return

        handleExpChange(response.xp)

        let eng = 0
        let eng_total = 0
        response.data.co.forEach(e => (eng += e.e, eng_total += Cores[e.l]?.eng))
        const percent = eng / eng_total * 100
        e.style.setProperty('--energy', percent + '%')
        e.querySelector('.iid-energy').textContent = `${formatter.format(percent)}%\xa0@\xa0${response.data.co.length}`
        if (response.data.co.length === 0 || response.data.te !== self_data.t || eng / eng_total >= 1)
          this.setAttribute('disabled', '')

        const owner = response.data.o
        let el = e.querySelector('.iid-owner')
        el.textContent = owner
        el.dataset['name'] = owner

        const level = response.data.l
        el = e.querySelector('.inventory__item-title .level-pill')
        el.textContent = level
        el.dataset['level'] = level
        el.style.background = `var(--level-${level})`

        e.style.setProperty('--bg', `var(--team-${response.data.te ?? 0})`)
        e.style.setProperty('--energy', percent + '%')

        const feature = points_source.getFeatureById(guid)
        if (feature) {
          const prop = feature.getProperties()
          const style = feature.getStyle()
          const pos = feature.getGeometry().getCoordinates()
          style[0] = FeatureStyles.POINT(pos, response.data.te, eng / eng_total)
          style[1] = FeatureStyles.LIGHT(pos, localStorage.getJson('map-config')?.h ?? 0, prop.highlight)
          feature.changed()
        }
      }
    }
  }
  function arrangeInventoryRefs(order) {
    const wrp = document.querySelector('.inventory__content')
    if (wrp.getAttribute('data-tab') != 3) return

    Array.from(wrp.children).forEach(e => e.classList.add('hidden'))
    wrp.scroll({ top: 1 })
    for (const guid of order) {
      const element = wrp.querySelector(`[data-guid="${guid}"]`)
      if (element === null) continue

      element.classList.remove('hidden')
      wrp.append(element)
    }
    wrp.scroll({ top: 0 })
    getRefsData(wrp)
  }
  async function deleteInventoryItem(parent) {
    const valid = parent.find('.inventory__ma-amount')[0].reportValidity()
    if (!valid) return false
    const button = parent.find('.inventory__ma-delete')
    const amount = parent.find('.inventory__ma-amount')
    button.prop('disabled', true)
    const guid = parent.attr('data-guid')
    const tab = +parent.attr('data-tab')

    const inventory = localStorage.getJson('inventory-cache')
    if (USABLE.includes(inventory.find(f => f.g === guid)?.t)) {
      const proof = confirm(i18next.t('inventory.premium-warning'))
      if (!proof) {
        button.prop('disabled', false)
        return false
      }
    }

    const { response } = await apiSend('inventory', 'delete', {
      selection: { [guid]: +amount.val() },
      tab
    }, [$('.inventory')[0], 'bottom left']).catch(({ toast }) => apiCatch(toast))
    button.prop('disabled', false)
    if (!response) return false

    parent.addClass('hidden').removeAttr('data-guid')
    amount.val(1).removeAttr('max')
    document.body.prepend(document.querySelector('.popup-touch'))

    const element = $(`.inventory__item[data-guid="${guid}"]`)
    const slide = $(`.splide__slide[data-guid="${guid}"]`)
    if (response.count.item > 0) {
      if (tab == 3) {
        const amount = element.find('.iid-amount')
        amount.text(`(x${response.count.item})`)
      } else element.find('.inventory__item-descr').text(`x${response.count.item}`)
      if (tab == 2) slide.find('.catalysers-list__amount').text(`x${response.count.item}`)
      inventory.find(f => f.g == guid).a = +response.count.item
    } else {
      element.remove()
      if (tab == 2) slide.remove()
      inventory.splice(inventory.findIndex(f => f.g == guid), 1)
    }
    if (tab == 2) {
      attack_slider.refresh()
      if (response.count[tab] == 0) $('.attack-slider-wrp').addClass('hidden')
    }
    localStorage.setJson('inventory-cache', inventory)

    $(`.inventory__tab[data-tab="${tab}"] .inventory__tab-counter`).text(response.count[tab])
    $('#self-info__inv').text(response.count.total)
      .parent().css('color', response.count.total >= INVENTORY_LIMIT ? 'var(--accent)' : '')
    if (tab == 3 && !document.querySelector('.info').classList.contains('hidden')) {
      const has = response.count.item > 0
      $('#i-ref').text(i18next.t('info.refs', { count: response.count.item, max: REF_LIMIT })).attr('data-has', +has)
      document.querySelectorAll('.i-flag-btn').forEach(e => {
        if (has) e.removeAttribute('disabled')
        else e.setAttribute('disabled', '')
      })
    }

    if (popovers.ref_actions !== null && popovers.ref_actions.state['guid'] === guid) {
      destroyPopover('ref_actions')
    }

    return true
  }
  function getItemBrief(type) {
    switch (type) {
      case 1: return i18next.t('items.brief.core')
      case 2: return i18next.t('items.brief.catalyser')
      case 4: return i18next.t('items.brief.broom')
      case 5: return i18next.t('items.brief.eraser')
      case 6: return i18next.t('items.brief.uporin')
      case 7: return i18next.t('items.brief.lens')
      default: return ''
    }
  }

  async function openProfile(data) {
    const struct = [
      ['captures', 'neutralizes', 'cores_deployed', 'cores_destroyed', 'owned_points', 'guard_point'],
      ['lines', 'max_line', 'guard_line', 'lines_destroyed', 'regions', 'regions_area', 'max_region', 'guard_region', 'regions_destroyed'],
      ['total_days', 'days', 'max_days'],
      ['discoveries', 'unique_visits', 'unique_captures'],
      ['*gratitude'],
    ]
    let name
    if (data instanceof $.Event) name = $(data.currentTarget).attr('data-name')
    else if (data.match(/^[a-z\d<>]+$/i)) name = data
    else return
    if (name == 'n/a') return

    request_controllers.profile.abort('0x00')
    request_controllers.profile = new AbortController()
    const { response } = await apiQuery('profile', { name }).catch(({ toast }) => apiCatch(toast))
    if (!response) return

    let response_self

    const is_self = response.name === self_data.n
    const level = Levels[response.level - 1]
    const team_color = `var(--team-${response.team})`
    const formatter = new Intl.NumberFormat(LANG)
    const formatter_diff = new Intl.NumberFormat(LANG, { signDisplay: 'exceptZero', maximumFractionDigits: 1 })
    const unit_xp = i18next.t('units.pts-xp')
    const tab = +document.querySelector('.pr-stats-tab.active').dataset['tab']
    $('.profile').removeClass('hidden')
    $('#pr-name').text(response.name)
    $('#pr-name, #pr-xp-current, .pr-xp-level').css('color', team_color)
    $('#pr-xp-current').text(level.target == Infinity ? `${formatter.format(response.xp)} ${unit_xp}` : `${formatter.format(response.xp - level.total)} / ${formatter.format(level.target)} ${unit_xp}`)
    $('#pr-xp-level-num').text(response.level)
    $('.pr-xp-progress-bar').css({
      width: level.target == Infinity ? '100%' : (response.xp - level.total) / level.target * 100 + '%',
      background: team_color
    })
    $('.pr-scroll').animate({ scrollTop: 0 }, 500)
    $('.pr-stats').empty()
    $('.pr-stat__total-xp .pr-stat-val').text(`${formatter.format(response.xp)} ${unit_xp}`)
    $('.pr-stat__age .pr-stat-val').text(new Date(response.created_at).toLocaleDateString(LANG, { day: 'numeric', month: 'long', year: 'numeric' }))
    {
      const entry = document.querySelector('.pr-stat__contact')
      const link = entry.querySelector('a')
      link.dataset['href'] = `https://t.me/${response.tg}`
      link.textContent = '@' + response.tg
      if (response.tg === '')
        entry.classList.add('hidden')
      else
        entry.classList.remove('hidden')
    }
    struct.forEach((section, n) => {
      const container = $('<div>', { class: 'pr-stats__section' })
      container.append($('<h4>', { class: 'pr-stats__section-header', text: i18next.t(`profile.sections.${n}`) }))
      section.forEach(stat => {
        const optional = stat[0] === '*'
        stat = stat.replace('*', '')
        const value = response.stats[stat][tab] ?? response.stats[stat]
        if (optional && value === 0) return
        container.append($('<div>', { class: 'pr-stat' })
          .append($('<span>', { class: 'pr-stat-title', text: i18next.t(`profile.stats.${stat}`) }))
          .append($('<span>', { class: 'pr-stat-val', text: formatStatValue(stat, value, formatter) }))
        )
      })
      if (container[0].children.length === 1) return
      $('.pr-stats').append(container)
    })
    Array.from(document.querySelector('.pr-badges').children).forEach(e => e.remove())
    Object.keys(response.badges).forEach(title => {
      const [tier, progress] = response.badges[title]
      const badge = document.createElement('span')
      badge.className = `badge tier-${tier}`
      if (tier === 6 && progress >= 2)
        badge.setAttribute('data-mult', Math.floor(progress))

      const body = document.createElement('span')
      body.className = 'badge__body'
      body.setAttribute('data-icon', i18next.t(`badges.common.${title}.icon`))

      const next = document.createElement('span')
      next.className = 'badge__next'
      if (tier < 6) next.classList.add(`tier-${tier + 1}`)
      if (progress === null)
        next.classList.add('hidden')
      next.style.setProperty('--prg', progress - Math.floor(progress))

      badge.append(body, next)
      document.querySelector('.pr-badges').append(badge)

      badge.addEventListener('click', function() {
        const data = Badges[title]
        const shadow = document.querySelector('.popup-touch')
        const popup = document.querySelector('.badge-info')
        popup.querySelector('.prbi__badge-container').replaceChildren(this.cloneNode(true))
        popup.querySelector('.prbi__title').textContent = String.prototype.concat(
          i18next.t(`badges.tiers.${tier}`), '\x20',
          i18next.t(`badges.common.${title}.title`)
        )
        popup.querySelector('.prbi__description').textContent = i18next.t(`badges.common.${title}.description`)
        popup.querySelector('.counter').textContent = formatter.format(response.stats[data.stat]?.[0] ?? response.stats[data.stat])

        const bottom = popup.querySelector('.prbi__bottom')
        Array.from(bottom.children).forEach(e => e.remove())
        data.req.forEach((e, n) => {
          const span = document.createElement('span')
          span.className = `next-req tier-${n + 1}`
          span.textContent = formatter.format(e)
          if (n + 1 > tier)
            span.classList.add('unacquired')
          bottom.append(span)
        })

        popup.classList.remove('hidden')
        document.querySelector('.profile').prepend(shadow)
      })
    })
    response.awards.forEach(award => {
      const [icon, title, descr, bg, br, timestamp] = award
      const badge = document.createElement('span')
      badge.className = 'badge award'

      const body = document.createElement('span')
      body.className = 'badge__body'
      body.setAttribute('data-icon', icon)

      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      svg.classList.add('badge__shape')
      svg.setAttribute('viewBox', '0 0 100 100')

      const use = document.createElementNS('http://www.w3.org/2000/svg', 'use')
      use.setAttribute('href', '#award-shape')
      use.setAttribute('fill', '#' + bg.toString(16).padStart(6, '0'))
      use.setAttribute('stroke', '#' + br.toString(16).padStart(6, '0'))

      svg.append(use)
      body.append(svg)
      badge.append(body)
      document.querySelector('.pr-badges').prepend(badge)

      badge.addEventListener('click', function() {
        const shadow = document.querySelector('.popup-touch')
        const popup = document.querySelector('.badge-info')
        popup.querySelector('.prbi__badge-container').replaceChildren(this.cloneNode(true))
        popup.querySelector('.prbi__title').textContent = title
        popup.querySelector('.prbi__description').textContent = descr
        popup.querySelector('.counter').textContent = ''

        const bottom = popup.querySelector('.prbi__bottom')
        const achieved = document.createElement('span')
        achieved.className = 'prbi__achieved'
        achieved.textContent = i18next.t('badges.achieved', { date: new Date(timestamp).toLocaleDateString(LANG) })
        bottom.replaceChildren(achieved)

        popup.classList.remove('hidden')
        document.querySelector('.profile').prepend(shadow)
      })
    })
    $('#pr-button__copy').off('click').on('click', () => {
      const data = {
        date: new Date().toISOString(),
        name: response.name,
        team: ['GRAY', 'RED', 'GREEN', 'BLUE'][response.team],
        level: response.level,
        xp: response.xp,
      }
      struct.forEach(section => { for (const stat of section) data[stat] = response.stats[stat]?.[0] ?? response.stats[stat] })
      navigator.clipboard.writeText(JSON.stringify(data)).then(() => {
        createToast(i18next.t('popups.profile.copy-data'), $('.profile')[0], 'top right').showToast()
      })
    })
    $('#pr-button__share').off('click').on('click', () => {
      const link = `${location.protocol}//${location.hostname}/l/u/${response.name}`
      invokeShare({
        title: i18next.t('popups.profile.share-title', { name: response.name }),
        url: link,
      }, {
        plain: link,
        text: i18next.t('popups.profile.copy-url'),
        parent: $('.profile')[0],
        position: 'top right'
      })
    })
    $('#pr-button__mailto').off('click').on('click', () => {
      if (is_self) return

      document.querySelectorAll('body > .popup').forEach(e => closePopup(e))

      const tabs = Array.from(document.querySelectorAll('.notifs__tab'))
      tabs.forEach(e => e.classList.remove('active'))
      tabs.find(f => +f.dataset['tab'] === 2).classList.add('active')
      addMention(response.name, true)
      document.querySelector('#notifs-menu').dispatchEvent(new Event('click', { bubbles: false }))
    })

    {
      const data = localStorage.getJson('stats-buffer')[response.name]
      document.querySelector('.pr-sc-timestamp').textContent = typeof data !== 'undefined'
        ? i18next.t('profile.comparison.latest-save', { timestamp: new Date(data.date).toLocaleString(LANG) })
        : i18next.t('profile.comparison.not-saved')
    }
    $('#pr-sc-save').off('click').on('click', function() {
      const ctx = is_self ? 'self': 'other'
      const message = String.prototype.concat(
        i18next.t('profile.comparison.popups.confirm', { context: ctx }), '\n',
        i18next.t('profile.comparison.popups.warn'),
      )
      const proof = confirm(message)
      if (!proof) return

      const now = new Date()
      const data = {
        date: now.toISOString(),
        level: response.level,
        xp: response.xp,
      }
      struct.forEach(section => { for (const stat of section) data[stat] = response.stats[stat]?.[0] ?? response.stats[stat] })

      localStorage.updateJson('stats-buffer', response.name, data)
      document.querySelector('.pr-sc-timestamp').textContent =
        i18next.t('profile.comparison.latest-save', { timestamp: now.toLocaleString(LANG) })
    })
    $('#pr-sc-compare').off('click').on('click', function() {
      const wrp = document.querySelector('.profile')
      const ctx = is_self ? 'self': 'other'
      const prev = localStorage.getJson('stats-buffer')[response.name]
      if (typeof prev === 'undefined') {
        const toast = createToast(
          i18next.t('profile.comparison.popups.missing', { context: ctx }),
          wrp,
        )
        toast.options.className = 'error-toast'
        handlePopupToasts(toast)
        return
      }

      const now = new Date()
      const data = {
        date: now.toISOString(),
        level: response.level,
        xp: response.xp,
      }
      struct.forEach(section => { for (const stat of section) data[stat] = response.stats[stat]?.[0] ?? response.stats[stat] })

      const diff = now.getTime() - new Date(prev.date).getTime()
      const cdiv = [Infinity, 86400e3, 3600e3, 60e3, 1e3]
      const ckey = [null, 'day', 'hr', 'min', 'sec']
      const stamp = []
      const text = []
      for (let i = 1; i < cdiv.length; i++) {
        const piece = Math.floor(diff % cdiv[i - 1] / cdiv[i])
        if (piece === 0) continue
        stamp.push(i18next.t('units.' + ckey[i], { count: piece }))
      }

      for (const stat in data) {
        const diff = data[stat] - prev[stat]
        if (!diff) continue

        let label = `profile.stats.${stat}`
        switch (stat) {
          case 'level': label = 'profile.level'; break
        }
        const value = formatter_diff.format(diff)
        const color = value[0] === '+' ? 'plus' : 'minus'
        text.push(String.prototype.concat(
          '<div class="pr-sc-entry">',
          '<span>', i18next.t(label), '</span>',
          '<span class="pr-sc-', color, '">', value, '</span>',
          '</div>',
        ))
      }

      if (!text.length) {
        const toast = createToast(i18next.t('profile.comparison.popups.no-changes'), wrp)
        handlePopupToasts(toast)
        return
      }

      const result = String.prototype.concat(
        '<div class="pr-sc-header">',
        i18next.t('profile.comparison.popups.result', {
          timestamp: new Date(prev.date).toLocaleString(LANG),
          context: ctx
        }),
        ' (', stamp.join('\u0020'), ')</div>',
        text.join(''),
      )
      const toast = createToast(result, wrp, 'bottom center')
      toast.options.duration = -1
      toast.options.className = 'interaction-toast pr-sc-toast'
      toast.showToast()
    })

    $('.pr-stats').off('tabchange').on('tabchange', function(event) {
      const { new_tab } = event.originalEvent
      $(this).empty()
      struct.forEach((section, n) => {
        const container = $('<div>', { class: 'pr-stats__section' })
        container.append($('<h4>', { class: 'pr-stats__section-header', text: i18next.t(`profile.sections.${n}`) }))
        section.forEach(stat => {
          const optional = stat[0] === '*'
          stat = stat.replace('*', '')
          const value = response.stats[stat][new_tab] ?? response.stats[stat]
          const alltime_only = typeof response.stats[stat][new_tab] === 'undefined'
          if (optional && value === 0) return
          const wrp = $('<span>', { class: 'pr-stat-val', text: alltime_only && new_tab > 0 ? '—' : formatStatValue(stat, value, formatter) })
          container.append($('<div>', { class: 'pr-stat' })
            .append($('<span>', { class: 'pr-stat-title', text: i18next.t(`profile.stats.${stat}`) }))
            .append(wrp)
          )

          if (typeof response_self !== 'undefined' && response.name !== self_data.n && !(alltime_only && new_tab > 0)) {
            const diff = (response_self.stats[stat]?.[new_tab] ?? response_self.stats[stat])
              - (response.stats[stat]?.[new_tab] ?? response.stats[stat])
            if (!isNaN(diff)) wrp[0].dataset['diff'] = formatStatValue(stat, diff, formatter_diff)
          }
        })
        if (container[0].children.length === 1) return
        $(this).append(container)
      })
    })

    document.querySelector('#pr-button__compare').removeAttribute('disabled')
    $('#pr-button__compare').off('click').on('click', async function(event) {
      if (is_self) return
      this.setAttribute('disabled', '')

      const { response: res } = await apiQuery('profile', { name: self_data.n })
        .catch(({ toast }) => apiCatch(toast, true))
      if (!res) {
        this.removeAttribute('disabled')
        return
      }

      response_self = res
      const sections = Array.from(document.querySelectorAll('.pr-stats__section'))
      struct.forEach((section, n) => {
        const container = sections[n+1]
        if (!container) return
        const stats = Array.from(container.querySelectorAll('.pr-stat'))
        section.forEach((stat, n1) => {
          const wrp = stats[n1]?.querySelector('.pr-stat-val')
          if (!wrp) return
          const diff = (response_self.stats[stat]?.[tab] ?? response_self.stats[stat])
            - (response.stats[stat]?.[tab] ?? response.stats[stat])
          if (!isNaN(diff)) wrp.dataset['diff'] = formatStatValue(stat, diff, formatter_diff)
        })
      })
      destroyPopover('profile_tools')
    })
  }
  function invokeShare(options, toast) {
    if ('share' in navigator) {
      navigator.share(options).catch(err => {
        console.log(err)
      })
    }
    navigator.clipboard.writeText(toast.plain).then(() => {
      createToast(toast.text, toast.parent, toast.position).showToast()
    })
  }
  function formatStatValue(key, value, formatter) {
    if (key.match(/^guard_|(_|^)days$/)) return formatter.format(value) + ' ' + i18next.t('units.days', { count: value })
    else if (key.match(/_area$|^max_region$/)) return areaToString(value, formatter)
    else if (key == 'max_line') return distanceToString(value, formatter)
    else return formatter.format(value)
  }
  async function drawLeaderboard(page = 1) {
    const units = [
      [/^xp$/, 'pts-xp'],
      [/^(captures|neutralizes|owned)$/, 'pts'],
      [/^unique_/, 'pts'],
      [/^discoveries$/, 'dscv'],
      [/^cores_/, 'crs'],
      [/lines?/, 'lns'],
      [/regions/, 'rgs'],
      [/days/, 'dys'],
      [/^brooms_/, 'pcs'],
    ]

    $('#leaderboard, .ld-navi, #ld-page').prop('disabled', true)
    const stat = $('#leaderboard__term-select').val()
    const unit = units.find(f => f[0].test(stat))?.[1]
    const formatter = new Intl.NumberFormat(LANG)
    const { response } = await apiQuery('leaderboard', { stat, page }).catch(({ toast }) => apiCatch(toast))
    $('#leaderboard, .ld-navi, #ld-page').prop('disabled', false)
    if (!response) return

    $('.leaderboard').removeClass('hidden')
    $('.leaderboard__place').empty().append($('<span>', { html: i18next.t('leaderboard.place', {
      pos: '<span id="leaderboard__place-pos"></span>',
      total: '<span id="leaderboard__place-total"></span>'
    }) }))
    $('.leaderboard__list').empty()
    $('#leaderboard__place-pos').text(response.s ? formatter.format(response.s) : '—')
    $('#leaderboard__place-total').text(response.t)
    response.l.forEach((e, n) => {
      const entry = $('<tr>')
        .append($('<td>', { text: (page - 1) * 100 + n + 1 }))
        .append(jquerypassargs(
          $('<td>'), '$1$ $2$',
          $('<span>', { class: 'level-pill', text: e.l }).attr('data-level', e.l).css('background', `var(--level-${e.l})`),
          $('<span>', { class: 'profile-link', text: e.n }).css('color', `var(--team-${e.t})`).attr('data-name', e.n).on('click', openProfile),
        ))
        .append($('<td>', { text: takeUnits(e.s).join(' ') }))
      if (e.n == self_data.n) entry.addClass('own')
      $('.leaderboard__list').append(entry)
    })
    document.querySelector('.leaderboard__list-wrp').scroll({ top: 0, behavior: 'smooth' })
    const pagination = document.querySelector('#ld-page')
    Array.from(pagination.children).forEach(e => e.remove())
    for (let page = 1; page <= response.p; page++) {
      const option = document.createElement('option')
      option.value = page
      option.textContent = page
      pagination.append(option)
    }
    pagination.value = 1
    document.querySelectorAll('.ld-navi[value="F"], .ld-navi[value="P"]').forEach(e => e.setAttribute('disabled', ''))

    function takeUnits(value) {
      if (stat === 'max_line') return ['', distanceToString(value)]
      else if (stat === 'max_region') return ['', areaToString(value)]
      else return [formatter.format(value), i18next.t(`units.${unit}`)]
    }
  }
  async function navigateLeaderboard() {
    const selector = document.querySelector('#ld-page')
    const buttons = document.querySelectorAll('.ld-navi')
    selector.setAttribute('disabled', '')
    buttons.forEach(e => e.setAttribute('disabled', ''))

    let page = +this.value
    const cur = +selector.value
    const max = +selector.querySelector('option:last-child').value
    if (this instanceof HTMLButtonElement) {
      switch (this.value) {
        case 'F': page = 1; break
        case 'P': page = Math.max(1, cur - 1); break
        case 'N': page = Math.min(max, cur + 1); break
        case 'L': page = max; break
      }
    }
    await drawLeaderboard(page)

    selector.removeAttribute('disabled')
    buttons.forEach(e => e.removeAttribute('disabled'))
    if (page === 1)
      document.querySelectorAll('.ld-navi[value="F"], .ld-navi[value="P"]').forEach(e => e.setAttribute('disabled', ''))
    if (page === max)
      document.querySelectorAll('.ld-navi[value="L"], .ld-navi[value="N"]').forEach(e => e.setAttribute('disabled', ''))
    selector.value = page
  }

  async function requestEntities() {
    request_controllers.entities.abort('0x00')
    request_controllers.entities = new AbortController()

    const data = localStorage.getJson('map-config')
    const { response } = await apiQuery('inview', {
      sw: ol.proj.toLonLat(view.calculateExtent(map.getSize()).slice(0, 2)).join(','),
      ne: ol.proj.toLonLat(view.calculateExtent(map.getSize()).slice(2, 4)).join(','),
      z: view.getZoom(),
      ...data
    }).catch(({ toast }) => apiCatch(toast))
    if (!response) return
    drawEntities(response)
  }
  function drawEntities(source) {
    points_source.clear(true)
    lines_source.clear(true)
    regions_source.clear(true)
    const zoom = view.getZoom()
    let npoints
    const highlight = localStorage.getJson('map-config')?.h ?? 0
    source.p.forEach(e => {
      const mpos = ol.proj.fromLonLat(e.c)
      const feature = new ol.Feature({
        geometry: new ol.geom.Point(mpos)
      })
      feature.setId(e.g)
      feature.setStyle([FeatureStyles.POINT(mpos, e.t, e.e), FeatureStyles.LIGHT(mpos, highlight, e.h)])
      feature.setProperties({
        team: e.t,
        cores: e.co,
        energy: e.e,
        highlight: e.h
      })
      points_source.addFeature(feature)
    })
    const [SEGMENT, NPCAP] = (function() {
      if (zoom <= 6) return [500, 30]
      if (zoom <= 9) return [100, 75]
      if (zoom <= 12) return [75, 110]
      return [35, 150]
    })()
    source.l.forEach(e => {
      const ls = turf.lineString(e.c)
      const len = turf.length(ls)
      npoints = Math.min(Math.ceil(len / SEGMENT), NPCAP)
      const arc = turf.greatCircle(...e.c, { npoints })
      arc.geometry.coordinates = arc.geometry.coordinates.map(m => ol.proj.fromLonLat(m))
      const format = new ol.format.GeoJSON()
      const feature = format.readFeature(arc)
      feature.setId(e.g)
      feature.setProperties({ team: e.t })
      feature.setStyle(new ol.style.Style({
        stroke: new ol.style.Stroke({ color: `${TeamColors[e.t].stroke()}9`, width: 2 })
      }))
      lines_source.addFeature(feature)
    })
    source.r.forEach(e => {
      const ts = []
      for (let i = 1; i <= 3; i++) {
        const pos = e.c[0].slice(i - 1, i + 1)
        const ls = turf.lineString(pos)
        const len = turf.length(ls)
        npoints = Math.min(Math.ceil(len / SEGMENT), NPCAP)
        ts.push(turf.greatCircle(...pos, { npoints }).geometry.coordinates)
      }
      const n = ts.flat().map(m => ol.proj.fromLonLat(m))
      n[n.length - 1] = n[0]

      const feature = new ol.Feature({ geometry: new ol.geom.Polygon([n]) })
      feature.setId(e.g)
      feature.setProperties({ team: e.t })
      feature.setStyle(new ol.style.Style({
        fill: new ol.style.Fill({ color: TeamColors[e.t].stroke() + (getSettings('opacity') ?? 2).toString(16) })
      }))
      regions_source.addFeature(feature)
    })

    if (navi_state.active) {
      const target = source.p.find(f => f.g === navi_state.point.g)
      if (typeof target !== 'undefined') {
        navi_state.point.te = target.t
        navi_state.point.dt = Date.now()
        localStorage.setJson('navi', navi_state)
      }
    }
  }

  function explodeRange(prop) {
    return new Promise(res => {
      clearInterval(timers.attack_ring)
      const ring = player_styles[2].getGeometry()
      const stroke = player_styles[2].getStroke()
      ring.setRadius(0)
      stroke.setColor(`#F00`)
      stroke.setWidth(prop.lv)
      let radius = 0
      let width = prop.lv
      timers.attack_ring = setInterval(() => {
        radius += 1
        width -= prop.lv / prop.range
        ring.setRadius(toOLMeters(radius))
        stroke.setWidth(width)
        player_feature.changed()
        if (radius >= prop.range) {
          clearInterval(timers.attack_ring)
          stroke.setColor('#0000')
          player_feature.changed()
          res(true)
        }
      }, 1500 / prop.range)
    })
  }

  function isInRange(coords) {
    return getDistance(coords) <= RANGE
  }
  function getDistance(to, from = player_feature.getGeometry().getCoordinates()) {
    const line = new ol.geom.LineString([from, ol.proj.fromLonLat(to)])
    return ol.sphere.getLength(line)
  }
  function distanceToString(distance, formatter) {
    const abs = Math.abs(distance)
    if (formatter) {
      if (abs < 1) return formatter.format(distance * 100) + ' ' + i18next.t('units.cm')
      else if (abs < 1000) return formatter.format(distance) + ' ' + i18next.t('units.m')
      else return formatter.format(distance / 1000) + ' ' + i18next.t('units.km')
    } else {
      if (abs < 1) return i18next.t('units.n-cm', { count: distance * 100 })
      else if (abs < 1000) return i18next.t('units.n-m', { count: distance })
      else return i18next.t('units.n-km', { count: distance / 1000 })
    }
  }
  function getBearing(to, from = player_feature.getGeometry().getCoordinates()) {
    return turf.bearing(ol.proj.toLonLat(from), to)
  }
  function getRhumb(a) {
    const abs = Math.min(Math.abs(a), 180)
    const dir = a < 0 ? i18next.t('info.bearing.west') : i18next.t('info.bearing.east')
    const rhi = RHA.findIndex(f => abs <= f)
    return RHN[rhi].replace(/\./g, dir)
  }
  function getViewRotation() {
    return view.getRotation() * 180 / Math.PI % 360
  }
  function areaToString(area, formatter) {
    const abs = Math.abs(area)
    if (formatter) {
      if (abs < 1) return formatter.format(area * 1e6) + ' ' + i18next.t('units.sqm')
      else return formatter.format(area) + ' ' + i18next.t('units.sqkm')
    } else {
      if (abs < 1) return i18next.t('units.n-sqm', { count: area * 1e6 })
      else return i18next.t('units.n-sqkm', { count: area })
    }
  }
  // function areaToString(area) {
  //   if (area < 1e-4) return i18next.t('units.ar', { count: area * 1e4 })
  //   else if (area < 10) return i18next.t('units.hect', { count: area * 100 })
  //   else return i18next.t('units.sqkm', { count: area })
  // }
  function timeToString(seconds) {
    if (seconds / 3600 >= 1) return i18next.t('units.hr', { count: Math.floor(seconds / 3600) })
    else if (seconds / 60 >= 1) return i18next.t('units.min', { count: Math.floor(seconds / 60) })
    else return i18next.t('units.sec', { count: seconds })
  }
  function timeToHMS(seconds, display_hours = true) {
    const str = [
      Math.floor(seconds / 3600),
      Math.floor(seconds % 3600 / 60),
      Math.floor(seconds % 3600 % 60)
    ].map(m => m.toString().padStart(2, '0'))
    return str.slice(!display_hours && str[0] === '00' ? 1 : 0).join(':')
  }

  function clearStorage() {
    const persist = ['follow', 'score', 'map-config', 'settings', 'uniques', 'pager-data', /^i18next_/]
    for (const key in localStorage) {
      if (persist.find(f => f instanceof RegExp ? f.test(key) : f == key)) continue
      localStorage.removeItem(key)
    }
  }
  function makeItemTitle(item) {
    if (item.t == 3) return item.ti
    else if (item.t >= 4) return ItemTypes[item.t]
    else return `${ItemTypes[item.t]}-${romanize(item.l)}`
  }
  function makeShortItemTitle(item) {
    switch (+item.t) {
      case 1: return i18next.t('items.core-short', { level: romanize(item.l) })
      case 2: return i18next.t('items.catalyser-short', { level: romanize(item.l) })
      case 4: return i18next.t('items.broom-short')
      case 5: return i18next.t('items.eraser-short')
    }
  }
  function makeDropItemTitle(item) {
    if (item.t == 3) return ItemTypes[item.t]
    else return jquerypassargs(
      $('<span>'),
      '$1$ $2$',
      $('<span>', { class: `item-icon type-${item.t} ${item.t > 3 ? `rarity-${item.l}` : ''}` })
        .css('background', item.t > 3 ? 'var(--text)' : `var(--level-${item.l})`),
      makeItemTitle(item)
    )
  }
  function makeScore(data) {
    const f = new Intl.NumberFormat(LANG, { maximumFractionDigits: 3 })
    const df = new Intl.NumberFormat(LANG, { signDisplay: 'exceptZero' })
    data.score.forEach((e, n) => {
      const { r, g, b } = e
      const is_zero = r + g + b == 0
      $('.score__graph').eq(n).css({
        '--r': is_zero ? 1 : r,
        '--g': is_zero ? 1 : g,
        '--b': is_zero ? 1 : b
      })
      for (const team in e) {
        const diff = data.diffs[n][team]
        const cell = $(`.score__table tbody .team-${team} td:nth-child(${n + 2})`)
        cell.find('.current').text(n == 0 ? f.format(e[team]) : i18next.t('units.n-sqkm', { count: e[team] }))
        cell.find('.diff').text(`(${n == 0 ? df.format(diff) : `${df.format(diff).match(/^[\-+]?/)[0]}${i18next.t('units.n-sqkm', { count: diff })}`})`)
      }
    })
  }
  function initSettings() {
    const data = localStorage.getJson('settings')
    if (data.imghid) $('.i-image-box').addClass('imghid')
    if (data.selfpos) $('#self-info__coord').parent().removeClass('hidden')
    $('html').attr('data-theme', data.theme)
    if (data.theme !== 'auto') $('meta[name="color-scheme"]').attr('content', data.theme)
    $(`.layers-config input[value="${data.base}"]`).prop('checked', true)
    document.querySelector('.effects').setAttribute('data-mode', data.efmode ?? 'full')
    if (data.ptcmir) document.querySelector('.i-buttons').classList.add('mirrored')
    document.querySelector('.deploy').dataset['magic'] = +data.useadu
  }
  function updateSettings() {
    const data = localStorage.getJson('settings')
    $('.tg-error').remove()
    $('.regions-opacity__range input').val(data.opacity || 2)
    $('#regions-opacity__cur').text(Math.round((data.opacity || 2) / 15 * 100) + '%')
    $('#account-guid').text(self_data.g)
    for (const key in data) {
      const target = $(`[data-setting="${key}"]`)
      const val = data[key]
      if (typeof val === 'boolean')
        target.prop('checked', typeof target.attr('data-invert') !== 'undefined' ? !val : !!val)
      else target.val(val)
    }
  }
  function changeSettings(key, value) {
    const data = localStorage.getJson('settings')
    data[key] = value
    localStorage.setJson('settings', data)
  }
  function getSettings(key) {
    return localStorage.getJson('settings')[key]
  }
  function getLocalStorageDefault(key) {
    switch (key) {
      case 'active-effects':
      case 'inventory-cache':
        return []
      case 'cooldowns':
      case 'refs-cache':
      case 'stats-buffer':
        return {}
      case 'refs-view':
        return { scroll: 0, q: 0, o: 1, t: 0b1111 }
      case 'navi':
        return {
          active: false,
          closed: false,
          target: [],
          point: {},
        }
      case 'map-config':
        return { l: 7, h: 0 }
      case 'pager-data':
        return {
          channel: 1,
          range: 3,
          latest: new Date(0).toISOString(),
        }
      case 'settings':
        return {
          lang: 'sys',
          theme: 'auto',
          imghid: false,
          dsvhid: false,
          arabic: false,
          selfpos: false,
          exref: false,
          base: 'cdb',
          plrhid: false,
          opacity: 2,
          efmode: 'full',
          atkord: false,
          strtdl: 'high',
          strtup: 'low',
          strtwp: 'high',
          lastwp: null,
          strtuo: 'low',
          ptcmir: false,
          useadu: true,
        }
      default:
        return null
    }
  }
  function updateEffects() {
    const data = localStorage.getJson('active-effects')
    const badges = Array.from(document.querySelector('.effects').children)
    if (data === null || data.length === 0) {
      badges.forEach(e => e.remove())
      return
    }
    data.forEach((effect, n) => {
      const diff = Math.round((new Date(effect.x).getTime() - Date.now()) / 1000)
      let badge = badges[n]
      if (typeof badge === 'undefined') {
        if (diff <= 0) return
        badge = document.createElement('span')
        badge.className = 'effect'
        badge.setAttribute('data-type', effect.t)
        badge.textContent = effect.i
        document.querySelector('.effects').append(badge)
      }
      if (diff <= 0) {
        badge.remove()
        return
      }
      badge.setAttribute('data-dur', timeToString(diff, true))
    })
    localStorage.setJson('active-effects', data.filter(f => new Date(f.x).getTime() > Date.now()))
  }
  function updateNavi() {
    const wrp = document.querySelector('.navi-floater')
    if (!navi_state.active) {
      if (!wrp.classList.contains('hidden'))
        wrp.classList.add('hidden')
      return
    }

    wrp.classList.remove('hidden')
    wrp.style.borderColor = `var(--team-${navi_state.point.te})`
    if (navi_state.closed) wrp.classList.add('closed')
    else wrp.classList.remove('closed')

    wrp.querySelector('.navi-image').style.backgroundImage = `url(${getPointImage(navi_state.point.i)})`
    wrp.querySelector('.navi-title').textContent = navi_state.point.t

    const distance = getDistance(navi_state.target)
    const bearing = Math.round(getBearing(navi_state.target))
    wrp.querySelector('#navi-bearing').style.transform = `rotate(${Math.round(bearing + getViewRotation())}deg)`
    wrp.querySelector('#navi-rhumb').textContent = getRhumb(bearing)
    wrp.querySelector('#navi-distance').textContent = distanceToString(distance)

    if (distance <= 45) {
      if (document.querySelector('.info').classList.contains('hidden')) {
        request_controllers.points.abort('0x00')
        request_controllers.points = new AbortController()
        apiQuery('point', { guid: navi_state.point.g })
          .catch(({ toast }) => apiCatch(toast))
          .then(({ response }) => {
            showInfo(response.data)
            points_source.changed()
          })
      } else {
        document.querySelector('#i-navigate').classList.remove('active')
      }
      navi_state.active = false
      navi_state.target = []
      navi_state.point = {}
      localStorage.setJson('navi', navi_state)
      updateNavi()
    } else if (navi_state.point.dt + 5 * 60e3 < Date.now()) {
      apiQuery('point', { guid: navi_state.point.g, status: 1 })
        .then(({ response }) => {
          navi_state.point.te = response.data.te
          navi_state.point.dt = Date.now()
          localStorage.setJson('navi', navi_state)
        })
    }
  }
  function closePopup(popup) {
    if (popup.classList.contains('pp-removable')) {
      popup.remove()
      return
    }
    popup.classList.add('hidden')
    popup.querySelectorAll('.toastify').forEach(e => e.remove())
    popup_toasts.splice(0, Infinity)
    popup.querySelectorAll('.pb-sub').forEach(e => e.classList.add('hidden'))
    if ($('.info').hasClass('hidden')) {
      clearInterval(timers.info_cooldown)
      clearInterval(timers.score)
      $('.info .inventory__manage-amount').remove()
      if (map.getProperties().ignore_follow) map.setProperties({ ignore_follow: false })
      document.querySelector('#draw').classList.remove('locked')
      document.querySelector('#draw-count').textContent = '[N/A]'
      request_controllers.draw.abort('0x00')
    }
    Object.keys(popovers).forEach(destroyPopover)
  }
  function destroyPopover(id) {
    if (popovers[id] === null) return
    popovers[id].state.elements.popper.classList.add('hidden')
    popovers[id].destroy()
    popovers[id] = null
  }
  function confirmOuter(event) {
    event.preventDefault()
    const href = $(event.currentTarget).attr('data-href') || $(event.currentTarget).attr('href')
    if (!href) return

    const parsed = new URL(href, location.href).toString()
    const proof = confirm(i18next.t('popups.outer', { href: parsed }))
    if (!proof) return
    location.href = parsed
  }

  function capitalize(str) {
    return str.slice(0, 1).toUpperCase() + str.slice(1)
  }
  function fcapitalize(str) {
    return str.slice(0, 1).toUpperCase() + str.slice(1).toLowerCase()
  }

  /**
   *
   * @param {any} container A jQuery element that will contain the result
   * @param {string} template A template string. Each argument passed as `$n$` with `n = [1; +Infinity)`
   * @param  {...any} elements An array of elements that will be passed as arguments
   * @returns {any} A template string with passed arguments
   */
   function jquerypassargs(container, template, ...elements) {
    // $1$
    const args = template.split('$')
    args.forEach(arg => {
      const match = arg.match(/^\d+$/)
      if (match) container.append(elements[+match[0] - 1])
      else container.append(arg)
    })
    return container
  }

  function getLevelByExp(exp) {
    if (exp >= Levels[Levels.length - 1].total) return Levels[Levels.length - 1]
    return Levels[Levels.findIndex(f => f.total > exp) - 1] || Levels[0]
  }
  function romanize(num) {
    if (localStorage.getJson('settings')?.arabic) return num

    const lookup = { M: 1000, CM: 900, D: 500, CD: 400, C: 100, XC: 90, L: 50, XL: 40, X: 10, IX: 9, V: 5, IV: 4, I: 1 }
    let roman = ''
    for (const i in lookup) {
      while (num >= lookup[i]) {
        roman += i
        num -= lookup[i]
      }
    }
    return roman
  }
  function toOLMeters(meters, rate = 1 / ol.proj.getPointResolution('EPSG:3857', 1, view.getCenter(), 'm')) {
    return meters * rate
  }
  function calculateAngle(percent, offset = 0) {
    const full = 2 * Math.PI
    return [
      full * offset - Math.PI / 2,
      full * offset + full * percent - Math.PI / 2
    ]
  }
  function isMobile() {
    if ('maxTouchPoints' in navigator) return navigator.maxTouchPoints > 0
    else if ('msMaxTouchPoints' in navigator) return navigator.msMaxTouchPoints > 0
    else if ('orientation' in window) return true
    else return /\b(BlackBerry|webOS|iPhone|IEMobile|Android|Windows Phone|iPad|iPod)\b/i.test(navigator.userAgent)
  }
  function getLanguage() {
    return navigator.language
  }
  function setBaselayer(type = getSettings('base') || 'osm') {
    let source
    if (type == 'osm') {
      source = new ol.source.OSM({ attributions: [] })
    } else if (type == 'goo') {
      source = new ol.source.XYZ({ url: 'https://mt{0-3}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}' })
    } else if (type == 'cdb') {
      const theme = getSettings('theme')
      if (theme == 'auto' && is_dark || theme == 'dark')
        source = new ol.source.XYZ({ url: 'https://{a-c}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png' })
      else
        source = new ol.source.XYZ({ url: 'https://{a-c}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png' })
    } else source = new ol.source.TileImage({ url: '/assets/empty.png' })
    base_layer.setSource(source)
    $('.ol-layer__base').attr('data-code', type)
  }
  function switchLoading(step, is_success = true) {
    const cur = document.querySelector('.loading-screen__task.loading')
    if (cur !== null) {
      switchLoadingAsync(cur.getAttribute('data-step'), is_success)
    }
    switchLoadingAsync(step)
  }
  function switchLoadingAsync(step, state = null) {
    const item = document.querySelector(`.loading-screen__task[data-step="${step}"]`)
    if (item === null) return

    if (state === null) {
      item.classList.add('loading')
      if (item.classList.contains('hidden'))
        item.classList.remove('hidden')
    } else {
      item.classList.remove('loading')
      item.classList.add(state ? 'success' : 'failure')
    }

    const exclude = document.querySelectorAll(`.loading-screen__task[data-exby="${step}"]`)
    if (exclude.length) {
      exclude.forEach(e => e.remove())
    }

    if (Array.from(document.querySelectorAll('.loading-screen__task')).every(e => e.classList.contains('success'))) {
      document.querySelector('.loading-screen').remove()
    }
  }
  function apiQuery(endpoint, data = {}, toast_opts = [], exclude = []) {
    return new Promise(async (res, rej) => {
      const h_obj = {
        'accept-language': LANG
      }
      exclude.forEach(e => delete h_obj[e])
      const request = await flavored_fetch(makeURL(`/api/${endpoint}`, data), {
        method: 'get',
        headers: h_obj,
        signal: getAbortSignal(endpoint)
      }).catch(err => {
        if (err === '0x00') return console.debug('Previous request was aborted')
        const toast = createToast(i18next.t('popups.network-fail'), ...toast_opts)
        toast.options.className = 'error-toast'
        rej({ error: i18next.t('popups.network-fail'), toast })
      })
      if (typeof request === 'undefined') return
      if (request.status == 401) {
        clearStorage()
        location.href = '/login/'
        return
      }
      const response = await request.json()
      const version = request.headers.get('x-sbg-version')
      if (VERSION && version !== VERSION) {
        const toast = createToast(i18next.t('popups.update', { version }), ...toast_opts)
        toast.options.className = 'error-toast'
        toast.showToast()
      }
      if (response.error || request.status >= 400) {
        const toast = createToast(response.error || response.reason, ...toast_opts)
        toast.options.className = 'error-toast'
        return rej({ error: response.error || response.reason, toast })
      }
      res({ request, response })
    })
  }
  function apiSend(endpoint, method, data, toast_opts = [], exclude = []) {
    return new Promise(async (res, rej) => {
      const h_obj = {
        'accept-language': LANG,
        'content-type': 'application/json'
      }
      exclude.forEach(e => delete h_obj[e])
      const request = await flavored_fetch(`/api/${endpoint}`, {
        method,
        body: JSON.stringify(data),
        headers: h_obj
      }).catch(error => {
        const toast = createToast(i18next.t('popups.network-fail'), ...toast_opts)
        toast.options.className = 'error-toast'
        rej({ error, toast })
      })
      if (typeof request === 'undefined') return
      if (request.status == 401) {
        clearStorage()
        location.href = '/login/'
        return
      }
      const response = await request.json()
      const version = request.headers.get('x-sbg-version')
      if (VERSION && version !== VERSION) {
        const toast = createToast(i18next.t('popups.update', { version }), ...toast_opts)
        toast.options.className = 'error-toast'
        toast.showToast()
      }
      if (response.error || request.status >= 400) {
        const toast = createToast(response.error || response.reason, ...toast_opts)
        toast.options.className = 'error-toast'
        return rej({ error: response.error || response.reason, toast })
      }
      res({ request, response })
    })
  }
  function apiCatch(toast, popup = false) {
    if (popup) handlePopupToasts(toast)
    else toast.showToast()
    return { request: null, response: null }
  }
  function getAbortSignal(endpoint) {
    switch (endpoint) {
      case 'inview': return request_controllers.entities.signal
      case 'point': return request_controllers.points.signal
      case 'draw': return request_controllers.draw.signal
      case 'profile': return request_controllers.profile.signal
      default: return null
    }
  }
  function makeURL(url, params) {
    const sp = new URLSearchParams()
    if (!Object.keys(params).length) return url

    for (const key in params) {
      const value = params[key]
      if (value instanceof Array)
        value.forEach(e => sp.append(key + '[]', e))
      else if (value instanceof Object)
        sp.append(key, JSON.stringify(value))
      else
        sp.append(key, value)
    }
    return `${url}?${sp.toString()}`
  }

  function createToast(text = '', container = null, position = 'top center') {
    const parts = position.split(/\s+/)
    const toast = Toastify({
      text,
      duration: 3000,
      gravity: parts[0],
      position: parts[1],
      escapeMarkup: false,
      className: 'interaction-toast',
      selector: container
    })
    toast.options.id = Math.round(Math.random() * 1e5)
    toast.options.onClick = () => toast.hideToast()
    toast.options.callback = () => {
      const index = popup_toasts.findIndex(f => f.options.id == toast.options.id)
      if (index !== -1) popup_toasts.splice(index, 1)
    }
    return toast
  }
  function handlePopupToasts(new_toast) {
    new_toast.showToast()
    popup_toasts.push(new_toast)
    if (popup_toasts.length <= 3) return
    popup_toasts[0].hideToast()
  }
  function updateNotifs(data = null) {
    const { d, m, n } = data ?? { d: 0, m: 0, n: 0 }
    const button = document.querySelector('#notifs-menu')
    Object.keys(button.dataset).forEach(key => { delete button.dataset[key] })
    if (d + n + m > 0) button.dataset['active'] = ''
    if (d > 0) button.dataset['direct'] = ''
    if (n > 0) button.dataset['alerts'] = ''
    if (m > 0) button.dataset['pings'] = ''
    button.querySelector('#nm-direct-count').textContent = d
    button.querySelector('#nm-alerts-count').textContent = n
    button.querySelector('#nm-pings-count').textContent = m
  }
  function makeNotifsEntry(tab, data, params) {
    const date = new Date(data.ti)
    const link = $('<span>', { class: 'profile-link' }).text(data.na).css('color', `var(--team-${data.ta})`).attr('data-name', data.na)
      .on('contextmenu', openProfile)
      .on('click', addMention)
    const title = $('<span>', { class: 'notifs__entry-title' })
    let text

    switch (tab) {
      case 1:
      case 4: {
        title.append(link)

        if (data.mt.length) {
          const msg = $('<span>', { class: 'notifs__entry-text' })
          for (let i = -1; i < data.mt.length; i++) {
            const c = data.mt[i]
            const n = data.mt[i + 1]
            msg.append(data.t.slice(c?.[1] ?? 0, n?.[0] ?? Infinity))
            if (typeof n !== 'undefined') {
              const name = data.t.slice(n[0], n[1])
              const link = $('<span>', { class: 'nm-ping profile-link' })
                .text(name)
                .attr('data-name', name.slice(1))
                .css('--a', `var(--team-${n[2]})`)
                .on('contextmenu', openProfile)
                .on('click', addMention)
              msg.append(link)
            }
          }
          text = msg
        } else {
          text = $('<span>', { class: 'notifs__entry-text', text: data.t })
        }
        break
      }
      case 2:
        title
          .append(link)
          .append($('<span>', { html: ' &rarr; ' }))
          .append($('<span>', { class: 'profile-link recipient' }).text(data.nr).css('color', `var(--team-${data.tr})`).attr('data-name', data.nr)
            .on('contextmenu', openProfile)
            .on('click', addMention))
        text = $('<span>', { class: 'notifs__entry-text', text: data.t })
        break
      case 3:
        title.text(data.t)
        text = jquerypassargs(
          $('<span>', { class: 'notifs__entry-text' }),
          i18next.t('notifs.alert-text'),
          link
        )
        break
    }

    const container = $('<div>', {
      class: String.prototype.concat(
        'notifs__entry',
        !params.found_latest && data.ti >= params.latest ? (params.found_latest = true, ' latest') : '',
        data.p ? ' ping' : '',
      ),
      'data-id': data.id,
      'data-target': data.g
    })
      .append($('<span>', { class: 'notifs__entry-stamp' })
        .append($('<span>', { class: 'notifs__entry-time', text: date.toLocaleString(LANG, params.config) }))
        .append($('<span>', { class: 'notifs__entry-date', text: date.toLocaleString(LANG, { month: 'short', day: 'numeric' }) }))
      )
      .append(title)
      .append(text)

    if (tab === 3) {
      container.append(
        $('<button>', { class: 'notifs__entry-view notifs__entry-button icon-button' })
          .append($('<svg viewBox="0 0 597 512" height="1em"><use href="#fas-eye"></use></svg>'))
          .on('click', () => {
            document.querySelector('#toggle-follow').checked = false
            localStorage.setItem('follow', false)
            view.setCenter(ol.proj.fromLonLat(data.c))
            $('.notifs').addClass('hidden')
          })
      )
    } else if (data.na !== self_data.n) {
      title.prepend(
        $('<button>', { class: 'notifs__entry-report notifs__entry-button icon-button' })
          .append($('<svg viewBox="0 0 512 512" height="1em"><use href="#fas-flag"></use></svg>'))
          .on('click', async () => {
            const proof = confirm(i18next.t('notifs.report-prompt', { name: data.na }))
            if (!proof) return

            const buttons = document.querySelectorAll('.notifs__entry-report')
            buttons.forEach(e => e.setAttribute('disabled', ''))
            await apiSend('report', 'post',
              { form: 0, subject: data.id },
              [document.querySelector('.notifs'), 'top center']
            ).catch(({ toast }) => apiCatch(toast, true))
              .finally(() => buttons.forEach(e => e.removeAttribute('disabled')))

            const toast = createToast(i18next.t('notifs.report-success'), document.querySelector('.notifs'))
            handlePopupToasts(toast)
          })
      )
    }
    return container[0]
  }
  async function sendNotif() {
    const input = document.querySelector('#notifs-message')
    const send = document.querySelector('#notifs-send')

    const text = (input.value ?? '').trim()
    if (text === '') return

    const container = document.querySelector('.notifs')
    const wrp = document.querySelector('.notifs__list')
    const tab = +wrp.dataset['tab']

    document.querySelectorAll('.notifs__tab').forEach(e => e.classList.add('locked'))
    document.querySelector('#nr-range').setAttribute('disabled', '')
    input.setAttribute('disabled', '')
    send.setAttribute('disabled', '')
    wrp.dataset['state'] = 'loading'
    const { response } = await apiSend('notifs', 'post', {
      channel: tab,
      text,
      pos: ol.proj.toLonLat(player_feature.getGeometry().getCoordinates()),
    }, [container, 'top center'])
      .catch(({ toast }) => apiCatch(toast, container))
      .finally(() => {
        document.querySelectorAll('.notifs__tab').forEach(e => e.classList.remove('locked'))
        document.querySelector('#nr-range').removeAttribute('disabled')
        input.removeAttribute('disabled')
        send.removeAttribute('disabled')
        wrp.dataset['state'] = 'idle'
      })
    if (!response) return

    input.value = ''
    const params = {
      config: {
        hour: '2-digit',
        minute: '2-digit',
      },
    }
    const el = makeNotifsEntry(tab, response, params)
    const data = localStorage.getJson('pager-data')
    data.latest = new Date().toISOString()
    localStorage.setJson('pager-data', data)
    wrp.append(el)
    wrp.scrollTo({ top: wrp.scrollHeight, left: 0 })
    wrp.dataset['latest'] = data.latest
    input.focus()
  }
  function addMention(data, override = false) {
    let name
    if (data instanceof $.Event) name = $(data.currentTarget).attr('data-name')
    else if (typeof data === 'string' && data.match(data.match(/^[a-z\d]+$/i))) name = data
    else return
    if (name === 'n/a') return

    const input = document.querySelector('#notifs-message')
    if (input.hasAttribute('disabled')) return
    if (override)
      input.value = ''
    input.value += '@' + name + ' '
    input.focus()
  }
})();
