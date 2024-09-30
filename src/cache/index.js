import { CUI, Elements, Events, Modifiers, Nodes, SBG, t, Translations as i18n } from '../constants'
import { AddEntry, ClearStore, GetEntry, StoreInfo, STORE_NAMES, IndexedDb } from '../db'
import { State } from '../state'
import { Logger, showToast } from '../utils'

const currentImage = 'currentImage'
const GET = 'get'
export function Cache() {
  IndexedDb()
  const { fetch: originalFetch } = window

	window.fetch = async (...args) => {
		let [resource, config] = args

		const response = await originalFetch(resource, config)

		if (config?.method === GET && resource.includes('/api/point') && (!resource.includes('status=1'))) {
      const enrichedResponse = response.clone().json().then(point => {
				const url = `${SBG.GooglePhoto}${point.data.i}`
				State.Set(currentImage, '')
				CacheImage(url, point.data.g)
				point.data.i = null
				return point
			})

			response.json = () => enrichedResponse
		}
    else if (config?.method === GET && resource.includes('/api/draw') && !resource.includes('&sbgcuiPossibleLinesCheck=')) {
      const enrichedResponse = response.clone().json().then(draw => {
        const images = State.Get(STORE_NAMES.images) ?? []
        if (!draw.data?.length) {
          Logger.error('Неожиданный ответ сервера!', draw)
        }
        for (let i = 0; i < draw.data.length; i++) {
          const point = draw.data[i]
          const key = `${SBG.GooglePhoto}${point.i}`
          const image = images.find(i => i.key === key)
          if (image) {
            point.i = null
            // from cache
            setTimeout(async () => {
              const slide = document.querySelector(`#refs-list>li.splide__slide[data-point="${point.p}"]`)
              //slide.querySelector('.refs-list__image').firstChild.style.backgroundImage = `url(${await getBlobUrl(image.value)})`
              slide.querySelector('.refs-list__image').firstChild.style.backgroundImage = `url("${image.value}")`
            }, 0)
          }
          else {
            // cache image
            CacheDrawImage(key, point.p)
          }
        }

        return draw
      })

      response.json = () => enrichedResponse
    }

		return response
	}

  const title = document.createElement(Elements.Span)
  title.id = 'eui-images'
  title.innerText = t(i18n.clearStore)
  const input = document.createElement(Elements.Button)
  input.innerText = t(i18n.clearStoreAction)
  input.addEventListener(Events.onClick, () => {
    ClearStore(STORE_NAMES.images, (name) => {
      title.removeAttribute('data-size')
      const message = t(i18n.storeCleared, [name])
      Logger.log(message)
      showToast(message)
    })
  })
  const label = document.createElement(Elements.Div)
  label.classList.add(Modifiers.SettingsSectionItemClassName)
  label.appendChild(title)
  label.appendChild(input)

  Nodes.SettingSections.at(0)?.appendChild(label)

  StoreInfo(STORE_NAMES.images, (result) => {
    title.dataset.size = result / 10
  })

  document.querySelector('.inventory__content')?.addEventListener(Events.onScroll, e => getRefsPics(e.target))
  const ops = document.getElementById('ops')
  ops?.addEventListener(Events.onClick, () => {
    setTimeout(async () => getRefsPics(document.querySelector('.inventory__content')), 150)
  })

  if (CUI.Loaded()) {
    const hide = document.createElement(Elements.Button)
    hide.id = 'eui-hide'
    hide.addEventListener(Events.onClick, () => {
      Nodes.InventoryPopup.classList.contains(Modifiers.Hidden) && Nodes.InventoryPopup.classList.toggle(Modifiers.Hidden)
    })
    hide.innerText = '>'

    ops.addEventListener(Events.onClick, () => {
      ops?.after(hide)
    }, { once: true })
  }

  document.querySelector('.inventory__tab[data-tab="3"]:not(.active)')?.addEventListener(Events.onClick, () => getRefsPics(document.querySelector('.inventory__content')))
}

