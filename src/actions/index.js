/* eslint-disable @typescript-eslint/no-unused-vars */
import { Elements, Events, EUI, Modifiers, Nodes, t } from '../constants'
import { showToast } from '../utils'

let intervalId
const notificationsLimit = 5
const x = 'x'

/**
 * Returns inview points from localStorage
 * @returns {InviewPoint[]} Inview points
 */
function getCurrent() {
	return JSON.parse(localStorage.getItem(EUI.ActionsCurrent) ?? '[]')
}

const setCurrent = (/** @type InviewPoint[] */data) => localStorage.setItem(EUI.ActionsCurrent, JSON.stringify(data))

const TEAMS = {
	None: 0,
	Red: 1,
	Green: 2,
	Blue: 3
}

const interval = 5 * 60e3
const TEAM_COLORS = ['⚪','🔴','🟢','🔵']

function setCustomFetch() {

	function ApplyActionReplacer() {
		let nodes = Array.from(document.querySelectorAll(`div.notifs__entry[data-id="${x}"]`))

		// fix for latestId
		let [capture, neutralize] = document.querySelectorAll(`div.notifs__entry[data-id="${localStorage['latest-notif'] ?? 0}"]`)
		if (neutralize) {
			nodes.push(capture)
		}

		for (let i = 0; i < nodes.length; i++) {
			let node = nodes[i]
			let secondRow = node.childNodes[2]
			let toReplace = secondRow.childNodes[0].textContent
			secondRow.childNodes[0].textContent = secondRow.childNodes[1].innerText
				? toReplace.replace(t('actionsNeutralized'), t('actionsCapturedReplacer'))
				: toReplace.replace('by', '')
		}
	}
	const { fetch: originalFetch } = window

	window.fetch = async (...args) => {
		let [resource, config] = args

		const response = await originalFetch(resource, config)

		if (localStorage.getItem(EUI.Actions) == 1 && resource.includes('/api/notifs') && !resource.includes('?latest')) {
			const enrichedResponse = response.clone().json().then(data => {
				let actions = JSON.parse(localStorage.getItem(EUI.ActionsLog) ?? '[]')
				const latestId = data.list[0].id
				for (let i = 0; i < actions.length; i++) {
					data.list.push({
						na: actions[i].o == 'n/a' ? '' : actions[i].o,
						c: actions[i].c,
						g: actions[i].g,
						id: x, // id: data.list[0].id - 1,
						t: actions[i].t,
						ta: actions[i].te,
						ti: new Date(actions[i].timestamp).toISOString()
					})
				}
				data.list.sort((a,b) => Date.parse(b.ti) - Date.parse(a.ti))
				data.list[0].id = latestId
				return data
			})

			response.json = () => enrichedResponse
			setTimeout(() => {
				ApplyActionReplacer()
			}, 50)
		}

		return response
	}

}

/**
 * Actions Feature
 */
export async function Actions() {

	if (!['0','1'].includes(localStorage.getItem(EUI.Actions))) {
		localStorage.setItem(EUI.Actions, 1)
	}

	const input = document.createElement(Elements.Input)
	const global = Nodes.SettingSections.at(0)
	if (global) {
		const title = document.createElement(Elements.Span)
		title.innerText = t('actions')
		input.type = Elements.CheckBox
		input.dataset.setting = EUI.Actions
		const label = document.createElement(Elements.Label) 
		label.classList.add(Modifiers.SettingsSectionItemClassName)
		label.appendChild(title)
		label.appendChild(input)
		global.appendChild(label)
	}

	const checked = localStorage.getItem(EUI.Actions) == 1
	const notifsHeader = Nodes.GetSelector('.notifs>.popup-header')

	function NetworkInterval() {
		intervalId = setTimeout(() => {
			GetLocAndInview()
			NetworkInterval()
		}, interval)
	}

	if (checked && Nodes.Settings) {
		notifsHeader.textContent += `/${t('actions')}`
		GetLocAndInview();
		(NetworkInterval)()
	}

	input.checked = checked
	input.addEventListener(Events.onChange, (event) => {
		if (event.target.checked) {
			notifsHeader.textContent += `/${t('actions')}`
			localStorage.setItem(EUI.Actions, 1)
			if (!intervalId) {
				GetLocAndInview();
				(NetworkInterval)()
			}
		}
		else {
			notifsHeader.textContent = notifsHeader.textContent.replace(`/${t('actions')}`, '')
			localStorage.setItem(EUI.Actions, 0)
			clearInterval(intervalId)
			intervalId = 0
		}
	})
	setCustomFetch()
}

