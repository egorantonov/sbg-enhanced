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

  initSettings() // это создает настройки
  let is_dark = getSettings('theme') == 'auto'
    ? matchMedia('(prefers-color-scheme: dark)').matches
    : getSettings('theme') == 'dark'
  let start_follow = false

  if (localStorage.getItem('map-config') == null)
    localStorage.setItem('map-config', JSON.stringify({ l: 7, h: 0 }))

  const LANG = getSettings('lang') == 'sys' ? getLanguage() : getSettings('lang')
  const META = await (await fetch('/i18n/meta.json')).json()
  await i18next.use(i18nextChainedBackend).init({
    lng: LANG,
    supportedLngs: META.supported,
    fallbackLng: META.fallbacks,
    backend: {
      backends: [i18nextLocalStorageBackend, i18nextHttpBackend],
      backendOptions: [{ prefix: 'i18next_' }, { loadPath: '/i18n/{{lng}}/main.json?_t=1' }]
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
    i18next.t('items.types.reference'),
    i18next.t('items.types.broom'),
  ]
  const Cores = [
    { lv: 0, eng: 0, lim: 0 }, { lv: 1, eng: 500, lim: 6 },
    { lv: 2, eng: 750, lim: 6 }, { lv: 3, eng: 1000, lim: 4 },
    { lv: 4, eng: 1500, lim: 4 }, { lv: 5, eng: 2000, lim: 3 },
    { lv: 6, eng: 2500, lim: 3 }, { lv: 7, eng: 3500, lim: 2 },
    { lv: 8, eng: 4000, lim: 2 }, { lv: 9, eng: 5250, lim: 1 },
    { lv: 10, eng: 6500, lim: 1 }
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
  const LevelColors = ['#FECE5A', '#FFA630', '#FF7315', '#E40000', '#FD2992', '#EB26CD', '#C124E0', '#9627F4', '#6D00F5', '#3A00F7']
  const LightStrokes = ['', '#80F', '#80F', '#F80', '#F80']

  const G2T = [[], [1], [2, 4], [3]]
  const LINES_LIMIT_OUT = 30

  jqueryI18next.init(i18next, $, { useOptionsAttr: true })
  $('#attack-menu, .attack-slider-wrp, #deploy, #discover, #draw, .deploy-slider-wrp, .draw-slider-wrp').remove()
  $('html').attr('lang', LANG)
  $('body').localize()
  $('title').text(i18next.t('title'))

  let self_data
  let VERSION
  {
    const { request, response } = await apiQuery('self').catch(({ toast }) => apiCatch(toast))
    if (!response) return
    self_data = response
    VERSION = request.headers.get('SBG-Version')
  }

  updateSelfInfo()
  initSettings() // это применяет настройки

  apiQuery('inventory')
    .catch(({ toast }) => apiCatch(toast))
    .then(({ response }) => {
      localStorage.setItem('inventory-cache', JSON.stringify(response.i))
      const total = response.i.map(m => m.a).reduce((acc, e) => acc += e, 0)
      $('#self-info__inv').text(total)
        .parent().css('color', total >= 3000 ? 'var(--accent)' : '')
    })

  apiQuery('notifs', { latest: +localStorage.getItem('latest-notif') })
    .catch(({ toast }) => apiCatch(toast))
    .then(({ response }) => {
      if (response.count > 0) $('#notifs-menu').attr('data-count', response.count)
    })
  setInterval(() => {
    apiQuery('notifs', { latest: +localStorage.getItem('latest-notif') })
    .catch(({ toast }) => apiCatch(toast))
    .then(({ response }) => {
      if (response.count > 0) $('#notifs-menu').attr('data-count', response.count)
    })
  }, 60e3)

  fetch('/assets/rarities.svg').then(r => r.text().then(xml => $('body').append(xml)))

  const player_feature = new ol.Feature({
    geometry: new ol.geom.Point(ol.proj.fromLonLat([0, 0]))
  })
  const player_styles = [new ol.style.Style({
    image: new ol.style.Icon({
      src: `/assets/player/${self_data.t}.svg`
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
  const player_layer = new ol.layer.Vector({ source: player_source, name: 'player', className: 'ol-layer__player', zIndex: 4 })

  const points_source = new ol.source.Vector()
  const points_layer = new ol.layer.Vector({ source: points_source, name: 'points', className: 'ol-layer__points', zIndex: 3 })

  const lines_source = new ol.source.Vector()
  const lines_layer = new ol.layer.Vector({ source: lines_source, name: 'lines', className: 'ol-layer__lines', zIndex: 2 })

  const regions_source = new ol.source.Vector()
  const regions_layer = new ol.layer.Vector({ source: regions_source, name: 'regions', className: 'ol-layer__regions', zIndex: 1 })

  const FeatureStyles = {
    POINT: (pos, team, energy, light) => new ol.style.Style({
      geometry: new ol.geom.Circle(pos, 12),
      renderer: (coords, state) => {
        const ctx = state.context
        const [[xc, yc], [xe, ye]] = coords
        const radius = Math.sqrt((xe - xc) ** 2 + (ye - yc) ** 2)

        ctx.lineWidth = 2
        ctx.strokeStyle = team == 0 ? TeamColors[0].stroke() : TeamColors[team].stroke
        ctx.fillStyle = team == 0 ? TeamColors[0].fill() : TeamColors[team].fill
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

        const h = JSON.parse(localStorage.getItem('map-config')).h
        if (h == 0) return
        const offset = 4
        ctx.lineWidth = 3
        if (typeof light === 'boolean' && light) {
          ctx.strokeStyle = LightStrokes[h]
          ctx.beginPath()
          ctx.arc(xc, yc, radius + offset, 0, 2 * Math.PI)
          ctx.stroke()
        } else if (typeof light === 'number') {
          ctx.beginPath()
          ctx.strokeStyle = LevelColors[light - 1]
          ctx.arc(xc, yc, radius + offset, 0, 2 * Math.PI)
          ctx.stroke()
        }
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
  const ViewOffsets = {
    NORMAL: 165,
    CENTER: -10
  }
  view.setProperties({ offset: [0, ViewOffsets.NORMAL] })
  const map = new ol.Map({
    target: 'map',
    layers: [base_layer, regions_layer, lines_layer, points_layer, player_layer],
    view,
    controls: ol.control.defaults.defaults().extend([new ol.control.ScaleLine()])
  })

  ;(function handleURLLinks() {
    const params = new URLSearchParams(location.search)
    history.replaceState({}, '', location.pathname)
    if (params.has('point')) {
      const guid = params.get('point')
      if (!guid.match(/^[a-z\d]{12}\.22a$/)) return
      showInfo(guid)
    } else if (params.has('player')) {
      const query = params.get('player')
      if (!query.match(/^[a-z\d<>]+$/i)) return
      openProfile(query)
    }
  })();

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
    if (piv.length) showInfo(piv[0])
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

    const zoom = view.getZoom()
    if (zoom % 1 != 0) return view.setZoom(Math.round(zoom))

    const offset = new ol.geom.LineString([prev_pos.center, view.getCenter()])
    if (ol.sphere.getLength(offset) <= 30 && Math.abs(prev_pos.zoom - zoom) < 1) return
    prev_pos.center = view.getCenter()
    prev_pos.zoom = zoom
    requestEntities()
  })
  setInterval(requestEntities, 5 * 60 * 1000)

  let watcher
  if ('geolocation' in navigator) {
    watcher = navigator.geolocation.watchPosition(({ coords }) => {
      // coords = { longitude: 37.9080643523613, latitude: 55.97469155253259 }
      movePlayer([coords.longitude, coords.latitude])
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
          player_source.clear()
          $('#self-info__coord').parent().remove()
          $('#toggle-follow').remove()
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
    damage_texts: []
  }
  const point_state = {
    info: {},
    possible_lines: []
  }
  const popup_toasts = []

  $('#self-info__name').attr('data-name', self_data.n)
  $('.profile-link').on('click', openProfile)
  $('.popup-close').on('click', e => {
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

  $('#repair').on('click', async () => {
    $('#repair').addClass('locked').prop('disabled', true)
    const guid = $('.info').attr('data-guid')
    const { response } = await apiSend('repair', 'post', {
      guid,
      position: ol.proj.toLonLat(player_feature.getGeometry().getCoordinates())
    }, [$('.info')[0], 'top right']).catch(({ toast }) => apiCatch(toast, true))
    $('#repair').removeClass('locked').prop('disabled', false)
    if (!response) return

    self_data.x = response.xp.cur
    self_data.l = getLevelByExp(response.xp.cur).lv
    showExpDiff(response.xp.diff)
    updateSelfInfo()

    if ($('.info').hasClass('hidden')) return

    const formatter = new Intl.NumberFormat(LANG, { maximumFractionDigits: 1 })
    let eng = 0
    let eng_total = 0
    response.data.forEach(core => {
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
    })

    const feature = points_source.getFeatureById(guid)
    if (feature) {
      const prop = feature.getProperties()
      feature.getStyle()[0] = FeatureStyles.POINT(ol.proj.fromLonLat(point_state.info.c), point_state.info.te, eng / eng_total, prop.highlight)
      feature.changed()
    }
    point_state.info.co = response.data
  })

  $('#ops').on('click', async () => {
    if (!$('.inventory').hasClass('hidden')) return $('.inventory').addClass('hidden')
    $('#ops').prop('disabled', true)
    const { response } = await apiQuery('inventory').catch(({ toast }) => apiCatch(toast))
    $('#ops').prop('disabled', false)
    if (!response) return

    $('.inventory').removeClass('hidden')
    localStorage.setItem('inventory-cache', JSON.stringify(response.i))
    const total = response.i.reduce((acc, e) => acc += e.a, 0)
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
      const tab = +$('.inventory__tab.active').attr('data-tab')
      const { response } = await apiSend('inventory', 'delete', {
        selection: selected_items,
        tab
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
      if (tab == 2 && response.count[tab] == 0)
        $('.attack-slider-wrp').addClass('hidden')
      inventory = inventory.filter(f => !selected_items.includes(f.g))
      localStorage.setItem('inventory-cache', JSON.stringify(inventory))
      selected_items.splice(0, Infinity)

      $('.inventory__tab.active .inventory__tab-counter').text(response.count[tab])
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
      'data-tab': cache.t
    })
    $('.info').append(el)
    const input = el.find('.inventory__ma-amount')
    el.find('.inventory__ma-item').text(i18next.t('items.types.references'))
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
      exploration: ['discoveries', 'unique_visits', 'unique_captures']
    }
    const container = $('#leaderboard__term-select')
    for (const section in stats) {
      container.append($('<option>', { text: i18next.t(`leaderboard.sort-sections.${section}`), disabled: '' }))
      stats[section].forEach(e => {
        container.append($('<option>', { value: e, text: i18next.t(`leaderboard.sort-terms.${e}`) }))
      })
    }
    container.on('change', drawLeaderboard)
  })();
  $('#leaderboard').on('click', () => {
    if (!$('.leaderboard').hasClass('hidden')) return $('.leaderboard').addClass('hidden')
    drawLeaderboard()
  })
  $('.outer-link').on('click', confirmOuter)

  $('#toggle-follow').attr('data-active', localStorage.getItem('follow') != 'false')
  $('#toggle-follow').on('click', e => {
    const active = localStorage.getItem('follow') != 'false'
    localStorage.setItem('follow', !active)
    $(e.target).attr('data-active', !active)
    if (!active) {
      movePlayer(ol.proj.toLonLat(player_feature.getGeometry().getCoordinates()))
      if (view.getZoom() < 15) view.setZoom(17)
    }
  })

  $('#layers').on('click', () => {
    if (!$('.layers-config').hasClass('hidden')) return $('.layers-config').addClass('hidden')
    $('.layers-config').removeClass('hidden')
    const data = JSON.parse(localStorage.getItem('map-config'))
    const layers = Bitfield.from(data.l)
    layers.forEach((e, n) => $(`[name="layer"][value="${n}"]`).prop('checked', e))
    $(`#map-lights [value="${data.h}"]`).prop('selected', true)
    updateSettings()
  })
  $('[name="baselayer"]').on('change', e => {
    const value = $(e.target).val()
    changeSettings('base', value)
    setBaselayer()
  })
  $('#layers-config__save').on('click', async e => {
    const button = $(e.target)
    const data = JSON.parse(localStorage.getItem('map-config'))
    const layers = new Bitfield()
    $('[name="layer"]').each((_, e) => layers.change($(e).val(), $(e).prop('checked')))
    data.l = +layers.toString()
    data.h = +$('#map-lights').val()
    localStorage.setItem('map-config', JSON.stringify(data))
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
    if (!$('.settings').hasClass('hidden')) return $('.settings').addClass('hidden')
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
  $('.regions-opacity__range input').on('input', e => {
    const val = +$(e.target).val()
    $('#regions-opacity__cur').text(Math.round(val / 15 * 100) + '%')
    changeSettings('opacity', val)
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

  $('#notifs-menu').on('click', async () => {
    $('#notifs-menu').prop('disabled', true)
    const { response } = await apiQuery('notifs').catch(({ toast }) => apiCatch(toast))
    $('#notifs-menu').prop('disabled', false).removeAttr('data-count')
    if (typeof response === 'undefined') return

    const latest = +localStorage.getItem('latest-notif')
    $('.notifs').removeClass('hidden')
    $('.notifs__list').empty()
    if (!response.list.length) {
      $('.notifs__list').append($('<div>', { text: i18next.t('notifs.empty') }).css({
        'text-align': 'center',
        'font-style': 'italic'
      }))
      return
    }
    response.list.forEach(entry => {
      const date = new Date(entry.ti)
      $('.notifs__list').append($('<div>', { class: `notifs__entry ${entry.id == latest ? 'latest' : ''}`, 'data-id': entry.id, 'data-target': entry.g })
        .append($('<span>', { class: 'notifs__entry-stamp' })
          .append($('<span>', { class: 'notifs__entry-time', text: date.toLocaleString(LANG, { hour: '2-digit', minute: '2-digit' }) }))
          .append($('<span>', { class: 'notifs__entry-date', text: date.toLocaleString(LANG, { month: 'short', day: 'numeric' }) }))
        )
        .append($('<span>', { class: 'notifs__entry-title', text: entry.t }))
        .append(jquerypassargs(
          $('<span>', { class: 'notifs__entry-text' }),
          i18next.t('notifs.text'),
          $('<span>', { class: 'profile-link' }).text(entry.na).css('color', `var(--team-${entry.ta})`).attr('data-name', entry.na).on('click', openProfile)
        ))
        .append($('<button>', { class: 'notifs__entry-view icon-button' }).append($('<span>', { class: 'material-symbols-outlined', text: 'visibility' }))).on('click', () => {
          $('#toggle-follow').attr('data-active', false)
          localStorage.setItem('follow', false)
          view.setCenter(ol.proj.fromLonLat(entry.c))
          $('.notifs').addClass('hidden')
        })
      )
    })
    localStorage.setItem('latest-notif', response.list[0].id)
  })
  $('.region-picker').on('click', () => {
    if (count_regions) {
      createToast(i18next.t('popups.pick-regions.off'), null, 'top right').showToast()
      $('.region-picker').removeClass('active')
    } else {
      createToast(i18next.t('popups.pick-regions.on'), null, 'top right').showToast()
      $('.region-picker').addClass('active')
    }
    count_regions = !count_regions
  })

  $('#logout').on('click', async () => {
    const proof = confirm(i18next.t('popups.logout'))
    if (!proof) return
    clearStorage()
    location.href = '/login'
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
    point_state.info = json

    const feature = points_source.getFeatureById(json.g)
    const team_color = `var(--team-${json.te})`
    const percent_format = new Intl.NumberFormat(LANG, { maximumFractionDigits: 1 })

    let eng = 0
    let eng_total = 0
    json.co.forEach(c => { eng += c.e; eng_total += Cores[c.l].eng })

    if (feature) {
      const prop = feature.getProperties()
      feature.getStyle()[0] = FeatureStyles.POINT(ol.proj.fromLonLat(json.c), json.te, eng / eng_total, prop.highlight)
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
    if (typeof json.li !== 'undefined') {
      $('#i-stat__line-in').text(json.li.i)
      $('#i-stat__line-out').text(json.li.o)
    }
    if (typeof json.r !== 'undefined') $('#i-stat__region').text(json.r)
    $('#i-share').off('click').on('click', () => {
      const link = `${location.href}?point=${json.g}`
      invokeShare({
        title: i18next.t('popups.point.share-title', { title: json.t }),
        url: link
      }, {
        plain: link,
        text: i18next.t('popups.point.copy-url'),
        parent: $('.info')[0],
        position: 'top right'
      })
    })
    $('#i-copy-pos').off('click').on('click', () => {
      const pos = json.c.slice().reverse()
      invokeShare({ title: json.t, text: pos }, {
        plain: pos,
        text: i18next.t('popups.point.copy-pos'),
        parent: $('.info')[0],
        position: 'top right'
      })
    })
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

    clearInterval(timers.info_controls)
    timers.info_controls = setInterval(() => {
      const in_range = isInRange(point_state.info.c)
      $('#repair:not(.locked)').prop('disabled', !((in_range || (!in_range && inventory.find(f => f.l === point_state.info.g))) && point_state.info.te == self_data.t && point_state.info.co.some(s => s.e < Cores[s.l].eng)))
      $('#i-stat__distance').text(distanceToString(getDistance(point_state.info.c)))
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
    $('#self-info__coord').text(coords.slice().reverse().map(m => m.toFixed(5)).join(', '))
    const pos = ol.proj.fromLonLat(coords)
    player_feature.getGeometry().setCoordinates(pos)
    player_styles.slice(1, 3).forEach(e => e.getGeometry().setCenter(pos))
    if (localStorage.getItem('follow') != 'false' || !start_follow) {
      view.setCenter(pos)
      // view.adjustCenter(view.getProperties().offset)
    }
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
    const tab = $('.inventory__tab.active').attr('data-tab')
    const inventory = JSON.parse(localStorage.getItem('inventory-cache'))
    $('.inventory__content').empty().attr('data-tab', tab)
    inventory.filter(f => G2T[tab].includes(f.t)).sort((a, b) => a.t - b.t).forEach(createInventoryItem)
    $('.inventory__tab').each((_, tab) => {
      const category = $(tab).attr('data-tab')
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
      const title_alt = title.clone().replaceWith($('<div>'))
      const text = title_alt.text()
      if (data.t == 3) title_alt.text(text.slice(text.indexOf(')') + 2)).css('font-size', '.8em')
      $('.inventory__manage-amount').removeClass('hidden').attr({
        'data-guid': data.g,
        'data-tab': G2T.findIndex(f => f.includes(data.t))
      })
      $('.inventory__ma-item').empty().append(title_alt)
      $('.inventory__ma-amount').attr('max', item.a)
      $('.inventory__ma-max').text(item.a)
    }

    const container = $('<div>', { class: 'inventory__item' })
    const title = $('<span>', { class: `inventory__item-title ${data.t > 3 ? `has-rarity rarity-${data.l}` : ''}`, text: makeItemTitle(data) })
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
      title.css('color', data.t > 3 ? 'var(--text)' : `var(--level-${data.l})`)
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
      localStorage.setItem('refs-cache', JSON.stringify(cache))
      makeEntry(e, data)
    })

    function makeEntry(e, data) {
      $(e).find('.inventory__ic-view').prop('disabled', false).on('click', () => {
        if ($('#inventory-delete').attr('data-del') != 0) return
        $('#toggle-follow').attr('data-active', false)
        localStorage.setItem('follow', false)
        view.setCenter(ol.proj.fromLonLat(data.c))
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
        distanceToString(getDistance(data.c))
      )
      target.replaceWith(entry)
      $(e).removeClass('loading').addClass('loaded')
    }
  }
  async function deleteInventoryItem(parent) {
    const valid = parent.find('.inventory__ma-amount')[0].reportValidity()
    if (!valid) return false
    const button = parent.find('.inventory__ma-delete')
    const amount = parent.find('.inventory__ma-amount')
    button.prop('disabled', true)
    const guid = parent.attr('data-guid')
    const tab = +parent.attr('data-tab')
    const { response } = await apiSend('inventory', 'delete', {
      selection: { [guid]: +amount.val() },
      tab
    }, [$('.inventory')[0], 'bottom left']).catch(({ toast }) => apiCatch(toast))
    button.prop('disabled', false)
    if (!response) return false

    const inventory = JSON.parse(localStorage.getItem('inventory-cache')) || []
    parent.addClass('hidden').removeAttr('data-guid')
    amount.val(1).removeAttr('max')

    const element = $(`.inventory__item[data-guid="${guid}"]`)
    const slide = $(`.splide__slide[data-guid="${guid}"]`)
    if (response.count.item > 0) {
      if (tab == 3) {
        const title = element.find('.inventory__item-title')
        title.text(`(x${response.count.item}) ${title.text().slice(title.text().indexOf(')') + 2)}`)
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
    localStorage.setItem('inventory-cache', JSON.stringify(inventory))

    $(`.inventory__tab[data-tab="${tab}"] .inventory__tab-counter`).text(response.count[tab])
    $('#self-info__inv').text(response.count.total)
      .parent().css('color', response.count.total >= 3000 ? 'var(--accent)' : '')
    if (tab == 3) $('#i-ref').text(i18next.t('info.refs', { count: response.count.item })).attr('data-has', +(response.count.item > 0))
    return true
  }

  async function openProfile(data) {
    const struct = [
      ['captures', 'neutralizes', 'cores_deployed', 'cores_destroyed', 'owned_points', 'guard_point'],
      ['lines', 'max_line', 'guard_line', 'lines_destroyed', 'regions', 'regions_area', 'max_region', 'guard_region', 'regions_destroyed'],
      ['total_days', 'discoveries', 'unique_visits', 'unique_captures']
    ]
    let name
    if (data instanceof $.Event) name = $(data.currentTarget).attr('data-name')
    else if (data.match(/^[a-z\d<>]+$/i)) name = data
    else return
    if (name == 'n/a') return

    const { response } = await apiQuery('profile', { name }).catch(({ toast }) => apiCatch(toast))
    if (!response) return

    const level = Levels[response.level - 1]
    const team_color = `var(--team-${response.team})`
    const formatter = new Intl.NumberFormat(LANG)
    const unit_xp = i18next.t('units.pts-xp')
    $('.profile').removeClass('hidden')
    $('#pr-name').text(response.name)
    $('#pr-name, #pr-xp-current, .pr-xp-level').css('color', team_color)
    $('#pr-xp-current').text(level.target == Infinity ? `${formatter.format(response.xp)} ${unit_xp}` : `${formatter.format(response.xp - level.total)} / ${formatter.format(level.target)} ${unit_xp}`)
    $('#pr-xp-level-num').text(response.level)
    $('.pr-xp-progress-bar').css({
      width: level.target == Infinity ? '100%' : (response.xp - level.total) / level.target * 100 + '%',
      background: team_color
    })
    $('.pr-stats__section:not(.persist)').remove()
    $('.pr-stats').animate({ scrollTop: 0 }, 500)
    $('.pr-stat__total-xp .pr-stat-val').text(`${formatter.format(response.xp)} ${unit_xp}`)
    $('.pr-stat__age .pr-stat-val').text(new Date(response.created_at).toLocaleDateString(LANG, { day: 'numeric', month: 'long', year: 'numeric' }))
    struct.forEach((section, n) => {
      const container = $('<div>', { class: 'pr-stats__section' })
      container.append($('<h4>', { class: 'pr-stats__section-header', text: i18next.t(`profile.sections.${n}`) }))
      section.forEach(stat => {
        container.append($('<div>', { class: 'pr-stat' })
          .append($('<span>', { class: 'pr-stat-title', text: i18next.t(`profile.stats.${stat}`) }))
          .append($('<span>', { class: 'pr-stat-val', text: formatStatValue(stat, response[stat]) }))
        )
      })
      $('.pr-stats').append(container)
    })
    $('#pr-button__copy').off('click').on('click', () => {
      const data = {
        date: new Date().toISOString(),
        name: response.name,
        team: ['GRAY', 'RED', 'GREEN', 'BLUE'][response.team],
        xp: response.xp
      }
      struct.forEach(section => { for (const stat of section) data[stat] = response[stat] })
      navigator.clipboard.writeText(JSON.stringify(data)).then(() => {
        createToast(i18next.t('popups.profile.copy-data'), $('.profile')[0], 'top right').showToast()
      })
    })
    $('#pr-button__share').off('click').on('click', () => {
      const link = `${location.href}?player=${response.name}`
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
  }
  function invokeShare(options, toast) {
    if ('share' in navigator) {
      navigator.share(options).then(...args => {
        console.log(args)
      })
    } else {
      navigator.clipboard.writeText(toast.plain).then(() => {
        createToast(toast.text, toast.parent, toast.position).showToast()
      })
    }
  }
  function formatStatValue(key, value) {
    const formatter = new Intl.NumberFormat(LANG)
    if (key.match(/^guard_|_days$/)) return i18next.t('units.n-days', { count: value })
    else if (key.match(/_area$|^max_region$/)) return areaToString(value)
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
      [/lines?/, 'lns'],
      [/regions/, 'rgs'],
    ]

    $('#leaderboard').prop('disabled', true)
    const stat = $('#leaderboard__term-select').val()
    const unit = units.find(f => f[0].test(stat))?.[1]
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
    response.d.forEach((e, n) => {
      const entry = $('<tr>')
        .append($('<td>', { text: n + 1 }))
        .append(jquerypassargs(
          $('<td>'), '$1$ $2$',
          $('<span>', { class: 'profile-link', text: e.n }).css('color', `var(--team-${e.t})`).attr('data-name', e.n).on('click', openProfile),
          $('<span>', { class: 'level-pill', text: e.l }).attr('data-level', e.l).css('background', `var(--level-${e.l})`)
        ))
        .append($('<td>', { text: takeUnits(e.s).join(' ') }))
      if (e.n == self_data.n) entry.addClass('own')
      $('.leaderboard__list').append(entry)
    })

    function takeUnits(value) {
      if (stat === 'max_line') return ['', distanceToString(value)]
      else if (stat === 'max_region') return ['', areaToString(value)]
      else return [formatter.format(value), i18next.t(`units.${unit}`)]
    }
  }

  async function requestEntities() {
    const data = JSON.parse(localStorage.getItem('map-config'))
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
    if (zoom > 10) npoints = 5
    else if (7 < zoom && zoom <= 10) npoints = 25
    else if (zoom <= 7) npoints = 50
    source.p.forEach(e => {
      const mpos = ol.proj.fromLonLat(e.c)
      const feature = new ol.Feature({
        geometry: new ol.geom.Point(mpos)
      })
      feature.setId(e.g)
      feature.setStyle([FeatureStyles.POINT(mpos, e.t, e.e, e.h)])
      feature.setProperties({
        team: e.t,
        energy: e.e,
        highlight: e.h
      })
      points_source.addFeature(feature)
    })
    source.l.forEach(e => {
      const arc = turf.greatCircle(...e.c, { npoints })
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
    source.r.forEach(e => {
      const ts = []
      for (let i = 1; i <= 3; i++)
        ts.push(turf.greatCircle(e.c[0][i - 1], e.c[0][i], { npoints }).geometry.coordinates)
      const n = ts.flat().map(m => ol.proj.fromLonLat(m))
      n[n.length - 1] = n[0]

      const feature = new ol.Feature({ geometry: new ol.geom.Polygon([n]) })
      feature.setId(e.g)
      feature.setProperties({ team: e.t })
      feature.setStyle(new ol.style.Style({
        fill: new ol.style.Fill({ color: TeamColors[e.t].stroke + (getSettings('opacity') || 2).toString(16) })
      }))
      regions_source.addFeature(feature)
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
    if (distance < 1) return i18next.t('units.cm', { count: distance * 100 })
    else if (distance < 1000) return i18next.t('units.m', { count: distance })
    else return i18next.t('units.km', { count: distance / 1000 })
  }
  function areaToString(area) {
    if (area < 1) return i18next.t('units.sqm', { count: area * 1e6 })
    else return i18next.t('units.sqkm', { count: area })
  }
  // function areaToString(area) {
  //   if (area < 1e-4) return i18next.t('units.ar', { count: area * 1e4 })
  //   else if (area < 10) return i18next.t('units.hect', { count: area * 100 })
  //   else return i18next.t('units.sqkm', { count: area })
  // }
  function timeToHMS(seconds, display_hours = true) {
    const str = [
      Math.floor(seconds / 3600),
      Math.floor(seconds % 3600 / 60),
      Math.floor(seconds % 3600 % 60)
    ].map(m => m.toString().padStart(2, '0'))
    return str.slice(!display_hours && str[0] === '00' ? 1 : 0).join(':')
  }

  function clearStorage() {
    const persist = ['follow', 'score', 'map-config', 'settings', 'uniques', 'latest-notif', /^i18next_/]
    for (const key in localStorage) {
      if (persist.find(f => f instanceof RegExp ? f.test(key) : f == key)) continue
      localStorage.removeItem(key)
    }
  }
  function makeItemTitle(item) {
    if (item.t == 3) return `(x${item.a}) ${item.ti}`
    else if (item.t == 4) return ItemTypes[item.t]
    else return `${ItemTypes[item.t]}-${romanize(item.l)}`
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
        cell.find('.current').text(n == 0 ? f.format(e[team]) : i18next.t('units.sqkm', { count: e[team] }))
        cell.find('.diff').text(`(${n == 0 ? df.format(diff) : `${df.format(diff).match(/^[\-+]?/)[0]}${i18next.t('units.sqkm', { count: diff })}`})`)
      }
    })
  }
  function initSettings() {
    if (localStorage.getItem('settings') === null) {
      localStorage.setItem('settings', JSON.stringify({
        lang: 'sys', theme: 'auto',
        imghid: false, dsvhid: false,
        arabic: false, selfpos: false,
        exref: false, base: 'cdb',
        plrhid: false, opacity: 2
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
      clearInterval(timers.score)
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

  class Bitfield{#bits=[];constructor(...bits){bits.forEach(e=>this.#bits.push(Boolean(e)))};get(bit){return this.#bits[bit]??false};change(bit,state){this.#bits[bit]=Boolean(state);return this};forEach(callback){for(let i=0;i<this.#bits.length;i++)callback(this.get(i),i)};toString(radix=10){let sum=0;for(let i=0;i<this.#bits.length;i++)sum+=this.#bits[i]<<i;return sum.toString(radix)}}
  Bitfield.from=function(number){const bf=new Bitfield();let i=0;while(number>=(1<<i)){bf.change(i,number&(1<<i));i++}return bf}
})();
