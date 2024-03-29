import { EUI, Elements, Events, GetLocale, IsPrivate, Modifiers, Nodes, Proposed, SBG, Themes, t } from '../constants'
import monoStyles from './styles/mono.css'
import ingressStyles from './styles/ingress.css'
import primeStyles from './styles/prime.css'
import euiStyles from './styles/eui.css'

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
	const applyTranslations = (target) => {
		let tCache = JSON.parse(localStorage.getItem(target))
  
		if (!tCache) {
			return
		}
  
		tCache.buttons.discover = t('discover')
		tCache.buttons.deploy = t('deploy')
		tCache.buttons.repair = t('repair')
		tCache.buttons.draw = t('draw')
		tCache.buttons.references.manage = ''
		tCache.buttons.references.view = ''
		tCache.info.refs = '🔑 {{count}}/100'
		tCache.info.lines = t('lines')
		tCache.info.regions = t('fields')
  
		localStorage.setItem(target, JSON.stringify(tCache))
	}

	const removeControlChars = (target) => {
		let tCache = JSON.parse(localStorage.getItem(target))
  
		if (!tCache) {
			return
		}
  
		tCache.buttons.references.manage = ''
		tCache.buttons.references.view = ''
  
		localStorage.setItem(target, JSON.stringify(tCache))
	}

	const ensureDarkTheme = () => {
		const themeSelect = Nodes.GetSelector('.settings select[data-setting="theme"]')
		themeSelect.value = 'dark'
		themeSelect.dispatchEvent(new Event('change'))
		themeSelect.disabled = true
	}

	const i18next_main = `i18next_${GetLocale()}-main`
	removeControlChars(i18next_main)
	const input = document.createElement(Elements.Select)
	/** @type Theme[] */const themes = [
		new Theme(Themes.EUI, 0, euiStyles),
		new Theme(Themes.Ingress, 1, ingressStyles),
		new Theme(Themes.Prime, 2, primeStyles),
		new Theme(Themes.Mono, 3, monoStyles)
	]
	const settings = Nodes.SettingSections.at(0)
	if (settings) {
		const title = document.createElement(Elements.Span)
		title.innerText = t('colorScheme')
		themes.forEach(t => {
			let o = document.createElement(Elements.Option)
			o.value = t.code
			o.innerText = t.title
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
		let gameSettings = JSON.parse(localStorage.getItem(SBG.Settings))

		if (gameSettings) {
			gameSettings.theme = Modifiers.Auto
			localStorage.setItem(SBG.Settings, JSON.stringify(gameSettings))
		}
	}

	// STYLES
	const style = document.createElement(Elements.Style)
	style.dataset.id = EUI.CustomTheme
	document.head.appendChild(style)

	const currentTheme = localStorage.getItem(EUI.CustomTheme)
  
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
				route.innerText = t('cuiRoute')
				draw.before(route)
			}
			else {
				const share = Nodes.GetId('i-share')
				draw.before(share)
			}

			if (map) {
				map.innerText = t('cuiOnMap')
				repair.after(map)
			}
			else {
				const copyPos = Nodes.GetId('i-copy-pos')
				repair.after(copyPos)
			}
		}
		const invClose = Nodes.InventoryPopupClose
		if (invClose) invClose.innerText = EUI.CloseButtonText

		/* CUI Compatibility */
		if (window.cuiStatus) { 
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
	if (currentTheme == 1 || currentTheme == 2) {
		applyIngress()
	}
	else if (currentTheme == 0) {
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

	/* PRIVATE */
	if (IsPrivate()) {
		const cuiRefsOnMap = Nodes.GetSelector('button.sbgcui_show_viewer')
		if (cuiRefsOnMap){
			cuiRefsOnMap.innerText = '🌍'
			cuiRefsOnMap.style.minWidth = '40px'
		}
	}
}