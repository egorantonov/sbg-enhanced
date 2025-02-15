export function getSbgSettings() {
	return JSON.parse(localStorage.getItem('settings'))
}

export function setSbgSettings(settings) {
	localStorage.setItem('settings', JSON.stringify(settings))
}

export function createToast(text = '', layout = 'bottom center', duration = 3000, className = 'interaction-toast') {
	if (!window.Toastify) return
	const [gravity, position] = layout.split(/\s+/)
	const toast = window.Toastify({
		text: text.toString(),
		duration,
		gravity,
		position,
		escapeMarkup: false,
		className
	})
	toast.options.onClick = () => toast.hideToast()
	return toast
}

export function showToast(text = '', layout = 'bottom center', duration = 3000, className = 'interaction-toast') {
	if (!window.Toastify) return
	createToast(text.toString(), layout, duration, className).showToast()
}

export const Logger = {
	log: (message) => console.log(`[EUI] ${message}`),
	error: (message, ...optionalParams) => console.error(`[EUI] ${message}`, optionalParams),
	debug: (message, ...optionalParams) => window?.__eui_debug && console.warn(`[Debug] ${message}`, optionalParams)
}

window.EUI = {
	...window.EUI,
	createToast,
	showToast
}

/**
 * Disabled due to CUI compatibility error
 * @returns Browser's native fetch()
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getNativeFetch() {
	if (!window._nativeFetch) {
		const iframe = document.createElement('iframe')

		iframe.style.display = 'none'
		document.body.appendChild(iframe) // add element

		window._nativeFetch = iframe.contentWindow.fetch
	}

	return window._nativeFetch
}

/* export const nativeFetch = getNativeFetch() */