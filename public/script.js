
window.onTelegramAuth = async (data) => {
  const request = await fetch('/api/link', {
      method: 'post',
      body: JSON.stringify(data),
      headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${localStorage.getItem('auth')}`
      }
  })
  const response = await request.json()
  if (request.status !== 200) {
      $('#telegram-login-sbg_game_bot').after($('<div>', { text: i18next.t('telegram.failed'), class: 'tg-error' }).css('color', 'var(--accent)'))
      console.error('Error while linking TG:', response)
  }
  if (response.al) console.warn('Note: Telegram account is already linked')
  $('#telegram-login-sbg_game_bot').after($('<span>', { text: i18next.t('telegram.done') }).css('color', 'var(--progress)'))
  $('#telegram-login-sbg_game_bot, .telegram-auth-button, .tg-error').remove()
}

;(async function main() {
  let is_dev = false
  {const rq=await fetch('/api/isdev',{headers:{authorization:`Bearer ${localStorage.getItem('auth')}`}});const rs=await rq.json();is_dev=rs.s}
  if (!is_dev && !isMobile()) return
  initSettings() // это создает настройки
  let is_dark = getSettings('theme') == 'auto'
      ? matchMedia('(prefers-color-scheme: dark)').matches
      : getSettings('theme') == 'dark'
  let start_follow = false

  const LANG = getSettings('lang') == 'sys' ? getLanguage() : getSettings('lang')
  const META = await (await fetch('/i18n/meta.json')).json()
  await i18next.use(i18nextChainedBackend).init({
      lng: LANG,
      supportedLngs: META.supported,
      fallbackLng: META.fallbacks,
      backend: {
          backends: [i18nextLocalStorageBackend, i18nextHttpBackend],
          backendOptions: [{ prefix: 'i18next_' }, { loadPath: '/i18n/{{lng}}/main.json' }]
      },
      defaultNs: 'main',
      ns: ['main'],
      load: 'languageOnly'
  })

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
      i18next.t('items.types.reference')
  ]

  const Cores = [
      { lv: 0, eng: 0, lim: 0 }, { lv: 1, eng: 500, lim: 6 },
      { lv: 2, eng: 750, lim: 6 }, { lv: 3, eng: 1000, lim: 6 },
      { lv: 4, eng: 1500, lim: 3 }, { lv: 5, eng: 2000, lim: 3 },
      { lv: 6, eng: 2500, lim: 2 }, { lv: 7, eng: 3500, lim: 2 },
      { lv: 8, eng: 4000, lim: 1 }, { lv: 9, eng: 5250, lim: 1 },
      { lv: 10, eng: 6500, lim: 1 }
  ]
  const Catalysers = [
      { lv: 0, damage: 0, range: 0 },
      { lv: 1, damage: 95, range: 42 },
      { lv: 2, damage: 180, range: 48 },
      { lv: 3, damage: 225, range: 58 },
      { lv: 4, damage: 420, range: 72 },
      { lv: 5, damage: 575, range: 90 },
      { lv: 6, damage: 840, range: 112 },
      { lv: 7, damage: 1000, range: 138 },
      { lv: 8, damage: 1625, range: 164 },
      { lv: 9, damage: 2075, range: 186 },
      { lv: 10, damage: 2900, range: 214 }
  ]
  const TeamColors = [
      {
          fill: () => is_dark || getSettings('base') == 'goo' ? '#AAAAAA80' : '#44444480',
          stroke: () => is_dark || getSettings('base') == 'goo' ? '#AAA' : '#444'
      },
      { fill: '#BB000080', stroke: '#B00' },
      { fill: '#00BB0080', stroke: '#0B0' },
      { fill: '#0088FF80', stroke: '#08F' }
  ]

  const Packages = [
      'jQuery', 'OpenLayers',
      'Splide.js', 'Toastify.js',
      'i18next'
  ]
  const pkg_avail = [
      typeof $,
      typeof ol,
      typeof i18next,
      typeof Splide,
      typeof Toastify
  ]
  const pkg_fail = pkg_avail.findIndex(f => f === 'undefined')
  if (pkg_fail !== -1) {
      $('body').empty().css({ display: 'grid' }).append($('<div>', {
          class: 'fatal-error',
          text: i18next.t('popups.package-fail', { name: Packages[pkg_fail] })
      }))
      return
  }

  let self_data
  let VERSION
  {
      const { request, response } = await apiQuery('self').catch(({ toast }) => apiCatch(toast))
      if (!response) return
      self_data = response
      VERSION = request.headers.get('SBG-Version')
  }

  jqueryI18next.init(i18next, $, { useOptionsAttr: true })
  $('html').attr('lang', LANG)
  $('body').localize()
  $('title').text(i18next.t('title'))

  updateSelfInfo()
  console.log(VERSION)
  initSettings() // это применяет настройки

  {
      const { response } = await apiQuery('inventory').catch(({ toast }) => apiCatch(toast))
      if (!response) return
      localStorage.setItem('inventory-cache', JSON.stringify(response.i))
      const total = response.i.map(m => m.a).reduce((acc, e) => acc += e, 0)
      $('#self-info__inv').text(total)
          .parent().css('color', total >= 3000 ? 'var(--accent)' : '')
  }

  const player_feature = new ol.Feature({
      geometry: new ol.geom.Point(ol.proj.fromLonLat([0, 0]))
  })
  const player_styles = [new ol.style.Style({
      image: new ol.style.Icon({
          src: `/icons/player_${self_data.t}.svg`
      })
  }), new ol.style.Style({ // range
      geometry: new ol.geom.Circle(ol.proj.fromLonLat([0, 0]), toOLMeters(45, 1)),
      stroke: new ol.style.Stroke({ color: '#F80', width: 2 })
  }), new ol.style.Style({ // blast range
      geometry: new ol.geom.Circle(ol.proj.fromLonLat([0, 0]), 0),
      stroke: new ol.style.Stroke({ color: '#F000', width: 2 })
  })]
  player_feature.setStyle(player_styles)

  const player_source = new ol.source.Vector({ features: [player_feature] })
  const player_layer = new ol.layer.Vector({ source: player_source, name: 'player', className: 'ol-layer__player', zIndex: 3 })

  const points_source = new ol.source.Vector()
  const points_layer = new ol.layer.Vector({ source: points_source, name: 'points', className: 'ol-layer__points', zIndex: 2 })

  const lines_source = new ol.source.Vector()
  const temp_lines_source = new ol.source.Vector()
  const lines_layer = new ol.layer.Vector({ source: lines_source, name: 'lines', className: 'ol-layer__lines', zIndex: 1 })
  const temp_lines_layer = new ol.layer.Vector({ source: temp_lines_source, name: 'lines', className: 'ol-layer__lines', zIndex: 1 })

  const FeatureStyles = {
      NEUTRAL: (pos) => new ol.style.Style({
          geometry: new ol.geom.Circle(pos, 12),
          fill: new ol.style.Fill({ color: TeamColors[0].fill() }),
          stroke: new ol.style.Stroke({ color: TeamColors[0].stroke(), width: 2 }),
      }),
      CAPTURED: (pos, team, energy) => new ol.style.Style({
          geometry: new ol.geom.Circle(pos, 12),
          renderer: (coords, state) => {
              const ctx = state.context
              const [[xc, yc], [xe, ye]] = coords
              const radius = Math.sqrt((xe - xc) ** 2 + (ye - yc) ** 2)

              ctx.lineWidth = 2
              ctx.strokeStyle = TeamColors[team].stroke
              ctx.fillStyle = TeamColors[0].fill()
              ctx.beginPath()
              ctx.arc(xc, yc, radius, ...calculateAngle(1 - energy, energy))
              ctx.lineTo(xc, yc)
              ctx.fill()

              ctx.fillStyle = TeamColors[team].fill
              ctx.beginPath()
              ctx.arc(xc, yc, radius, ...calculateAngle(energy))
              ctx.lineTo(xc, yc)
              ctx.fill()
              ctx.beginPath()
              ctx.arc(xc, yc, radius, 0, 2 * Math.PI)
              ctx.stroke()
          }
      }),
      TEXT: (text) => new ol.style.Style({
          text: new ol.style.Text({
              font: '14px Manrope',
              offsetY: -15,
              text,
              fill: new ol.style.Fill({ color: '#000' }),
              stroke: new ol.style.Stroke({ color: '#FFF', width: 3 })
          }),
          zIndex: 2
      })
  }

  // EPSG:4326 - common
  // EPSG:3857 - webmercator
  const base_layer = new ol.layer.Tile({ className: 'ol-layer__base' })
  setBaselayer('osm')
  const view = new ol.View({
      center: [0, 0],
      zoom: 17,
      minZoom: 1,
      maxZoom: 20
  })
  const map = new ol.Map({
      target: 'map',
      layers: [base_layer, lines_layer, temp_lines_layer, points_layer, player_layer],
      view
  })

  ;(function handleURLLinks() {
      const params = new URLSearchParams(location.search)
      history.replaceState({}, '', location.pathname)
      if (params.has('point')) {
          const guid = params.get('point')
          if (!guid.match(/^[a-z\d]{12}\.22a$/)) return
          // localStorage.setItem('follow', false)
          showInfo(guid)
      } else if (params.has('player')) {
          const query = params.get('player')
          if (!query.match(/^[a-z\d]{12}\.28d$/) && !query.match(/^[a-z\d]+$/i)) return
          openProfile(query)
      }
  })();

  map.on('click', e => {
      map.forEachFeatureAtPixel(e.pixel, (feature, layer) => {
          if (layer.get('name') != 'points') return
          showInfo(feature.getId())
          if (e.originalEvent.altKey) window._feature = feature
      })
      if (e.originalEvent.altKey) {
          console.log(...ol.proj.toLonLat(e.coordinate))
      }
  })

  const prev_pos = {
      center: map.getView().getCenter(),
      zoom: map.getView().getZoom(),
      rotation: map.getView().getRotation()
  }
  map.on('moveend', () => {
      const angle = player_styles[0].getImage().getRotation()
      player_styles[0].getImage().setRotation(angle + (map.getView().getRotation() - prev_pos.rotation))
      player_feature.changed()
      prev_pos.rotation = map.getView().getRotation()

      const zoom = map.getView().getZoom()
      if (zoom % 1 != 0) return map.getView().setZoom(Math.round(zoom))

      const offset = new ol.geom.LineString([prev_pos.center, map.getView().getCenter()])
      if (ol.sphere.getLength(offset) <= 30 && Math.abs(prev_pos.zoom - zoom) < 1) return
      prev_pos.center = map.getView().getCenter()
      prev_pos.zoom = zoom
      requestEntities()
  })
  setInterval(async () => await requestEntities(), 5 * 60 * 1000)

  let watcher
  if ('geolocation' in navigator) {
      watcher = navigator.geolocation.watchPosition(({ coords }) => {
          //console.log(coords)
          // coords = { longitude: 37.9080643523613, latitude: 55.97469155253259 }
          movePlayer(coords)
          $('#toggle-follow').attr('data-active', localStorage.getItem('follow') != 'false')
          if (!start_follow) {
              start_follow = true
              player_styles[1].getGeometry().setRadius(toOLMeters(45))
              setBaselayer()
              $('.ol-layer__base').attr('data-code', getSettings('base'))
              if (getSettings('plrhid') == true) $('.ol-layer__player').addClass('hidden')
          }
      }, error => {
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
                  $('#toggle-follow').remove()
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
      info_controls: null,
      info_cooldown: null,
      player_xpup: null,
      attack_ring: null,
      damage_texts: []
  }
  const point_state = {
      cores: [],
      position: [],
      team: null,
      lines_count: { i: 0, o: 0 },
      possible_lines: []
  }
  const popup_toasts = []

  const slider_config = {
      drag: 'free', snap: true, perPage: 3, pagination: false, wheel: true,
      direction: 'ltr', height: 100, gap: '.5em', focus: 'center', trimSpace: false
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
      const inventory = JSON.parse(localStorage.getItem('inventory-cache')) || []
      const catalyser = inventory.find(f => f.g == $(event.slide).attr('data-guid'))
      const highlevel = catalyser.l > self_data.l
      $('#attack-slider-fire').prop('disabled', highlevel)
      $('.attack-slider-highlevel').css('color', highlevel ? '#F00' : '#0000')
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

  slider_config.height = 150
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

  $('#self-info__name').attr('data-guid', self_data.g)
  $('.profile-link').on('click', openProfile)
  $('.popup-close, .popup-header').on('click', e => {
      const parent = $(e.target).parents('.popup')
      closePopup(parent)
  })
  $('.popup-touch').on('click touchstart', () => {
      const popup = $('.popup:not(.hidden)')
      closePopup(popup)
  })
  setInterval(function clearExpiredCache() {
      const now = Date.now()
      const cooldowns = JSON.parse(localStorage.getItem('cooldowns')) || {}
      const refs_cache = JSON.parse(localStorage.getItem('refs-cache')) || {}
      for (const guid in cooldowns) { if (cooldowns[guid] <= now) delete cooldowns[guid] }
      for (const guid in refs_cache) { if (refs_cache[guid] <= now) delete refs_cache[guid] }
      localStorage.setItem('cooldowns', JSON.stringify(cooldowns))
      localStorage.setItem('refs-cache', JSON.stringify(refs_cache))
  }, 5 * 60e3)
  $('#discover').on('click', async () => {
      $('#discover').addClass('locked').prop('disabled', true)
      const guid = $('.info').attr('data-guid')
      const { response } = await apiSend('discover', 'post', {
          position: ol.proj.toLonLat(player_feature.getGeometry().getCoordinates()),
          guid
      }, [$('.info')[0], 'top right']).catch(({ toast }) => apiCatch(toast, true))
      $('#discover').removeClass('locked').prop('disabled', false)
      if (!response) return
      const cache = JSON.parse(localStorage.getItem('inventory-cache'))
      response.loot.forEach(e => {
          const item = cache.find(f => f.g === e.g)
          if (!item) cache.push(e)
          else item.a += e.a
      })
      localStorage.setItem('inventory-cache', JSON.stringify(cache))

      const total = cache.map(m => m.a).reduce((acc, e) => acc += e)
      $('#self-info__inv').text(total)
          .parent().css('color', total >= 3000 ? 'var(--accent)' : '')
      const ref = cache.find(f => f.t === 3 && f.l === $('.info').attr('data-guid'))
      $('#i-ref').text(i18next.t('info.refs', { count: ref?.a || 0 })).attr('data-has', ref ? 1 : 0)

      self_data.x = response.xp.cur
      self_data.l = getLevelByExp(response.xp.cur).lv
      showExpDiff(response.xp.diff)
      updateSelfInfo()

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

      const cooldowns = JSON.parse(localStorage.getItem('cooldowns')) || {}
      cooldowns[guid] = {
          t: response.burnout < 5 ? Date.now() + 90e3 : response.burnout,
          c: response.burnout < 5 ? response.burnout : 0
      }
      localStorage.setItem('cooldowns', JSON.stringify(cooldowns))
      showCooldownTimer(guid)

      if (!$('.attack-slider-wrp').hasClass('hidden')) {
          $('#catalysers-list').empty()
          cache.filter(f => f.t === 2).sort((a, b) => a.l - b.l).forEach(e => {
              $('#catalysers-list').append($('<li>', { class: 'splide__slide', 'data-guid': e.g })
                  .append($('<span>', { class: 'catalysers-list__level', text: i18next.t('items.catalyser-short', { level: romanize(e.l) }) }).css('color', `var(--level-${e.l})`))
                  .append($('<span>', { class: 'catalysers-list__amount', text: i18next.t('items.amount', { count: e.a }) }))
              )
          })
          attack_slider.refresh()
      }

      $('#cores-list').empty()
      cache.filter(f => f.t === 1).sort((a, b) => a.l - b.l).forEach(e => {
          $('#cores-list').append($('<li>', { class: 'splide__slide', 'data-guid': e.g })
              .append($('<span>', { class: 'cores-list__level', text: i18next.t('items.core-short', { level: romanize(e.l) }) }).css('color', `var(--level-${e.l})`))
              .append($('<span>', { class: 'cores-list__amount', text: i18next.t('items.amount', { count: e.a }) }))
          )
      })
      deploy_slider.refresh()
  })
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
          const core = point_state.cores.find(f => f.g == response.c.g)
          core.l = response.c.l
          core.e = response.c.e
          core.o = response.c.o
          $('#i-level').text(`Lv-${response.l}`).css('color', `var(--level-${response.l})`)
          $(`.i-stat__core[data-guid="${response.c.g}"]`).text(romanize(response.c.l)).css({
              '--energy': `${response.c.e}%`,
              '--bgc': `var(--level-${response.c.l})`
          })
          const info = $(`.i-stat__core-info[data-guid="${response.c.g}"] span`)
          info.eq(0).text(`${Math.floor(response.c.e / Cores[response.c.l].eng * 100)}%`).attr('title', `${response.c.e} / ${Cores[response.c.l].eng}`)
          info.eq(1).text(`${response.c.o}`)
          xp = response.xp
      }

      // обновляем инвентарь
      const inventory = JSON.parse(localStorage.getItem('inventory-cache'))
      const index = inventory.findIndex(f => f.g == guid)
      const item = inventory[index]
      if (--item.a == 0) {
          inventory.splice(index, 1)
          $(`#cores-list [data-guid="${guid}"]`).remove()
      } else {
          $(`#cores-list [data-guid="${guid}"] .cores-list__amount`).text(`x${item.a}`)
      }
      deploy_slider.refresh()
      localStorage.setItem('inventory-cache', JSON.stringify(inventory))
      manageDeploy()

      // обновляем данные
      const total = inventory.map(m => m.a).reduce((acc, e) => acc += e)
      $('#self-info__inv').text(total)
          .parent().css('color', total >= 3000 ? 'var(--accent)' : '')
      self_data.x = xp.cur
      self_data.l = getLevelByExp(xp.cur).lv
      showExpDiff(xp.diff)
      updateSelfInfo()
  })
  $('#repair').on('click', async () => {
      $('#repair').addClass('locked').prop('disabled', true)
      const { response } = await apiSend('repair', 'post', {
          guid: $('.info').attr('data-guid'),
          position: ol.proj.toLonLat(player_feature.getGeometry().getCoordinates())
      }, [$('.info')[0], 'top right']).catch(({ toast }) => apiCatch(toast, true))
      $('#repair').removeClass('locked').prop('disabled', false)
      if (!response) return

      self_data.x = response.xp.cur
      self_data.l = getLevelByExp(response.xp.cur).lv
      showExpDiff(response.xp.diff)
      updateSelfInfo()
      showInfo(response.data)
  })
  $('#draw').on('click', async () => {
      $('#draw').addClass('locked').prop('disabled', true)
      const guid = $('.info').attr('data-guid')
      const { response } = await apiQuery('draw', {
          guid,
          position: ol.proj.toLonLat(player_feature.getGeometry().getCoordinates()),
          exref: JSON.parse(localStorage.getItem('settings'))?.exref
      }, [$('.info')[0], 'top right']).catch(({ toast }) => apiCatch(toast, true))
      $('#draw').removeClass('locked').prop('disabled', false)
      if (!response) return
      if (!response.data.length) {
          const toast = createToast(i18next.t('popups.lines-none'), $('.info')[0], 'top right')
          handlePopupToasts(toast)
          return
      }
      temp_lines_source.clear()
      point_state.possible_lines = response.data
      closePopup($('.info'))
      $('.topleft-container, .bottomleft-container, .ol-attribution').addClass('hidden')
      $('.draw-slider-wrp').removeClass('hidden').attr({
          'data-guid': guid,
          'data-follow': localStorage.getItem('follow') ?? true
      })
      localStorage.setItem('follow', false)
      $('#refs-list').empty()
      response.data.forEach(e => {
          $('#refs-list').append($('<li>', { class: 'splide__slide', 'data-ref': e.r, 'data-point': e.p })
              .append($('<div>', { class: 'refs-list__title', text: e.t }))
              .append($('<div>', { class: 'refs-list__image' }).append($('<div>').css('background-image', `url(${e.i !== null ? `https://lh3.googleusercontent.com/${e.i}` : '/photos/no_image.png'})`)))
              .append($('<div>', { class: 'refs-list__info' })
                  .append($('<span>', { class: 'refs-list__distance', text: distanceToString(e.d) }))
                  .append($('<span>', { class: 'refs-list__amount', text: i18next.t('items.amount', { count: e.a }) }))
              )
          )
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
      localStorage.setItem('inventory-cache', JSON.stringify(response.i))
      const total = response.i.map(m => m.a).reduce((acc, e) => acc += e)
      $('#self-info__inv').text(total)
          .parent().css('color', total >= 3000 ? 'var(--accent)' : '')
      drawInventory()
      getRefsData($('.inventory__content')[0])
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
  $('.inventory__tab').on('click', event => {
      if ($('#inventory-delete').attr('data-del') != 0) return
      const tab = $(event.currentTarget)
      $('.inventory__tab').removeClass('active')
      tab.addClass('active')
      drawInventory()
      getRefsData($('.inventory__content')[0])
  })
  $('.inventory__content').on('scroll', e => getRefsData(e.target))

  const selected_items = []
  $('#inventory-delete').on('click', async e => {
      if (selected_items.length) { // удаляем
          $('#inventory-delete').prop('disabled', true)
          const type = $('.inventory__tab.active').attr('data-type')
          const { response } = await apiSend('inventory', 'delete', {
              selection: selected_items,
              tab: +type
          }, [$('.inventory')[0], 'bottom left']).catch(({ toast }) => apiCatch(toast))
          $('#inventory-delete').prop('disabled', false)
          if (!response) return

          let inventory = JSON.parse(localStorage.getItem('inventory-cache')) || []
          $('.inventory__item').removeClass('selected').off('click')
          $(e.target).attr('data-del', 0).text(i18next.t('buttons.select'))
          $('#inventory-cancel').remove()

          selected_items.forEach(e => {
              $(`.inventory__item[data-guid="${e}"]`).remove()
              $(`.splide__slide[data-guid="${e}"]`).remove()
          })
          attack_slider.refresh()
          if (type == 2 && response.count[type] == 0)
              $('.attack-slider-wrp').addClass('hidden')
          inventory = inventory.filter(f => !selected_items.includes(f.g))
          localStorage.setItem('inventory-cache', JSON.stringify(inventory))
          selected_items.splice(0, Infinity)

          $('.inventory__tab.active .inventory__tab-counter').text(response.count[type])
          $('#self-info__inv').text(response.count.total)
              .parent().css('color', response.count.total >= 3000 ? 'var(--accent)' : '')
      } else if ($(e.target).attr('data-del') == 0) { // выбираем
          $('.inventory__manage-amount').addClass('hidden').removeAttr('data-guid')
          $('.inventory__ma-amount').val(1).removeAttr('max')

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
  $('#inventory-delete-section').on('click', async () => {
      const selected_items = []
      $('.inventory__item').each((_, e) => selected_items.push($(e).attr('data-guid')))
      if (!selected_items.length) {
          createToast(i18next.t('inventory.clear.none'), $('.inventory')[0], 'bottom left').showToast()
          return
      }
      let proof = confirm(i18next.t('inventory.clear.confirm-1'))
      if (!proof) return
      proof = confirm(i18next.t('inventory.clear.confirm-2'))
      if (!proof) return

      $('#inventory-delete-section').prop('disabled', true)
      const type = $('.inventory__tab.active').attr('data-type')
      const { response } = await apiSend('inventory', 'delete', {
          selection: selected_items,
          tab: +type
      }, [$('.inventory')[0], 'bottom left']).catch(({ toast }) => apiCatch(toast))
      $('#inventory-delete-section').prop('disabled', false)
      if (!response) return

      let inventory = JSON.parse(localStorage.getItem('inventory-cache')) || []
      selected_items.forEach(e => {
          $(`.inventory__item[data-guid="${e}"]`).remove()
          $(`.splide__slide[data-guid="${e}"]`).remove()
      })
      attack_slider.refresh()
      if (type == 2 && response.count[type] == 0)
          $('.attack-slider-wrp').addClass('hidden')
      inventory = inventory.filter(f => !selected_items.includes(f.g))
      localStorage.setItem('inventory-cache', JSON.stringify(inventory))
      selected_items.splice(0, Infinity)

      $('.inventory__tab.active .inventory__tab-counter').text(response.count[type])
      $('#self-info__inv').text(response.count.total)
          .parent().css('color', response.count.total >= 3000 ? 'var(--accent)' : '')
  })
  $('.inventory__ma-counter button').on('click', e => {
      const input = $('.inventory__ma-amount')
      const max = input.attr('max')
      let new_val = input.val()
      switch ($(e.target).attr('data-type')) {
          case 'minus':
              new_val--
              if (new_val < 1) new_val = 1
              break
          case 'plus':
              new_val++
              if (new_val > max) new_val = max
              break
      }
      input.val(new_val)
  })
  $('.inventory__ma-cancel').on('click', () => {
      $('.inventory__manage-amount').addClass('hidden').removeAttr('data-guid')
      $('.inventory__ma-amount').val(1).removeAttr('max')
  })
  $('.inventory__ma-delete').on('click', e => {
      deleteInventoryItem($(e.target).parents().eq(1))
  })
  $('#i-ref').on('click', () => {
      const cache = JSON.parse(localStorage.getItem('inventory-cache') || '[]')
          .find(f => f.t == 3 && f.l == $('.info').attr('data-guid'))
      if (!cache) return
      const el = $('.inventory__manage-amount').clone()
      el.removeClass('hidden').attr({
          'data-guid': cache.g,
          'data-type': cache.t
      })
      $('.info').append(el)
      const input = el.find('.inventory__ma-amount')
      el.find('.inventory__ma-item').text('Сноски')
      el.find('.inventory__ma-max').text(cache.a)
      input.attr('max', cache.a).val(1)
      el.find('.inventory__ma-counter button').on('click', e => {
          const max = input.attr('max')
          let new_val = input.val()
          switch ($(e.target).attr('data-type')) {
              case 'minus':
                  new_val--
                  if (new_val < 1) new_val = 1
                  break
              case 'plus':
                  new_val++
                  if (new_val > max) new_val = max
                  break
          }
          input.val(new_val)
      })
      el.find('.inventory__ma-cancel').on('click', () => el.remove())
      el.find('.inventory__ma-delete').on('click', async e => {
          if (await deleteInventoryItem($(e.target).parents().eq(1))) el.remove()
      })
  })

  ;(function initScore() {
      const cache = JSON.parse(localStorage.getItem('score')) || { r: 0, g: 0, b: 0 }
      makeScore(cache)
  })();
  $('#score').on('click', async () => {
      if (!$('.score').hasClass('hidden')) return $('.score').addClass('hidden')
      $('#score').prop('disabled', true)
      const { response } = await apiQuery('score').catch(({ toast }) => apiCatch(toast))
      $('#score').prop('disabled', false)
      if (!response) return

      $('.score').removeClass('hidden')
      makeScore(response.score)
  })
  ;(function initLBSelect() {
      $('.leaderboard__term').html(i18next.t('leaderboard.sort-by', {
          element: '<select id="leaderboard__term-select"></select>'
      }))
      const stats = [
          'xp', 'captures', 'discoveries', 'neutralizes', 'cores_deployed',
          'cores_destroyed', 'owned', 'unique_visits', 'unique_captures',
          'lines', 'lines_destroyed'
      ]
      const container = $('#leaderboard__term-select')
      stats.forEach(e => {
          container.append($('<option>', { value: e, text: i18next.t(`leaderboard.sort-terms.${e}`) }))
      })
      container.on('change', drawLeaderboard)
  })();
  $('#leaderboard').on('click', () => {
      if (!$('.leaderboard').hasClass('hidden')) return $('.leaderboard').addClass('hidden')
      drawLeaderboard()
  })
  $('.outer-link').on('click', confirmOuter)

  $('#attack-menu').on('click', async () => {
      const inventory = JSON.parse(localStorage.getItem('inventory-cache'))
      const catalysers = inventory.filter(f => f.t == 2).sort((a, b) => a.l - b.l)
      if (!catalysers.length) {
          const toast = createToast(i18next.t('popups.no-catalysers'))
          toast.showToast()
          return
      }
      $('.attack-slider-wrp').toggleClass('hidden')
      if ($('.attack-slider-wrp').hasClass('hidden')) return
      $('#catalysers-list').empty()
      catalysers.forEach(e => {
          $('#catalysers-list').append($('<li>', { class: 'splide__slide', 'data-guid': e.g })
              .append($('<span>', { class: 'catalysers-list__level', text: i18next.t('items.catalyser-short', { level: romanize(e.l) }) }).css('color', `var(--level-${e.l})`))
              .append($('<span>', { class: 'catalysers-list__amount', text: i18next.t('items.amount', { count: e.a }) }))
          )
      })
      attack_slider.refresh()
  })
  $('#attack-slider-fire').on('click', async () => {
      $('#attack-slider-fire').prop('disabled', true)
      const guid = $('#catalysers-list li').eq(attack_slider.index).attr('data-guid')
      const inventory = JSON.parse(localStorage.getItem('inventory-cache')) || []
      const { response } = await apiSend('attack2', 'post', {
          position: ol.proj.toLonLat(player_feature.getGeometry().getCoordinates()),
          guid
      }).catch(({ toast }) => apiCatch(toast))
      $('#attack-slider-fire').prop('disabled', false)
      if (!response) return

      const index = inventory.findIndex(f => f.g == guid)
      const item = inventory[index]
      // вешаем стили на точки
      response.c.forEach(e => {
          const feature = points_source.getFeatureById(e.guid)
          if (!feature) return
          const pos = feature.getGeometry().getCoordinates()
          const prop = feature.getProperties()
          const diff = Math.round((e.energy - prop.energy) * 100)
          feature.getStyle().push(FeatureStyles.TEXT(diff <= 0 ? `${diff}%` : i18next.t('items.types.core') + '!'))

          if (e.energy <= 0) feature.getStyle()[0] = FeatureStyles.NEUTRAL(pos)
          else feature.getStyle()[0] = FeatureStyles.CAPTURED(pos, prop.team, e.energy)
          feature.setProperties({
              team: e.energy <= 0 ? 0 : prop.team,
              energy: e.energy
          })
          feature.changed()
      })
      response.l.forEach(e => {
          const feature = lines_source.getFeatureById(e.guid)
          if (!feature) return
          lines_source.removeFeature(feature)
      })
      timers.damage_texts.push(setTimeout(() => {
          response.c.forEach(e => {
              const feature = points_source.getFeatureById(e.guid)
              timers.damage_texts.shift()
              let opacity = 1
              const timer = setInterval(() => {
                  opacity -= .1
                  const font = feature?.getStyle()[1]?.getText()
                  if (!font) return clearInterval(timer)
                  font.setFill(new ol.style.Fill({ color: `rgba(0, 0, 0, ${opacity})` }))
                  font.setStroke(new ol.style.Stroke({ color: `rgba(255, 255, 255, ${opacity})`, width: 3 }))
                  if (opacity <= 0) {
                      clearInterval(timer)
                      feature.getStyle().splice(1, 1)
                  }
                  feature.changed()
              }, 50)
          })
      }, 2500))

      // обновляем инвентарь
      if (response.ca != null) {
          inventory.splice(index, 1)
          $(`#catalysers-list [data-guid="${guid}"]`).remove()
      } else {
          item.a--
          $(`#catalysers-list [data-guid="${guid}"] .catalysers-list__amount`).text(i18next.t('items.amount', { count: item.a }))
      }
      attack_slider.refresh()
      if (inventory.filter(f => f.t == 2).length == 0)
          $('.attack-slider-wrp').addClass('hidden')
      localStorage.setItem('inventory-cache', JSON.stringify(inventory))

      // показываем анимации и обновляем данные
      const total = inventory.map(m => m.a).reduce((acc, e) => acc += e)
      $('#self-info__inv').text(total)
          .parent().css('color', total >= 3000 ? 'var(--accent)' : '')
      explodeRange(item.l)
      self_data.x = response.xp.cur
      self_data.l = getLevelByExp(response.xp.cur).lv
      showExpDiff(response.xp.diff)
      updateSelfInfo()
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
          stroke: new ol.style.Stroke({ color: TeamColors[self_data.t].stroke, width: 2 })
      }))
      lines_source.addFeature(feature)
      if (point_state.lines_count?.o) point_state.lines_count.o++

      $(`#refs-list .splide__slide.is-active`).remove()
      draw_slider.refresh()
      if (!$('#refs-list li').length || point_state.lines_count?.o >= 20) closeDrawSlider()

      const inventory = JSON.parse(localStorage.getItem('inventory-cache')) || []
      if (response.ref.a <= 0) {
          const index = inventory.findIndex(f => f.g == response.ref.g)
          inventory.splice(index, 1)
      } else {
          const item = inventory.find(f => f.g == response.ref.g)
          item.a--
      }
      localStorage.setItem('inventory-cache', JSON.stringify(inventory))
      const total = inventory.reduce((acc, e) => acc += e.a, 0)
      $('#self-info__inv').text(total)
          .parent().css('color', total >= 3000 ? 'var(--accent)' : '')

      self_data.x = response.xp.cur
      self_data.l = getLevelByExp(response.xp.cur).lv
      showExpDiff(response.xp.diff)
      updateSelfInfo()
  })
  $('#attack-slider-close').on('click', () => {
      $('.attack-slider-wrp').addClass('hidden')
  })
  $('#draw-slider-close').on('click', closeDrawSlider)

  $('#toggle-follow').attr('data-active', localStorage.getItem('follow') != 'false')
  $('#toggle-follow').on('click', e => {
      const active = localStorage.getItem('follow') != 'false'
      if (!active) map.getView().setCenter(player_feature.getGeometry().getCoordinates())
      localStorage.setItem('follow', !active)
      $(e.target).attr('data-active', !active)
  })

  $('#layers').on('click', () => {
      $('.layers-config').removeClass('hidden')
      const data = JSON.parse(localStorage.getItem('layers')) || [1, 1]
      data.forEach((e, n) => $(`.layers-config [data-layer="${n}"]`).prop('checked', e))
      updateSettings()
  })
  $('.layers-config [name="baselayer"]').on('change', e => {
      const value = $(e.target).val()
      changeSettings('base', value)
      setBaselayer()
  })
  $('#layers-config__save').on('click', async e => {
      const button = $(e.target)
      const data = []
      $('.layers-config [name="layer"]').each((_, e) => data[$(e).attr('data-layer')] = +$(e).prop('checked'))
      localStorage.setItem('layers', JSON.stringify(data))
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
  $('#settings').on('click', () => {
      $('.settings').removeClass('hidden')
      updateSettings()
  })
  $('#settings').one('click', () => {
      if (self_data.tg) {
          $('#telegram-login-sbg_game_bot')
          .after($('<span>', { text: i18next.t('telegram.linked') }).css('color', 'var(--progress)'))
          .remove()
          $('.telegram-auth-button').remove()
      } else {
          const timer = setInterval(() => {
              if (!$('#telegram-login-sbg_game_bot').length) return
              $('#telegram-login-sbg_game_bot').css({ width: '38px', 'border-radius': '18px' })
              clearInterval(timer)
          }, 100)
      }
      $('#version').text(`v${VERSION}`)
  })
  $('[data-setting="lang"]').on('change', e => {
      changeSettings('lang', $(e.target).val())
      location.reload()
  })
  $('#lang-cache').on('click', async () => {
      for (const key in localStorage) {
          if (!key.match(/^i18next_/)) continue
          const entry = JSON.parse(localStorage.getItem(key))
          entry.i18nStamp = 0
          localStorage.setItem(key, JSON.stringify(entry))
      }
      location.reload()
  })
  $('[data-setting="theme"]').on('change', e => {
      const value = $(e.target).val()
      $('html').attr('data-theme', value)
      $('meta[name="color-scheme"]').attr('content', value == 'auto' ? 'light dark' : value)
      is_dark = value == 'auto' ? matchMedia('(prefers-color-scheme: dark)').matches : value == 'dark'
      requestEntities()
      changeSettings('theme', value)
      setBaselayer()
  })
  $('[data-setting="imghid"]').on('change', e => {
      const state = $(e.target).prop('checked')
      if (state) $('.i-image-box').addClass('imghid')
      else $('.i-image-box').removeClass('imghid')
      changeSettings('imghid', state)
  })
  $('[data-setting="dsvhid"], [data-setting="arabic"], [data-setting="exref"]').on('change', e => {
      const state = $(e.target).prop('checked')
      changeSettings($(e.target).attr('data-setting'), state)
  })
  $('[data-setting="plrhid"]').on('change', e => {
      const state = !$(e.target).prop('checked')
      changeSettings($(e.target).attr('data-setting'), state)
      if (state) $('.ol-layer__player').addClass('hidden')
      else $('.ol-layer__player').removeClass('hidden')
  })
  $('[data-setting="selfpos"]').on('change', e => {
      const state = $(e.target).prop('checked')
      if (state) $('#self-info__coord').parent().removeClass('hidden')
      else $('#self-info__coord').parent().addClass('hidden')
      changeSettings('selfpos', state)
  })
  $('#settings-credits').on('click', async e => {
      if ($('.credits').length) return $('.credits').removeClass('hidden')
      $(e.target).prop('disabled', true)
      const request = await fetch('/fragments/credits.html', {
          method: 'get',
          headers: {
              authorization: `Bearer ${localStorage.getItem('auth')}`,
              'accept-language': LANG
          }
      })
      const response = await request.text()
      $(e.target).prop('disabled', false)
      const el = $(response)
      el.find('.profile-link').on('click', openProfile)
      el.find('.outer-link').on('click', confirmOuter)
      el.find('.popup-close').on('click', e => closePopup($(e.target).parent()))
      $('.settings').after(el)
  })

  $('#logout').on('click', async () => {
      const proof = confirm(i18next.t('popups.logout'))
      if (!proof) return
      clearStorage()
      location.href = '/login'
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
              player_styles[0].getImage().setRotation((-angle * Math.PI / 180) + map.getView().getRotation())
              player_feature.changed()
          })
          sensor.start()
      }).catch(() => {
          const toast = createToast(i18next.t('popups.compass.request'))
          toast.options.className = 'error-toast'
          toast.showToast()
      })
  })();
  // DEV SPOOFING
  $('body').on('keydown', event => {
      const allowed = ['testuser', 'Nerotu']
      if (!allowed.includes(self_data.n)) return
      const pos_raw = ol.proj.toLonLat(player_feature.getGeometry().getCoordinates())
      const pos = { latitude: pos_raw[1], longitude: pos_raw[0] }
      const accuracy = event.altKey ? 4 : 1
      if (event.code == 'ArrowDown') { pos.latitude -= .00005 / accuracy; movePlayer(pos) }
      if (event.code == 'ArrowUp') { pos.latitude += .00005 / accuracy; movePlayer(pos) }
      if (event.code == 'ArrowLeft') { pos.longitude -= .0001 / accuracy; movePlayer(pos) }
      if (event.code == 'ArrowRight') { pos.longitude += .0001 / accuracy; movePlayer(pos) }
  })

  async function showInfo(data) {
      let json
      if (typeof data === 'string') { // дан guid
          const { response } = await apiQuery('point', { guid: data }).catch(({ toast }) => apiCatch(toast))
          if (!response) return
          json = response.data
      } else if (typeof data === 'object') json = data // даны данные
      else return // ничего не дано
      // вписываемся в кеш (нужно для карусельки с деплоем)
      point_state.cores = json.co
      point_state.position = json.c
      point_state.team = json.te

      const feature = points_source.getFeatureById(json.g)
      const team_color = `var(--team-${json.te})`
      const percent_format = new Intl.NumberFormat(LANG, { maximumFractionDigits: 1 })

      let eng = 0
      let eng_total = 0
      json.co.forEach(c => { eng += c.e; eng_total += Cores[c.l].eng })

      if (feature) {
          if (json.te)
              feature.getStyle()[0] = FeatureStyles.CAPTURED(ol.proj.fromLonLat(json.c), json.te, eng / eng_total)
          else feature.getStyle()[0] = FeatureStyles.NEUTRAL(ol.proj.fromLonLat(json.c))
          feature.changed()
      }

      const inventory = JSON.parse(localStorage.getItem('inventory-cache')) || []
      const ref = inventory.find(f => f.t === 3 && f.l === json.g)

      $('.info').removeClass('hidden').attr('data-guid', json.g)
      $('#i-title').text(json.t)
      $('#i-image').css('background-image', `url('${json.i !== null ? `https://lh3.googleusercontent.com/${json.i}` : '/photos/no_image.png'}')`)
      $('#i-level').text(i18next.t('info.level', { count: json.l })).css('color', `var(--level-${json.l})`)
      $('#i-ref').text(i18next.t('info.refs', { count: ref?.a || 0 })).attr('data-has', ref ? 1 : 0)
      $('#i-stat__distance').text(distanceToString(getDistance(json.c)))
      $('#i-stat__owner').text(json.o || i18next.t('info.na')).css('color', team_color).attr('data-name', json.o)
      $('#i-stat__energy').text(`${percent_format.format(eng / eng_total * 100 || 0)}% @ ${json.co.length}`)
      if (json.li) {
          $('#i-stat__line-in').text(json.li.i)
          $('#i-stat__line-out').text(json.li.o)
          point_state.lines_count = json.li
      }
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
              return
          }
          $('.i-stat__core').removeClass('selected')
          target.addClass('selected')
          $('#deploy').attr('data-state', 'upgrade').text(i18next.t('buttons.upgrade'))
          manageDeploy()
      })
      manageControls(json)

      $('#cores-list').empty()
      inventory.filter(f => f.t == 1).sort((a, b) => a.l - b.l).forEach(e => {
          $('#cores-list').append($('<li>', { class: 'splide__slide', 'data-guid': e.g })
              .append($('<span>', { class: 'cores-list__level', text: i18next.t('items.core-short', { level: romanize(e.l) }) }).css('color', `var(--level-${e.l})`))
              .append($('<span>', { class: 'cores-list__amount', text: i18next.t('items.amount', { count: e.a }) }))
          )
      })
      deploy_slider.refresh()
      manageDeploy()

      const exists = showCooldownTimer(json.g)
      if (!exists) $('#discover').removeAttr('data-time').removeClass('locked')

      clearInterval(timers.info_controls)
      timers.info_controls = setInterval(() => {
          manageControls(json)
          $('#i-stat__distance').text(distanceToString(getDistance(json.c)))
      }, 100)
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
      $('#self-info__coord').text([coords.latitude, coords.longitude].map(m => m.toFixed(5)).join(', '))
      const pos = ol.proj.fromLonLat([coords.longitude, coords.latitude])
      player_feature.getGeometry().setCoordinates(pos)
      player_styles[1].getGeometry().setCenter(pos)
      player_styles[2].getGeometry().setCenter(pos)
      manageDeploy()
      // if (!start_follow && !$('.info').hasClass('hidden')) return
      if (localStorage.getItem('follow') != 'false' || !start_follow) map.getView().setCenter(pos)
  }
  function manageControls(source) {
      const inventory = JSON.parse(localStorage.getItem('inventory-cache')) || []
      const in_range = isInRange(source.c)
      $('#discover:not(.locked)').prop('disabled', !in_range)
      $('#repair:not(.locked)').prop('disabled', !((in_range || (!in_range && inventory.find(f => f.l === source.g))) && source.te == self_data.t && source.co.some(s => s.e < Cores[s.l].eng)))
      const inbound = source.li?.i || point_state.lines_count?.i || 0
      const outbound = source.li?.o || point_state.lines_count?.o || 0
      $('#draw:not(.locked)').prop('disabled', !(in_range && source.te == self_data.t && source.co.length >= 6 && inbound < 1100 && outbound < 20))
  }
  function manageDeploy() {
      if ($('#info').hasClass('hidden')) return
      const inventory = JSON.parse(localStorage.getItem('inventory-cache')) || []
      const core = inventory.find(f => f.g == $('#cores-list li').eq(deploy_slider.index).attr('data-guid'))
      const limit = Cores[core?.l]?.lim || 0
      const state = $('#deploy').attr('data-state')
      const errors = ['', i18next.t('popups.no-cores'),
          i18next.t('popups.point.enemy'),
          i18next.t('popups.point.range'),
          i18next.t('popups.point.full-deploy'),
          i18next.t('popups.highlevel-core'),
          i18next.t('popups.not-upgrade'),
          i18next.t('popups.cores-limit', { count: limit })
      ]
      let error = 0
      if (inventory.filter(f => f.t == 1).length == 0) error = 1
      else if (point_state.team != 0 && point_state.team != self_data.t) error = 2
      else if (point_state.position.length && !isInRange(point_state.position)) error = 3
      else if (point_state.cores.length == 6 && state == 'deploy') error = 4
      else if (core.l > self_data.l) error = 5
      else if (point_state.cores.find(f => f.g == $('.i-stat__core.selected').attr('data-guid'))?.l >= core.l) error = 6
      else if (point_state.cores.filter(f => f.o == self_data.n && f.l == core.l).length >= limit) error = 7

      if (error == 1) $('#deploy-slider').addClass('hidden')
      else if ($('#deploy-slider').hasClass('hidden')) $('#deploy-slider').removeClass('hidden')

      $('#deploy:not(.locked)').prop('disabled', Boolean(error))
      $('.deploy-slider-error').text(errors[error])
      .css('color', error ? '#F00' : '#0000')
  }
  function showCooldownTimer(guid) {
      const cooldowns = JSON.parse(localStorage.getItem('cooldowns')) || {}
      clearInterval(timers.info_cooldown)
      if (typeof cooldowns[guid] === 'undefined') return false
      update()
      timers.info_cooldown = setInterval(update, 1000)
      return true

      function update() {
          if (typeof cooldowns[guid] === 'undefined') return clearInterval(timers.info_cooldown)
          const diff = cooldowns[guid].t - Date.now()
          if (diff > 0) {
              $('#discover').attr('data-time', timeToString(Math.round(diff / 1000)))
              .addClass('locked').prop('disabled', true)
              if (cooldowns[guid].c > 0) $('#discover').attr('data-remain', cooldowns[guid].c)
              else $('#discover').removeAttr('data-remain')
          } else {
              $('#discover').removeAttr('data-time')
              .removeAttr('data-remain')
              .removeClass('locked')
              delete cooldowns[guid]
              localStorage.setItem('cooldowns', JSON.stringify(cooldowns))
              clearInterval(timers.info_cooldown)
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
      pos[1] -= .0005
      view.setCenter(ol.proj.fromLonLat(pos))
  }
  function closeDrawSlider() {
      $('.draw-slider-wrp').addClass('hidden')
      $('.topleft-container, .bottomleft-container, .ol-attribution').removeClass('hidden')
      clearInterval(timers.info_controls)
      temp_lines_source.clear()
      localStorage.setItem('follow', $('.draw-slider-wrp').attr('data-follow'))
      view.setCenter(player_feature.getGeometry().getCoordinates())
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
  function drawInventory() {
      const type = $('.inventory__tab.active').attr('data-type')
      const inventory = JSON.parse(localStorage.getItem('inventory-cache'))
      $('.inventory__content').empty().attr('data-type', type)
      inventory.filter(f => f.t == type).forEach(createInventoryItem)
      $('.inventory__tab').each((_, tab) => {
          const category = $(tab).attr('data-type')
          let total = 0
          inventory.filter(f => f.t == category).forEach(e => total += e.a)
          $(tab).find('.inventory__tab-counter').text(total)
      })
  }
  function createInventoryItem(data) {
      function manageItem() {
          if ($('#inventory-delete').attr('data-del') != 0) return
          const item = (JSON.parse(localStorage.getItem('inventory-cache')) || []).find(f => f.g == data.g)
          if (!item) return
          const title_alt = title.clone().removeAttr('class').replaceWith($('<div>'))
          const text = title_alt.text()
          if (data.t == 3) title_alt.text(text.slice(text.indexOf(')') + 2)).css('font-size', '.8em')
          $('.inventory__manage-amount').removeClass('hidden').attr({
              'data-guid': data.g,
              'data-type': data.t
          })
          $('.inventory__ma-item').empty().append(title_alt)
          $('.inventory__ma-amount').attr('max', item.a)
          $('.inventory__ma-max').text(item.a)
      }
      const container = $('<div>', { class: 'inventory__item' })
      const title = $('<span>', { class: 'inventory__item-title', text: makeItemTitle(data) })
      const descr = $('<span>', { class: 'inventory__item-descr', text: i18next.t('items.amount', { count: data.a }) })
      container.attr('data-guid', data.g)
      if (data.t == 3) {
          const controls = $('<div>', { class: 'inventory__item-controls' })
              // .append($('<button>', { class: 'inventory__ic-repair', text: 'R' }).prop('disabled', true))
              .append($('<button>', { class: 'inventory__ic-manage', text: i18next.t('buttons.references.manage') }).on('click', manageItem))
              .append($('<button>', { class: 'inventory__ic-view', text: i18next.t('buttons.references.view') }).prop('disabled', true))
          descr.css('font-style', 'italic').text(i18next.t('inventory.reference.default'))
          container.attr('data-ref', data.l)
              .append($('<div>', { class: 'inventory__item-left' }).append(title).append(descr))
              .append(controls)
      } else {
          container.css('text-align', 'center').on('click', manageItem)
          title.css('color', `var(--level-${data.l})`)
          descr.css('font-size', '1em')
          container.append(title).append(descr)
      }
      $('.inventory__content').append(container)
  }
  function getRefsData(target) {
      const { scrollTop, clientHeight } = target
      $('.inventory__item').each(async (_, e) => {
          if (!$(e).attr('data-ref')) return
          if (!(e.offsetTop <= scrollTop + clientHeight && e.offsetTop >= scrollTop && !$(e).hasClass('loaded') && !$(e).hasClass('loading'))) return
          const guid = $(e).attr('data-ref')
          const cache = JSON.parse(localStorage.getItem('refs-cache')) || {}
          const pos = (JSON.parse(localStorage.getItem('inventory-cache')) || []).find(f => f.l == guid && f.t == 3).c
          let data
          $(e).addClass('loading')
          if (typeof cache[guid] === 'undefined' || cache[guid]?.t < Date.now()) {
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
              data = response.data
              const cache = JSON.parse(localStorage.getItem('refs-cache')) || {}
              cache[guid] = {
                  te: data.te, co: data.co,
                  e: data.e, l: data.l,
                  o: data.o,
                  t: Date.now() + 5 * 60e3
              }
              localStorage.setItem('refs-cache', JSON.stringify(cache))
          } else data = cache[guid]

          $(e).find('.inventory__ic-view').prop('disabled', false).on('click', () => {
              if ($('#inventory-delete').attr('data-del') != 0) return
              $('#toggle-follow').attr('data-active', false)
              localStorage.setItem('follow', false)
              map.getView().setCenter(ol.proj.fromLonLat(pos))
              $('.inventory').addClass('hidden')
          })
          $(e).find('.inventory__item-title').css('color', `var(--team-${data.te})`)
          const target = $(e).find('.inventory__item-descr')
          const entry = jquerypassargs(
              $('<div>', { class: 'inventory__item-descr' }),
              i18next.t('inventory.reference.info', { owner: data.o ? i18next.t('inventory.reference.owner') : i18next.t('inventory.reference.owner-none') }),
              $('<span>').text(i18next.t('inventory.reference.level', { count: data.l })).css('color', `var(--level-${data.l})`),
              $('<span>', { class: 'profile-link' }).text(data.o).css('color', `var(--team-${data.te})`).attr('data-name', data.o).on('click', openProfile),
              new Intl.NumberFormat(LANG, { maximumFractionDigits: 1 }).format(data.e),
              data.co,
              distanceToString(getDistance(pos))
          )
          target.replaceWith(entry)
          $(e).removeClass('loading').addClass('loaded')
      })
  }
  async function deleteInventoryItem(parent) {
      const valid = parent.find('.inventory__ma-amount')[0].reportValidity()
      console.log(valid, parent.find('.inventory__ma-amount')[0])
      if (!valid) return false
      parent.find('.inventory__ma-delete').prop('disabled', true)
      const guid = parent.attr('data-guid')
      const type = parent.attr('data-type')
      const { response } = await apiSend('inventory', 'delete', {
          selection: { [guid]: +parent.find('.inventory__ma-amount').val() },
          tab: +type
      }, [$('.inventory')[0], 'bottom left']).catch(({ toast }) => apiCatch(toast))
      parent.find('.inventory__ma-delete').prop('disabled', false)
      if (!response) return false

      const inventory = JSON.parse(localStorage.getItem('inventory-cache')) || []
      parent.addClass('hidden').removeAttr('data-guid')
      parent.find('.inventory__ma-amount').val(1).removeAttr('max')

      const element = $(`.inventory__item[data-guid="${guid}"]`)
      const slide = $(`.splide__slide[data-guid="${guid}"]`)
      if (response.count.item > 0) {
          if (type == 3) {
              const title = element.find('.inventory__item-title')
              title.text(`(x${response.count.item}) ${title.text().slice(title.text().indexOf(')') + 2)}`)
          } else element.find('.inventory__item-descr').text(`x${response.count.item}`)
          if (type == 2) slide.find('.catalysers-list__amount').text(`x${response.count.item}`)
          inventory.find(f => f.g == guid).a = +response.count.item
      } else {
          element.remove()
          if (type == 2) slide.remove()
          inventory.splice(inventory.findIndex(f => f.g == guid), 1)
      }
      if (type == 2) {
          attack_slider.refresh()
          if (response.count[type] == 0) $('.attack-slider-wrp').addClass('hidden')
      }
      localStorage.setItem('inventory-cache', JSON.stringify(inventory))

      $(`.inventory__tab[data-type="${type}"] .inventory__tab-counter`).text(response.count[type])
      $('#self-info__inv').text(response.count.total)
          .parent().css('color', response.count.total >= 3000 ? 'var(--accent)' : '')
      if (type == 3) $('#i-ref').text(i18next.t('info.refs', { count: response.count.item })).attr('data-has', +(response.count.item > 0))
      return true
  }

  async function openProfile(data) {
      const struct = [
          ['captures', 'neutralizes', 'cores_deployed', 'cores_destroyed', 'owned_points', 'guard_point'],
          ['lines', 'max_line', 'guard_line', 'lines_destroyed'],
          ['discoveries', 'unique_visits', 'unique_captures']
      ]
      let guid, name
      if (data instanceof $.Event) {
          const target = $(data.currentTarget)
          guid = target.attr('data-guid')
          name = target.attr('data-name')
      } else if (data.match(/^[a-z\d]{12}\.28d$/)) guid = data
      else if (data.match(/^[a-z\d]+$/i)) name = data
      else return
      if (name == 'n/a') return
      let query = {}
      if (name) query = { name }
      else if (guid) query = { guid }

      const { response } = await apiQuery('profile', query).catch(({ toast }) => apiCatch(toast))
      if (!response) return

      const level = Levels[response.data.level - 1]
      const team_color = `var(--team-${response.data.team})`
      const formatter = new Intl.NumberFormat(LANG)
      const unit_xp = i18next.t('units.pts-xp')
      $('.profile').removeClass('hidden')
      $('#pr-name').text(response.data.name)
      $('#pr-name, #pr-xp-current, .pr-xp-level').css('color', team_color)
      $('#pr-xp-current').text(level.target == Infinity ? `${formatter.format(response.data.xp)} ${unit_xp}` : `${formatter.format(response.data.xp - level.total)} / ${formatter.format(level.target)} ${unit_xp}`)
      $('#pr-xp-level-num').text(response.data.level)
      $('.pr-xp-progress-bar').css({
          width: level.target == Infinity ? '100%' : (response.data.xp - level.total) / level.target * 100 + '%',
          background: team_color
      })
      $('.pr-stats__section:not(.persist)').remove()
      $('.pr-stats').animate({ scrollTop: 0 }, 500)
      $('.pr-stat__total-xp .pr-stat-val').text(`${formatter.format(response.data.xp)} ${unit_xp}`)
      $('.pr-stat__age .pr-stat-val').text(new Date(response.data.created_at).toLocaleDateString(LANG, { day: 'numeric', month: 'long', year: 'numeric' }))
      struct.forEach((section, n) => {
          const container = $('<div>', { class: 'pr-stats__section' })
          container.append($('<h4>', { class: 'pr-stats__section-header', text: i18next.t(`profile.sections.${n}`) }))
          section.forEach(stat => {
              container.append($('<div>', { class: 'pr-stat' })
                  .append($('<span>', { class: 'pr-stat-title', text: i18next.t(`profile.stats.${stat}`) }))
                  .append($('<span>', { class: 'pr-stat-val', text: formatStatValue(stat, response.data[stat]) }))
              )
          })
          $('.pr-stats').append(container)
      })
      $('#pr-button__copy').off('click').on('click', () => {
          const data = {
              date: new Date().toISOString(),
              name: response.data.name,
              team: ['GRAY', 'RED', 'GREEN', 'BLUE'][response.data.team],
              xp: response.data.xp
          }
          struct.forEach(section => { for (const stat in section.stats) data[stat] = response.data[stat] })
          navigator.clipboard.writeText(JSON.stringify(data)).then(() => {
              createToast(i18next.t('popups.profile.copy-data'), $('.profile')[0], 'top right').showToast()
          })
      })
      $('#pr-button__share').off('click').on('click', () => {
          const link = `https://3d.sytes.net/?player=${response.data.name}`
          if ('share' in navigator) {
              navigator.share({
                  title: i18next.t('popups.profile.share-title', { name: response.data.name }),
                  url: link
              }).then(...args => {
                  console.log(args)
              })
          } else {
              navigator.clipboard.writeText(link).then(() => {
                  createToast(i18next.t('popups.profile.copy-url'), $('.profile')[0], 'top right').showToast()
              })
          }
      })
  }
  function formatStatValue(key, value) {
      const formatter = new Intl.NumberFormat(LANG)
      if (key.match(/^guard_/)) return i18next.t('units.n-days', { count: value })
      else if (key == 'max_line') return distanceToString(value)
      else return formatter.format(value)
  }
  async function drawLeaderboard() {
      const units = [
          [/^xp$/, 'pts-xp'],
          [/^(captures|neutralizes|owned)$/, 'pts'],
          [/^unique_/, 'pts'],
          [/^discoveries$/, 'dscv'],
          [/^cores_/, 'crs'],
          [/lines?/, 'lns']
      ]

      $('#leaderboard').prop('disabled', true)
      const stat = $('#leaderboard__term-select').val()
      const unit = units.find(f => f[0].test(stat))[1]
      const formatter = new Intl.NumberFormat(LANG)
      const { response } = await apiQuery('leaderboard', { stat }).catch(({ toast }) => apiCatch(toast))
      $('#leaderboard').prop('disabled', false)
      if (!response) return

      $('.leaderboard').removeClass('hidden')
      $('.leaderboard__place').empty().append($('<span>', { html: i18next.t('leaderboard.place', {
          pos: '<span id="leaderboard__place-pos"></span>',
          active: '<span id="leaderboard__place-active"></span>',
          total: '<span id="leaderboard__place-total"></span>'
      }) }))
      $('.leaderboard__list').animate({ scrollTop: 0 }, 500)
      $('.leaderboard__list').empty()
      $('#leaderboard__place-pos').text(response.s ? formatter.format(response.s) : '—')
      $('#leaderboard__place-active').text(formatter.format(response.p.a))
      $('#leaderboard__place-total').text(formatter.format(response.p.t))
      response.d.forEach(e => {
          const entry = jquerypassargs(
              $('<li>'),
              '$1$ — $2$; $3$ $4$',
              $('<span>', { class: 'profile-link' }).text(e.n).css('color', `var(--team-${e.t})`).attr('data-name', e.n).on('click', openProfile),
              $('<span>').text(i18next.t('leaderboard.level', { count: e.l })).css('color', `var(--level-${e.l})`),
              formatter.format(e.s),
              i18next.t(`units.${unit}`)
          )
          if (e.n == self_data.n) entry.addClass('own')
          $('.leaderboard__list').append(entry)
      })
  }

  async function requestEntities() {
      const { response } = await apiQuery('inview', {
          sw: ol.proj.toLonLat(map.getView().calculateExtent(map.getSize()).slice(0, 2)).join(','),
          ne: ol.proj.toLonLat(map.getView().calculateExtent(map.getSize()).slice(2, 4)).join(','),
          z: map.getView().getZoom(),
          layers: (localStorage.getItem('layers') || '[1,1]').slice(1, -1)
      }).catch(({ toast }) => apiCatch(toast))
      if (!response) return
      drawEntities(response)
  }
  function drawEntities(source) {
      points_source.clear(true)
      lines_source.clear(true)
      source.data.points.forEach(e => {
          const mpos = ol.proj.fromLonLat(e.c)
          const feature = new ol.Feature({
              geometry: new ol.geom.Point(mpos)
          })
          feature.setId(e.g)
          feature.setStyle([e.t ? FeatureStyles.CAPTURED(mpos, e.t, e.e) : FeatureStyles.NEUTRAL(mpos)])
          feature.setProperties({
              team: e.t,
              energy: e.e
          })
          points_source.addFeature(feature)
      })
      source.data.lines.forEach(e => {
          const arc = turf.greatCircle(...e.c, { npoints: 50 })
          arc.geometry.coordinates = arc.geometry.coordinates.map(m => ol.proj.fromLonLat(m))
          const format = new ol.format.GeoJSON()
          const feature = format.readFeature(arc)
          feature.setId(e.g)
          feature.setProperties({ team: e.t })
          feature.setStyle(new ol.style.Style({
              stroke: new ol.style.Stroke({ color: `${TeamColors[e.t].stroke}9`, width: 2 })
          }))
          lines_source.addFeature(feature)
      })
  }

  function explodeRange(level) {
      return new Promise(res => {
          clearInterval(timers.attack_ring)
          const prop = Catalysers[level]
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
      return getDistance(coords) <= 45
  }

  function getDistance(to, from = player_feature.getGeometry().getCoordinates()) {
      const line = new ol.geom.LineString([from, ol.proj.fromLonLat(to)])
      return ol.sphere.getLength(line)
  }
  function distanceToString(distance) {
      if (distance < 0) return i18next.t('units.cm', { count: distance * 100 })
      else if (distance < 1000) return i18next.t('units.m', { count: distance })
      else return i18next.t('units.km', { count: distance / 1000 })
  }
  function timeToString(seconds) {
      if (seconds / 3600 >= 1) return i18next.t('units.hr', { count: Math.floor(seconds / 3600) })
      else if (seconds / 60 >= 1) return i18next.t('units.min', { count: Math.floor(seconds / 60) })
      else return i18next.t('units.sec', { count: seconds })
  }

  function clearStorage() {
      const persist = ['follow', 'score', 'layers', 'settings', 'uniques', /^i18next_/]
      for (const key in localStorage) {
          if (persist.find(f => f instanceof RegExp ? f.test(key) : f == key)) continue
          localStorage.removeItem(key)
      }
  }
  function makeItemTitle(item) {
      if (item.t == 3) return `(x${item.a}) ${item.ti}`
      else return `${ItemTypes[item.t]}-${romanize(item.l)}`
  }
  function makeDropItemTitle(item) {
      if (item.t == 3) return ItemTypes[item.t]
      else return jquerypassargs(
          $('<span>'),
          '$1$ $2$',
          $('<span>', { class: `item-icon type-${item.t}` }).css('background', `var(--level-${item.l})`),
          `${ItemTypes[item.t]}-${romanize(item.l)}`
      )
  }
  function makeScore(data) {
      const cache = JSON.parse(localStorage.getItem('score'))
      const { r, g, b } = data
      const zero = r + g + b == 0

      if (cache === null) $('.score__diff').addClass('hidden')
      else $('.score__diff').removeClass('hidden')

      $('.score__graph').css({
          '--r': zero ? 1 : r,
          '--g': zero ? 1 : g,
          '--b': zero ? 1 : b
      })
      for (const team in data) {
          const diff = data[team] - (cache?.[team] || data[team])
          if (diff == 0) $(`.score__diff[data-team="${team}"]`).addClass('hidden')
          else $(`.score__diff[data-team="${team}"]`).removeClass('hidden').text(`(${new Intl.NumberFormat(LANG, { signDisplay: 'exceptZero' }).format(diff)})`)
          $(`.team-${team} .score__count`).text(new Intl.NumberFormat(LANG).format(data[team]))
      }

      localStorage.setItem('score', JSON.stringify({ r, g, b }))
  }
  function initSettings() {
      if (localStorage.getItem('settings') === null) {
          localStorage.setItem('settings', JSON.stringify({
              lang: 'sys', theme: 'auto',
              imghid: false, dsvhid: false,
              arabic: false, selfpos: false,
              exref: false, base: 'osm',
              plrhid: false
          }))
      }
      const data = JSON.parse(localStorage.getItem('settings'))
      if (typeof data.roman !== 'undefined') { data.arabic = !data.roman; delete data.roman; localStorage.setItem('settings', JSON.stringify(data)) }
      if (data.imghid) $('.i-image-box').addClass('imghid')
      if (data.selfpos) $('#self-info__coord').parent().removeClass('hidden')
      $('html').attr('data-theme', data.theme)
      if (data.theme != 'auto') $('meta[name="color-scheme"]').attr('content', data.theme)
      $(`.layers-config input[value="${data.base}"]`).prop('checked', true)
  }
  function updateSettings() {
      const data = JSON.parse(localStorage.getItem('settings'))
      const since = JSON.parse(localStorage.getItem(`i18next_${LANG.slice(0, 2)}-main`)).i18nStamp
      $('.tg-error').remove()
      $('#lang-cache').text(new Date(since).toLocaleString(LANG))
      for (const key in data) {
          const target = $(`[data-setting="${key}"]`)
          const val = data[key]
          if (typeof val === 'boolean')
              target.prop('checked', typeof target.attr('data-invert') !== 'undefined' ? !val : !!val)
          else target.val(val)
      }
  }
  function changeSettings(key, value) {
      const data = JSON.parse(localStorage.getItem('settings'))
      data[key] = value
      localStorage.setItem('settings', JSON.stringify(data))
  }
  function getSettings(key) {
      return JSON.parse(localStorage.getItem('settings'))[key]
  }
  function closePopup(popup) {
      popup.addClass('hidden')
      popup.find('.toastify').remove()
      popup_toasts.splice(0, Infinity)
      if ($('.info').hasClass('hidden')) {
          clearInterval(timers.info_controls)
          clearInterval(timers.info_cooldown)
          $('.info .inventory__manage-amount').remove()
      }
  }
  function confirmOuter(event) {
      event.preventDefault()
      const href = $(event.currentTarget).attr('data-href') || $(event.currentTarget).attr('href')
      if (!href) return
      const proof = confirm(i18next.t('popups.outer', { href }))
      if (!proof) return
      location.href = href
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
      if (exp >= Levels[9].total) return Levels[9]
      return Levels[Levels.findIndex(f => f.total > exp) - 1] || Levels[0]
  }
  function objcmp(obj1, obj2) {
      if (Object.keys(obj1).length != Object.keys(obj2).length) return false

      const keys = Object.keys(obj1)
      let flag = true
      for (let i in keys) {
          if (obj1[keys[i]] != obj2[keys[i]]) { flag = false; break }
      }
      return flag
  }
  function arraycmp(arr1, arr2) {
      if (arr1.length != arr2.length) return false
      let flag = true
      for (let i in arr1) {
          if (!arr2.find(f => objcmp(f, arr1[i]))) { flag = false; break }
      }
      return flag
  }
  function romanize(num) {
      if (JSON.parse(localStorage.getItem('settings'))?.arabic) return num

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
  function toOLMeters(meters, rate = 1 / ol.proj.getPointResolution('EPSG:3857', 1, map.getView().getCenter(), 'm')) {
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
      } else source = new ol.source.XYZ({})
      base_layer.setSource(source)
      $('.ol-layer__base').attr('data-code', type)
  }
  function apiQuery(endpoint, data = {}, toast_opts = [], exclude = []) {
      return new Promise(async (res, rej) => {
          const h_obj = {
              authorization: `Bearer ${localStorage.getItem('auth')}`,
              'accept-language': LANG
          }
          exclude.forEach(e => delete h_obj[e])
          const request = await fetch(makeURL(`/api/${endpoint}`, data), {
              method: 'get',
              headers: h_obj
          }).catch(() => {
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
          const version = request.headers.get('SBG-Version')
          if (VERSION && version !== VERSION) {
              const toast = createToast(i18next.t('popups.update', { version }), ...toast_opts)
              toast.options.className = 'error-toast'
              toast.showToast()
          }
          if (response.error || request.status !== 200) {
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
              authorization: `Bearer ${localStorage.getItem('auth')}`,
              'accept-language': LANG,
              'content-type': 'application/json'
          }
          exclude.forEach(e => delete h_obj[e])
          const request = await fetch(`/api/${endpoint}`, {
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
          const version = request.headers.get('SBG-Version')
          if (VERSION && version !== VERSION) {
              const toast = createToast(i18next.t('popups.update', { version }), ...toast_opts)
              toast.options.className = 'error-toast'
              toast.showToast()
          }
          if (response.error || request.status !== 200) {
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
  function makeURL(url, params) {
      if (Object.keys(params).length == 0) return url
      let query = []
      for (const key in params) {
          if (params[key] instanceof Array)
              params[key].forEach(e => query.push(`${encodeURIComponent(key)}[]=${encodeURIComponent(e)}`))
          else
              query.push(`${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      }
      return `${url}?${query.join('&')}`
  }

  function createToast(text = '', container = null, position = 'bottom center') {
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
})();