function getRefsPics(target) {
  const { scrollTop, clientHeight } = target
  const images = State.Get(STORE_NAMES.images) ?? []
  if (!images.length) {
    return
  }
  // TODO: refactoring - remove jQuery
  window.$ && window.$('.inventory__item').each((_, e) => {
    if (!window.$(e).attr('data-ref') || window.$(e).hasClass('eui_img')) return
    if (!(e.offsetTop <= scrollTop + clientHeight && e.offsetTop >= scrollTop)) return
    const id = window.$(e).attr('data-ref') // e.dataset.ref
    const image = images.find(i => i.id === id)
    if (!image?.value) return
    const itemLeft = e.querySelector('.inventory__item-left')
    itemLeft.style.background = `linear-gradient(var(--background-transp), var(--background-transp)), url(${image.value})`
    e.classList.add('eui_img')
  })
}

const iImage = 'i-image'
// const onImageChanged = 'imageChanged'
export const ImageChanged = () => ({
    target: Nodes.GetId(iImage),
    config: {
        attributes: true,
        attributeFilter: ['style']
    },
    callback: (mutations) => {
      mutations.forEach(async mutation => {
        if (mutation.attributeName === 'style') {
          const backgroundImage = Nodes.GetId(iImage).style.backgroundImage
          // if (backgroundImage && backgroundImage.includes('url(') && backgroundImage.includes('http')) {
            // const imageUrl = backgroundImage.replace(/url\(['"]?(.*?)['"]?\)/, '$1')
          if (backgroundImage && backgroundImage.includes('/photos/no_image.png')) {

            // Nodes.GetId(iImage).style.backgroundImage = `url("${await getBlobUrl(State.Get(currentImage))}")`
            Nodes.GetId(iImage).style.backgroundImage = `url("${State.Get(currentImage)}")`
          }
        }
      })
    }
  })

export function CacheImage(url, id) {
  const element = Nodes.GetId(iImage)
  cacheImage(element, url, id)
}

export function CacheDrawImage(url, id) {
    const img = new Image()
    img.crossOrigin = 'anonymous' // CORS
    img.src = url

    img.onload = async function() {
      const base64 = await toBase64(url)
      AddEntry(STORE_NAMES.images, { key: url, value: base64, id })

      const slide = document.querySelector(`#refs-list>li.splide__slide[data-point="${id}"]`)
      // slide.querySelector('.refs-list__image').firstChild.style.backgroundImage = `url("${await getBlobUrl(base64)}")`
      slide.querySelector('.refs-list__image').firstChild.style.backgroundImage = `url("${base64}")`
      Logger.log(`Закэшировано [${url}]`)
    }

    img.onerror = function() {
      Logger.error('Не удалось загрузить изображение:', url)
    }
}

function cacheImage(element, url, id) {

  const successCallback = (record) => {
    if (!record || !record.value) {
      const img = new Image()
      img.crossOrigin = 'anonymous' // CORS
      img.src = url

      img.onload = async function() {

        const base64 = await toBase64(url)
        State.Set(currentImage, base64)

        AddEntry(STORE_NAMES.images, {key: url, value: base64, id})

        const elementId = element.id 
        // document.getElementById(elementId).style.backgroundImage = `url("${await getBlobUrl(base64)}")`
        document.getElementById(elementId).style.backgroundImage = `url("${base64}")`

        Logger.log(`Cached [${url}]`)
      }

      img.onerror = function() {
        Logger.error('Failed to load image:', url)
      }
    }
    else {
      State.Set(currentImage, record.value)
    }
  } 

  GetEntry(STORE_NAMES.images, url, successCallback)
}

const toBase64 = url => fetch(url)
  .then(response => response.blob())
  .then(blob => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  }))

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function getBlobUrl(base64) {
  debugger // TODO: Isnt working with CUI
  const blob = await fetch(base64).then(r => r.blob())
  Logger.log(blob)
  const url = URL.createObjectURL(blob)
  return url
}