class Point {
	c = [0,0]
	l = 1
	g = ''
	t = ''
	te = TEAMS.None
	o = 'n/a'
}

class InviewPoint {
	c = [0,0]
	e = 0
	t = TEAMS.None
}

async function computeDiff (saved, fresh) {
	const limit = 5000
	const logLimit = 200
	let map = new Map(saved.map(item => [item.g, item]))
	let diff = []

	fresh.forEach(item => {
		let existing = map.get(item.g)
		if (!existing) {
			saved.push(item)
			map.set(item.g, item)
		}
		else if (existing.t !== item.t) {
			diff.push(item)
			existing.t = item.t
		}
	})

	if (saved.length > limit) {
		saved.splice(0, saved.length - limit)
	}

	setCurrent(saved)
	if (!diff.length) {
		return
	}

	const diffLengthMessage = `${t('actionsDiffMessage')}${diff.length}`
	console.log(diffLengthMessage)
	showToast(diffLengthMessage, 'top left')

	const log = JSON.parse(localStorage.getItem(EUI.ActionsLog) ?? '[]')

	const timestamp = Date.now()
	for (let i = 0; i < diff.length; i++) {
		const item = diff[i]
		/** @type Point */const point = await fetch(`/api/point?guid=${item.g}`, {
			method: 'GET', 
			headers: {
				authorization: `Bearer ${localStorage.auth}`,
				['Content-Type']: 'application/json'
			}})
			.then(r => r.json())
			.then(json => json?.data)

		const diffMessageConsole = point.te === 0 
			? `${point.t}${t('actionsNeutralizedMessage')}`
			: `${point.t}${t('actionsCapturedMessage')}${TEAM_COLORS[point.te]}${point.o}`

		const diffMessage = point.te === 0 
			? `${point.t}<br/>${t('actionsNeutralizedMessage')}`
			: `<span style="color: var(--team-${point.te}); font-weight: bold">${point.o}</span><br/>${point.t}`

		log.push({timestamp, ...point})
		console.log(diffMessageConsole)
		if (i < notificationsLimit) { 
			showToast(diffMessage, 'top left')
		}
	}

	if (log.length > logLimit) {
		log.splice(0, log.length - logLimit)
	}
	localStorage.setItem(EUI.ActionsLog, JSON.stringify(log))
}

async function GetInview(lat, lon) {
	const proj = window.ol.proj
	const p = 'EPSG:3857'
	const radius = 2500
	const zoom = 15
	const initialPoint = proj.fromLonLat([lon,lat])
	const [w,s] = proj.toLonLat(proj.transform([initialPoint[0]-radius,initialPoint[1]-radius],p,p))
	const [e,n] = proj.toLonLat(proj.transform([initialPoint[0]+radius,initialPoint[1]+radius],p,p))

	const url = `/api/inview?sw=${w},${s}&ne=${e},${n}&z=${zoom}&l=1&h=4`
	const config = {
		method: 'GET', 
		headers: {
			authorization: `Bearer ${localStorage.auth}`,
			['Content-Type']: 'application/json'
		}
	}

	/** @type InviewPoint[] */ const points = await fetch(url, config)
		.then(r => r.json())
		.then(json => {
			console.log(`${new Date().toLocaleTimeString()} [Actions] Inview returned ${json.p.length} points`)
			return json.p
		})

	let current = getCurrent()
	if (!current?.length) {
		setCurrent(points)
	}
	else if (points?.length) {
		computeDiff(current, points)
	}
}

export function GetLocAndInview() {

	if (localStorage.getItem(EUI.Actions) != 1) return

	function success(position) {
		const lat = position.coords.latitude
		const lon = position.coords.longitude

		console.log(`${lat} : ${lon}`)

		GetInview(lat, lon)
	}

	function error() {
		const fallback = document.getElementById('self-info__coord')
		if (fallback?.innerText) {
			const [lat, lon] = fallback.innerText.split(', ')
			GetInview(lat, lon)
			return
		}

		const message = 'Sorry, no position available.'
		console.log(message)
	}

	const options = {
		enableHighAccuracy: true,
		maximumAge: interval - 1,
		timeout: 5e3, 
	}

	//geoId = navigator.geolocation.watchPosition(success, error, options);
	navigator.geolocation.getCurrentPosition(success, error, options)
}