import { ClientData, CUI, EUI, Elements, Events, GetLocale, IsPrivate, Modifiers, Nodes, Proposed, SBG, Themes, t, Translations as i18n } from '../constants'
import monoStyles from './styles/mono.min.css'
import ingressStyles from './styles/ingress.min.css'
import primeStyles from './styles/prime.min.css'
import euiStyles from './styles/eui.min.css'
import arcadeStyles from './styles/arcade.min.css'
import { getSbgSettings, setSbgSettings } from '../utils'

class Theme {
	constructor(title, code, innerHTML) {
		this.title = title
		this.code = code
		this.innerHTML = innerHTML
	}
	title = ''
	code = 0
	innerHTML = ''
}

export default function AddColorScheme() {
	const i18next = window.i18next
	const applyTranslations = (target) => {
		let tCache = JSON.parse(localStorage.getItem(target))

		if (!tCache) {
			return
		}

		tCache.buttons.discover = t(i18n.discover)
		tCache.buttons.deploy = t(i18n.deploy)
		tCache.buttons.repair = t(i18n.repair)
		tCache.buttons.draw = t(i18n.draw)
		tCache.info.refs = '🔑 {{count}}/100'
		tCache.info.lines = t(i18n.lines)
		tCache.info.regions = t(i18n.fields)

		localStorage.setItem(target, JSON.stringify(tCache))
	}

	const updateControlChars = (target) => {
		if (i18next) {
			i18next.addResources(i18next.resolvedLanguage, 'main', {
				'buttons.references.manage': '',
				'buttons.references.view': '',
				'items.catalyser-short': '{{level}}',
				'items.core-short': '{{level}}',
			})

			let tCache = JSON.parse(localStorage.getItem(target))

			if (tCache && i18next.resolvedLanguage == SBG.DefaultLang) {
				tCache.items.types.references = 'Refs'
				localStorage.setItem(target, JSON.stringify(tCache))
			}
		}
	}

	const ensureDarkTheme = () => {
		const themeSelect = Nodes.GetSelector('.settings select[data-setting="theme"]')
		themeSelect.value = 'dark'
		themeSelect.dispatchEvent(new Event('change'))
		themeSelect.disabled = true
	}

	const i18next_main = `i18next_${GetLocale()}-main`
	updateControlChars(i18next_main)
	const input = document.createElement(Elements.Select)
	/** @type Theme[] */const themes = [
		new Theme(Themes.EUI, 0, euiStyles),
		new Theme(Themes.Ingress, 1, ingressStyles),
		new Theme(Themes.Prime, 2, primeStyles),
		new Theme(Themes.Mono, 3, `${euiStyles}\r\n${monoStyles}`),
		new Theme(Themes.Arcade, 4, `${euiStyles}\r\n${arcadeStyles}`)
	]

	const settings = Nodes.SettingSections.at(0)
	if (settings) {
		const title = document.createElement(Elements.Span)
		title.innerText = t(i18n.colorScheme)
		themes.forEach(t => {
			let o = document.createElement(Elements.Option)
			o.value = t.code
			o.innerText = t.title
			if (t.code == 4 && ClientData.GetUserAgentData.browser == 'Safari') {
				o.toggleAttribute('disabled')
			}
			input.appendChild(o)
		})
		input.id = EUI.CustomTheme
		input.dataset.setting = EUI.CustomTheme
		const label = document.createElement(Elements.Label)
		label.classList.add(Modifiers.SettingsSectionItemClassName)
		label.appendChild(title)
		label.appendChild(input)
		settings.appendChild(label)
	}

	// PROPOSAL
	const themeProposed = localStorage.getItem(`${EUI.CustomTheme}${Proposed}`)
	if (themeProposed != 1 || !(localStorage.getItem(EUI.CustomTheme) < themes.length)) {
		localStorage.setItem(`${EUI.CustomTheme}${Proposed}`, 1)
		localStorage.setItem(EUI.CustomTheme, themes.find(t=>t.title===Themes.EUI).code)

		document.documentElement.dataset.theme = Modifiers.Auto
		let sbgSettings = getSbgSettings()

		if (sbgSettings) {
			sbgSettings.theme = Modifiers.Auto
			setSbgSettings(sbgSettings)
		}
	}

	// STYLES
	const style = document.createElement(Elements.Style)
	style.dataset.id = EUI.CustomTheme
	document.head.appendChild(style)

	const currentTheme = localStorage.getItem(EUI.CustomTheme)
	const isDynamicColors = [0, 4].includes(+currentTheme)

	function applyIngress() {
		ensureDarkTheme()
		applyTranslations(i18next_main)
	}

	function applyEnhancedUITheme() {
		const deploySliderTrack = Nodes.GetId('deploy-slider-track')
		deploySliderTrack?.after(Nodes.GetId('deploy'))
		const arrows = Nodes.GetSelector('#deploy-slider>.splide__arrows')
		arrows && arrows.remove()
		let bottom = document.createElement('div')
		bottom.id = 'bottom'
		const close = Nodes.InfoPopupClose
		const draw = Nodes.GetId('draw')
		const repair = Nodes.GetId('repair')
		const route = Nodes.GetSelector('.sbgcui_navbutton')
		const map = Nodes.GetSelector('.sbgcui_jumpToButton')
		close.after(bottom)
		bottom.appendChild(close)
		draw && close.before(draw)
		if (draw) {
			close.after(repair)
			if (route) {
				route.innerText = t(i18n.cuiRoute)
				draw.before(route)
			}
			else {
				const share = Nodes.GetId('i-share')
				share.dataset.i18n = t(i18n.sharePointButton)
				draw.before(share)
			}

			if (map) {
				map.innerText = t(i18n.cuiOnMap)
				repair.after(map)
			}
			else {
				const copyPos = Nodes.GetId('i-copy-pos')
				copyPos.dataset.i18n = t(i18n.copyPosPointButton)
				repair.after(copyPos)
			}
		}
		const invClose = Nodes.InventoryPopupClose
		if (invClose) invClose.innerText = EUI.CloseButtonText

		/* CUI Compatibility */
		if (CUI.Loaded && isDynamicColors) { 
			const owner = Nodes.GetId('i-stat__owner')
			owner?.addEventListener('pointOwnerChanged', () => {
				const buttons = Array.from(document.querySelectorAll('#bottom>button'))
				buttons.push(Nodes.Discover)
				buttons.forEach(button => {
					button.style.backgroundColor = owner.style.color === 'var(--team-0)'
						? 'var(--sbgcui-branding-color)'
						: owner.style.color
				})
			})

			Nodes.ProfilePopup.addEventListener('profilePopupOpened', () => {
				const player = Nodes.GetId('pr-name')
				const buttons = document.querySelectorAll('.profile.popup button')
				buttons.forEach(button => {
					button.style.backgroundColor = player.style.color
				})

				const headers = document.querySelectorAll('.profile.popup .pr-stats__section-header')
				headers.forEach(header => {
					header.style.color = player.style.color
				})
			})
		}
	}

	style.innerHTML = themes[+currentTheme].innerHTML
	input.selectedIndex = +currentTheme
	if ([1, 2].includes(+currentTheme)) {
		applyIngress()
	}
	else if ([0, 3, 4].includes(+currentTheme)) {
		applyEnhancedUITheme()
	}

	input.addEventListener(Events.onChange, (event) => {
		const theme = event.target.value
		if (theme == 1 || theme == 2) {
			applyIngress()
		}
		else {
			localStorage.removeItem(i18next_main)
		}
		localStorage.setItem(EUI.CustomTheme, theme)
		style.innerHTML = themes[+theme].innerHTML
		Nodes.SettingsPopupClose.click() // sync settings with cloud
		location.reload()
	})

	const cuiRefsOnMap = Nodes.GetSelector('button.sbgcui_show_viewer')
	if (cuiRefsOnMap) {
		cuiRefsOnMap.innerText = '🌍'
		cuiRefsOnMap.style.minWidth = '40px'
	}
	
	const cuiSortOrder = document.querySelector('button.sbgcui_refs-sort-button')
  if (cuiSortOrder) cuiSortOrder.style.minWidth = '40px'
}