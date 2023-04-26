// ==UserScript==
// @name         SBG Enhanced UI
// @namespace    https://3d.sytes.net/
// @version      1.5.3
// @downloadURL  https://github.com/egorantonov/sbg-enhanced/releases/latest/download/index.js
// @updateURL    https://github.com/egorantonov/sbg-enhanced/releases/latest/download/index.js
// @description  Enhanced UI for SBG
// @author       https://github.com/egorantonov
// @website      https://github.com/egorantonov/sbg-enhanced/releases
// @match        https://3d.sytes.net
// @match        https://3d.sytes.net/*
// @iconUrl      https://raw.githubusercontent.com/egorantonov/sbg-enhanced/master/assets/script/64.png
// @icon64Url    https://raw.githubusercontent.com/egorantonov/sbg-enhanced/master/assets/script/64.png
// @grant        none
// ==/UserScript==

(function() {

'use strict'

const outboundLinksLimit = 20
const defaultCloseButtonText = '[x]'
const enhancedCloseButtonText = ' ✕ '
const euiIncompatibility = 'eui-incompatibility'
const sbgVersionHeader = 'sbg-version'
const sbgCompatibleVersion = '0.2.9'
const euiVersion = '1.5.3'
const euiLinksOpacity = 'eui-links-opacity'
const euiHighContrast = 'eui-high-contrast'
const euiAnimations = 'eui-animations'
const euiSort = 'eui-sort'
const euiSearch = 'eui-search'
const discoverProgressClassName = 'discover-progress'
const onClick = 'click'
const onChange = 'change'
const onLoad = 'load'
const onInput = 'input'

const ingressTheme = 'eui-ingress-theme'
const sbgSettings = 'settings'
const defaultLang = 'en'
const auto = 'auto'
const hidden = 'hidden'

const referenceSearch = 'reference-search'

const proposed = '-proposed'

const inventoryViewButton = document.querySelector('#ops')
const inventoryPopupClose = document.querySelector('.inventory.popup #inventory__close')
const inventoryContent = document.querySelector('.inventory__content')

const settingSections = Array.from(document.querySelectorAll('.settings-section'))
const Sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// localisation
const locale = JSON.parse(localStorage.getItem(sbgSettings))?.lang ?? defaultLang
const translations = {
    incompatibility: {
        en: 'Enhanced UI may be incompatible with current version of SBG',
        ru: 'Enhanced UI может быть несовместим с текущей версией игры'
    },
    enhancedUIVersion: {
        en: 'Enhanced UI Version',
        ru: 'Версия Enhanced UI'
    },
    ingressStyle: {
        en: 'Ingress Style',
        ru: 'Стиль Ингресс'
    },
    highContrast: {
        en: 'High Contrast',
        ru: 'Высокий контраст'
    },
    linesOpacity: {
        en: 'Lines opacity',
        ru: 'Прозрачность линий'
    },
    linesOpacityMessage: {
        en: 'Enable lines layer to edit opacity',
        ru: 'Включите слой линий для редактирования прозрачности'
    },
    animations: {
        en: 'Animations',
        ru: 'Анимации'
    },
    searchRefPlaceholder: {
        en: 'Search refs',
        ru: 'Поиск рефов'
    },
    kilo: {
        en: 'k',
        ru: 'к' // TODO: update after localization released
    }
}

const t = (key) => translations[key][locale] ?? translations[key][defaultLang]

const distanceRegex = new RegExp(String.raw`(\d*\.?\d+?)\s(${t('kilo')}?)`, 'i')

// informer
const Informer = async () => {
    console.log(`SBG Enhanced UI, version ${euiVersion}`)
    const sbgCurrentVersion = await fetch('/api/', {method: 'OPTIONS'}).then(response => {
        return response.headers.get(sbgVersionHeader)
    })

    if (sbgCurrentVersion != sbgCompatibleVersion) {
        const alertShown = localStorage.getItem(euiIncompatibility)

        if (alertShown != 'true') {
            alert(`⚠️ ${t('incompatibility')} (${sbgCurrentVersion})`)
            localStorage.setItem(euiIncompatibility, true)
        }
    }
    else {
        localStorage.setItem(euiIncompatibility, false)
    }

    const about = settingSections.at(-1)
    if (!!about) {
        const key = document.createElement('span')
        key.innerText = t('enhancedUIVersion')
        const value = document.createElement('span')
        value.innerText = `v${euiVersion}`
        const item = document.createElement('div')
        item.classList.add('settings-section__item')
        item.appendChild(key)
        item.appendChild(value)
        about.appendChild(item)
    }
}

// makes close buttons look better
const BeautifyCloseButtons = async () => {
    const buttons = Array.from(document.body.querySelectorAll('button.popup-close, button#inventory__close'))
    for (let i = 0; i < buttons.length; i++) {
        if (buttons[i].innerText.toLowerCase() === defaultCloseButtonText) {
            buttons[i].innerText = enhancedCloseButtonText
            buttons[i].dataset.round = true
        }
    }

    /* CREDITS POPUP IS BEING FETCHED AS HTML */
    const creditsViewButton = document.querySelector('#settings-credits')
    creditsViewButton.addEventListener(onClick, async () => {

        let creditsPopupClose = document.querySelector('.credits.popup .popup-close')

        while (!creditsPopupClose) { // wait for SBG fetches CREDITS POPUP
            await Sleep(250)
            creditsPopupClose = document.querySelector('.credits.popup .popup-close')
        }

        if (creditsPopupClose?.dataset?.round != true) {
            creditsPopupClose.innerText = enhancedCloseButtonText
            creditsPopupClose.dataset.round = true
        }
    }, {once: true} )

    /* INVENTORY CLOSE BUTTON IS NOT POPUP-CLOSE */
    inventoryViewButton.addEventListener(onClick, async () => {

        inventoryPopupClose.innerText === 'X' && await Sleep(1000) // wait for SBG CUI modify inventory close button from 'X' to '[x]'
        inventoryPopupClose.innerText.toLowerCase() === defaultCloseButtonText && (inventoryPopupClose.dataset.round = true)
        inventoryPopupClose.innerText = enhancedCloseButtonText

    }, {once: true} )
}

const INGRESS = {
    color: 'F9FAFC',
    backgroundColor: '112025',

    selectionColor: 'FF7C2B',
    selectionBackgroundColor: '49230E',

    buttonColor: '97FBFB',
    buttonBackgroundColor: '20474C',
    buttonGlowColor: '007B85',
    buttonBorderColor: '38E8E6',

    buttonHighlightColor: 'FCD959',
    buttonHighlightBackgroundColor: '563F20',
    buttonHighlightGlowColor: 'A07F14',
    buttonHighlightBorderColor: 'DAC546',

    buttonDisabledColor: '7E888A',
    buttonDisabledBackgroundColor: '112325',
    buttonDisabledAccentColor: 'CB3C36',
}

const ingressVibes = `
@import url('https://fonts.googleapis.com/css2?family=Coda&display=swap');

/* BADGES */

img.ingress-theme {
    display: inline;
}


/* BUTTONS */

.game-menu>button, .bottomleft-container>button, body>#layers {
    font-family: 'Coda', 'Manrope', sans-serif;
}

.i-buttons>button,
.settings.popup button:not(.popup-close),
.attack-slider-buttons>button,
.draw-slider-buttons>button,
.inventory.popup button,
.layers-config__buttons>button,
.pr-buttons>button,
.sbgcui_compare_stats>button,
input:not(.sbgcui_settings-amount_input), select {
    border-style: solid;
    text-transform: uppercase;
    font-family: 'Coda', 'Manrope', sans-serif;
}

#discover, #deploy, #repair, #draw {
    position: relative;
}

#${euiSort}:disabled {
    opacity: 0.7;
}

.i-buttons>button::before,
.attack-slider-buttons>button::before,
.draw-slider-buttons>button::before {
    content: '';
    position: absolute;
    z-index: 1;
    bottom: -1px;
    right: -1px;
    height: 4px;
    width: 12px;
    border-radius: 100px 0 0 0;
    border-left: 2px solid;
    border-top: 2px solid;
}

.i-buttons>button,
.settings.popup button:not(.popup-close),
#draw-slider-close,
#attack-slider-close,
.inventory.popup button,
.layers-config__buttons>button,
.pr-buttons>button,
.sbgcui_compare_stats>button,
input:not(.sbgcui_settings-amount_input), select {
    color: #${INGRESS.buttonColor};
    background: #${INGRESS.buttonBackgroundColor};
    background: linear-gradient(to top, #${INGRESS.buttonGlowColor} 0%, #${INGRESS.buttonBackgroundColor} 30%, #${INGRESS.buttonBackgroundColor} 70%, #${INGRESS.buttonGlowColor} 100%);
    border-color: #${INGRESS.buttonBorderColor};
}

option {
    background-color: #${INGRESS.buttonBackgroundColor};
}

option:checked { /* WTF? checked is non-documented??? */
    color: #${INGRESS.buttonHighlightColor};
    background-color: #${INGRESS.buttonHighlightBackgroundColor};
}

.i-buttons>button::before,
#draw-slider-close::before,
#attack-slider-close::before {
    background-color: #${INGRESS.buttonBorderColor};
    border-color: #${INGRESS.buttonBorderColor};
    box-shadow: inset 2px 2px 0 0px #${INGRESS.buttonGlowColor};
}

#attack-slider-fire,
#draw-slider-confirm,
#inventory__ma-delete,
#layers-config__save {
    color: #${INGRESS.buttonHighlightColor};
    background: linear-gradient(to top, #${INGRESS.buttonHighlightGlowColor} 0%, #${INGRESS.buttonHighlightBackgroundColor} 30%, #${INGRESS.buttonHighlightBackgroundColor} 70%, #${INGRESS.buttonHighlightGlowColor} 100%);
    border-color: #${INGRESS.buttonHighlightBorderColor};
}

.inventory__item-controls::after {
    border-radius: 0px !important;
    box-shadow: inset 0px 0px 0px 2px #${INGRESS.buttonHighlightBorderColor};
    color: #${INGRESS.buttonHighlightColor} !important;
    background: linear-gradient(to top, #${INGRESS.buttonHighlightGlowColor} 0%, #${INGRESS.buttonHighlightBackgroundColor} 30%, #${INGRESS.buttonHighlightBackgroundColor} 70%, #${INGRESS.buttonHighlightGlowColor} 100%) !important;
}

#attack-slider-fire::before, #draw-slider-confirm::before {
    background-color: #${INGRESS.buttonHighlightBorderColor};
    border-color: #${INGRESS.buttonHighlightBorderColor};
    box-shadow: inset 2px 2px 0 0px #${INGRESS.buttonHighlightGlowColor};
}

#attack-slider-fire[disabled], #draw-slider-confirm[disabled] {
    filter: opacity(0.75);
    -webkit-backdrop-filter: blur(5px);
    backdrop-filter: blur(5px);
}

.i-buttons>button[disabled], .draw-slider-buttons>button[disabled] {
    color: #${INGRESS.buttonDisabledColor};
    background: #${INGRESS.buttonDisabledBackgroundColor};
    border-color: #${INGRESS.buttonDisabledAccentColor};
}

.i-buttons>button[disabled]::before, .draw-slider-buttons>button[disabled]::before {
    background-color: #${INGRESS.buttonDisabledAccentColor};
    border-color: #${INGRESS.buttonDisabledAccentColor};
    box-shadow: inset 2px 2px 0 0px #${INGRESS.buttonDisabledBackgroundColor};
}

.popup-close[data-round=true], #inventory__close, .splide__arrow {
    color: #${INGRESS.buttonHighlightColor};
    background: #${INGRESS.buttonHighlightBackgroundColor};
    box-shadow: inset 0px 0px 6px 3px #${INGRESS.buttonHighlightGlowColor} !important;
    border-color: #${INGRESS.buttonHighlightBorderColor} !important;
}

.splide__arrow svg {
    fill: #${INGRESS.buttonHighlightColor};
}


/* SLIDER ITEMS */

.draw-slider-wrp .splide__slide.is-active .refs-list__image>div {
    box-shadow: inset -8px 0px 0px -5px  #${INGRESS.selectionColor},
        inset -10px 0px 8px -6px  #${INGRESS.selectionBackgroundColor}77,
        inset 8px 0px 0px -5px  #${INGRESS.selectionColor},
        inset 10px 0px 8px -6px  #${INGRESS.selectionBackgroundColor}77;
}


/* INVENTORY */

.inventory__content, .inventory__tab.active {
    border-color: var(--selection);
}

.inventory__controls select,
.inventory__controls input {
    border-width: 1.6px;
}


/* POPUPS */

.profile.popup,
.info.popup,
.leaderboard.popup,
.score.popup,
.settings.popup,
.layers-config.popup,
.inventory.popup,
.credits.popup,
.inventory__manage-amount,
#draw-slider,
#attack-slider,
.attack-slider-highlevel {
    color: #${INGRESS.color};
    background-color: #${INGRESS.backgroundColor}CC;
    -webkit-backdrop-filter: blur(5px);
    backdrop-filter: blur(5px);
    border-radius: 0px;
    border-color: #${INGRESS.buttonBorderColor} !important;
}

.pr-stat:not(:last-child) {
    border-bottom: 1px #D1D1D144 solid;
}

.pr-xp-progress {
    border: none;
}

.pr-xp-check {
    background: none;
}

.layers-config__header,
.leaderboard.popup>.popup-header,
.settings.popup>h3,
.credits.popup h3 {
    text-transform: uppercase;
    font-family: 'Coda', 'Manrope', sans-serif;
}

#discover[data-time]:after {
    color: #${INGRESS.color};
}

.${discoverProgressClassName} {
    border-radius: 0px !important;
    background-color: #${INGRESS.buttonDisabledAccentColor};
}

.deploy-slider-error {
    background-color: #${INGRESS.backgroundColor}AA;
}


/* SETTINGS */

input#${euiLinksOpacity} {
    background: #${INGRESS.buttonBackgroundColor} !important;
    border-radius: 0px !important;
    border: 2px solid #${INGRESS.buttonBorderColor} !important;
}

input#${euiLinksOpacity}::-webkit-slider-thumb {
    border-radius: 0px;
    background: #${INGRESS.buttonBorderColor};
    box-shadow: -250px 0 0 250px #${INGRESS.buttonBorderColor};
}

input#${euiLinksOpacity}::-moz-range-thumb {
    border-radius: 0px;
    background: #${INGRESS.buttonBorderColor};
    box-shadow: -250px 0 0 250px #${INGRESS.buttonBorderColor};
}

/* CUI */
.sbgcui_refs-sort-button {
    border-width: revert;
    border-radius: 0;
}

`

const AddIngressVibes = () => {
    const input = document.createElement('input')
    const settings = settingSections.at(0)
    if (!!settings) {
        const title = document.createElement('span')
        title.innerText = t('ingressStyle')

        input.type = 'checkbox'
        input.dataset.setting = ingressTheme
        const label = document.createElement('label')
        label.classList.add('settings-section__item')
        label.appendChild(title)
        label.appendChild(input)
        settings.appendChild(label)

        // PROPOSAL
        const themeProposed = localStorage.getItem(`${ingressTheme}${proposed}`)
        if (themeProposed != 1) {
            localStorage.setItem(`${ingressTheme}${proposed}`, 1)
            localStorage.setItem(ingressTheme, 1)
            input.checked = true

            document.documentElement.dataset.theme = auto
            let gameSettings = JSON.parse(localStorage.getItem(sbgSettings))
            gameSettings.theme = auto
            localStorage.setItem(sbgSettings, JSON.stringify(gameSettings))
        }
    }

    // STYLES
    const style = document.createElement('style')
    style.dataset.id = ingressTheme
    style.innerHTML = ingressVibes

    if (localStorage.getItem(ingressTheme) == 1) {
        document.head.appendChild(style)
        input.checked = true
    }

    input.addEventListener(onChange, (event) => {
        if (event.target.checked) {
            document.head.appendChild(style)
            localStorage.setItem(ingressTheme, 1)
        }
        else {
            style.remove()
            localStorage.setItem(ingressTheme, 0)
        }
    })
}

const highContrast = `

/* DARK THEME */
@media (prefers-color-scheme: dark) {
    :root[data-theme="auto"] .popup,
    :root[data-theme="auto"] #draw-slider,
    :root[data-theme="auto"] #attack-slider,
    :root[data-theme="auto"] .attack-slider-highlevel {
        color: #fff;
        background: #000;
    }
}

:root[data-theme="dark"] .popup,
:root[data-theme="dark"] #draw-slider,
:root[data-theme="dark"] #attack-slider,
:root[data-theme="dark"] .attack-slider-highlevel {
    color: #fff;
    background: #000;
}

/* LIGHT THEME */
@media (prefers-color-scheme: light) {
    :root[data-theme="auto"] .popup,
    :root[data-theme="auto"] #draw-slider,
    :root[data-theme="auto"] #attack-slider,
    :root[data-theme="auto"] .attack-slider-highlevel {
        color: #000;
        background: #fff;
    }
}

:root[data-theme="light"] .popup,
:root[data-theme="light"] #draw-slider,
:root[data-theme="light"] #attack-slider,
:root[data-theme="light"] .attack-slider-highlevel {
    color: #000;
    background: #fff;
}

`

const AddHighContrast = () => {
    const input = document.createElement('input')
    const uiSettings = settingSections.at(1)
    if (!!uiSettings) {
        const title = document.createElement('span')
        title.innerText = t('highContrast')

        input.type = 'checkbox'
        input.dataset.setting = euiHighContrast
        const label = document.createElement('label')
        label.classList.add('settings-section__item')
        label.appendChild(title)
        label.appendChild(input)
        uiSettings.appendChild(label)
    }

    // STYLES
    const style = document.createElement('style')
    style.dataset.id = euiHighContrast
    style.innerHTML = highContrast

    if (localStorage.getItem(euiHighContrast) == 1) {
        document.head.appendChild(style)
        input.checked = true
    }

    input.addEventListener(onChange, (event) => {
        if (event.target.checked) {
            document.head.appendChild(style)
            localStorage.setItem(euiHighContrast, 1)
        }
        else {
            style.remove()
            localStorage.setItem(euiHighContrast, 0)
        }
    })
}

const styleString = `

/* BADGES */

img.ingress-theme {
    display: none;
}


/* POPUPS */

.popup {
    border-radius: 5px;
}


/* BUTTONS */

.game-menu > button, button#ops, .ol-control > button, #attack-menu, body>#layers {
    text-transform: uppercase;
}

.popup-close[data-round=true], #inventory__close[data-round=true] {
    box-shadow: 0 0 5px var(--shadow);
    font-weight: 600;
    border: 2px solid #777;
    border-radius: 100px;
    height: 2em;
    width: 2em;
}

.splide__arrow {
    height: 3em;
    width: 3em;
    border: 1px solid #777;
    border-radius: 100px;
    background: buttonface;
}

.splide__arrow svg {
    fill: var(--text);
}

.${discoverProgressClassName} {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    border-radius: 2px;
    background-color: #7777;
    filter: opacity(.75);
}


/* ATTACK SLIDER */

#catalysers-list > .splide__slide {
    min-width: max-content !important;
    width: 100px !important;
}


/* DEPLOY SLIDER */

#cores-list > .splide__slide {
    min-width: max-content !important;
    width: 80px !important;
}


/* DRAW LINE SLIDER */

.refs-list__image>div {
    border-radius: 5px;
}

.draw-slider-wrp .splide__slide {
    width: calc(((75% + 1em) / 2) - 1em) !important;
    max-width: 200px;
    transition: all 0.2s ease-in-out;
}

.draw-slider-wrp .splide__slide.is-active {
    transition: all 0.2s ease-in-out;
}

.draw-slider-wrp .draw-slider-buttons {
    justify-content: center;
}

.draw-slider-wrp .draw-slider-buttons button {
    padding: 6px;
    text-transform: uppercase;
}

/* POINT INFO */

#i-image {
    border-radius: 5px;
}

.i-buttons {
    order: 1;
    margin: 0.5em 0 0.5em;
    display: flex !important;
    flex-wrap: nowrap !important;
    gap: 0.25em !important;
    width: 100% !important;
    direction: unset !important;
}

.i-buttons>button {
    font-size: 0.9em;
    padding: 6px 2px;
    min-width: fit-content;
    width: calc(25% - 0.25em);
    flex-basis: unset !important;
    order: unset !important;
}

.i-buttons>button[disabled] {
    filter: opacity(.75);
}

#discover[data-time]:after {
    color: var(--text);
}

.i-stat__cores {
    margin-top: 0.5em;
}

.i-stat__core {
    border-width: 1px;
    border-radius: 100px;
    width: 1.7em;
    height: 1.7em;
    line-height: 1.7em;
}

.i-stat__core.selected {
    border-width: 2px;
}

.deploy-slider-error {
    border-radius: 5px;
}


/* SETTINGS */

input#${euiLinksOpacity} {
    -webkit-appearance: none;
    appearance: none;
    overflow: hidden;
    padding: 0;
    max-width: 100px;
    background: #7777;
    border-radius: 3px;
    border: none !important;
}

input#${euiLinksOpacity}::-webkit-slider-thumb {
    -webkit-appearance: none;
    border: 0px solid transparent;
    height: 16px;
    width: 16px;
    border-radius: 3px;
    background: var(--selection);
    box-shadow: -250px 0 0 250px var(--selection);
    cursor: pointer;
}

input#${euiLinksOpacity}::-moz-range-thumb {

    border: 0px solid transparent;
    height: 16px;
    width: 16px;
    border-radius: 3px;
    background: #${INGRESS.buttonBorderColor};
    box-shadow: -250px 0 0 250px #${INGRESS.buttonBorderColor};
    cursor: pointer;
}

/* INVENTORY */

#inventory-delete-section {
    margin-right: 0;
}

.inventory__controls select,
.inventory__controls input {
    min-width: 50px;
    width: 100%;
}

input[data-type="${referenceSearch}"] {
    padding: 0 6px;
}

/* SBG CUI Enhancements and support */

.sbgcui_xpProgressBar {
    background-color: var(--background-transp);
    border-radius: 5px;
}

#attack-menu, .topleft-container {
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none;
}

.sbgcui_no_loot, .sbgcui_no_refs {
    display: none !important;
}

.fa-classic, .fa-regular, .fa-solid, .far, .fas {
    font-family: "Font Awesome 6 Free" !important;
}

.sbgcui_refs-sort-button {
    position: static;
    height: revert;
    width: revert;
    color: revert;
    background-color: revert;
    border: 1px solid #777;
    border-radius: 2px;
    box-shadow: revert;
    min-width: 30px;
    font-size: 1em;
}

`

// adds filter styles to the canvas wrapper layers
const AddStyles = () => {
    const style = document.createElement('style')
    style.dataset.id = 'eui-common-styles'
    document.head.appendChild(style)
    style.innerHTML = styleString
}

const AddReferenceSearch = () => {

    const tabs = Array.from(document.querySelectorAll('.inventory__tab'))
    let inventoryRefs = []
    let refs = [] /* REFS CONTAINER */
    const scroll = () => inventoryContent.dispatchEvent(new Event('scroll'))

    const getRefs = () => Array.from(inventoryContent.querySelectorAll('div.inventory__item'))
    const searchRefs = (input) => {
        let searchRefs = getRefs()
        searchRefs.forEach(ref => ref.classList.remove(hidden))
        searchRefs.filter(ref => !ref.innerText
         .slice(ref.innerText.indexOf(')')+1, ref.innerText.indexOf('\n'))
         .trim()
         .toLowerCase()
         .includes(input.toLowerCase()))
         .forEach(ref => ref.classList.add(hidden))

        scroll()
    }

    const search = document.createElement('input')
    search.type = 'search'
    search.id = euiSearch
    search.dataset.type = referenceSearch
    search.placeholder = t('searchRefPlaceholder')

    const sort = document.createElement('select')
    sort.id = euiSort

    // CUI compatibility
    const cuiSort = document.querySelector('.sbgcui_refs-sort-button')
    cuiSort && (sort.style.display = 'none')

    const sorts = ['Name', 'Dist+', 'Dist-']

    sorts.forEach(s => {
        let opt = document.createElement('option')
        opt.value = s
        opt.innerText = s
        sort.appendChild(opt)
    })

    let clearButton = document.querySelector('#inventory-delete-section')
    tabs.forEach(tab => {
        tab.addEventListener(onClick, () => {
            if (['1', '2'].includes(tab.dataset.type)) {
                refs = []
                search.dataset.active = '0'
                search.remove()
                sort.selectedIndex = 0
                sort.disabled = false
                sort.remove()
            }
            else {
                refs = getRefs()
                inventoryRefs.length === 0 && (inventoryRefs = getRefs())
                clearButton.after(search)
                search.after(sort)
                cuiSort && search.after(cuiSort) // CUI compatibility
                search.dataset.active = '1'
                search.value && searchRefs(search.value)
            }
        })
    })



    inventoryPopupClose.addEventListener(onClick, () => {
        refs = []
        inventoryRefs = []
        sort.selectedIndex = 0
        sort.disabled = false
    })
    inventoryViewButton.addEventListener(onClick, async () => {

        if (search.dataset.active === '1') {

            refs = []
            while (refs.length === 0) {
                await Sleep(200) // let SBG request inventory
                refs = getRefs()
                inventoryRefs = getRefs()
            }

            search.value && searchRefs(search.value)
        }

    })

    search.addEventListener(onInput, (e) => {
        searchRefs(e.target.value)
    })

    sort.addEventListener(onChange, async (e) => {

        sort.disabled = true

        const sortType = e.target.value

        // RETURN IF DEFAULT SORTED
        if (sortType === sorts[0]) {
            refs.forEach(ref => ref.remove())
            refs = []
            inventoryRefs.forEach(ref => inventoryContent.appendChild(ref))
            search.dataset.active === '1' && search.value && searchRefs(search.value)
            sort.disabled = false
            return
        }

        refs = getRefs()

        if (refs.filter(ref => !ref.classList.contains('loaded')).length !== 0) {

            let hiddenSet = false

            while (refs.find(ref => !ref.classList.contains('loaded'))) {

                if (!hiddenSet) {
                    refs.forEach(ref => {
                        !ref.classList.contains(hidden) && ref.classList.add(hidden)
                    })

                    hiddenSet = true
                }

                scroll()

                console.log("Yet to load: " + refs.filter(ref => !ref.classList.contains('loaded')).length)
                await Sleep(250)
            }

            refs.forEach(ref => {
                ref.classList.contains(hidden) && ref.classList.remove(hidden)
            })
        }

        // ADD SORTED
        let sorted = refs.sort((a, b) => ParseMeterDistance(a) - ParseMeterDistance(b))
        sortType === sorts[2] && sorted.reverse() // REVERSE IF DESC
        sorted.forEach(ref => {
            inventoryContent.appendChild(ref)

            // CUI compatibility
            ref.classList.toggle('loading')
            ref.classList.toggle('loading')
        })

        search.dataset.active === '1' && search.value && searchRefs(search.value)
        sort.disabled = false
    })
}

const ParseMeterDistance = (ref) => {
    const [_, dist, kilo] = ref.querySelector('.inventory__item-descr')
        .lastChild.textContent
        .replace(',','')
        .match(distanceRegex)

    return kilo === t('kilo') ? dist * 1000 : +dist
}

const animationsString = `

/* ANIMATIONS */
html, body {
    overflow: hidden;
}

.info.popup, .profile.popup {
    transition: all ease-in-out 0.25s;
}

.info.popup.${hidden}, .profile.popup.${hidden} {
    display: flex !important;
    filter: opacity(0);
    transform: translateX(calc(100% + 10px));
}

@media (max-width: 425px) {
    .info.popup.${hidden}, .profile.popup.${hidden} {
        transform: translate(calc(100% + 10px), -50%);
    }
}

.inventory.popup {
    transition: all ease-in-out 0.25s;
}

.inventory.popup.${hidden} {
    display: flex !important;
    filter: opacity(0);
    transform: translate(calc(-150% - 10px), -50%);
}

.leaderboard.popup, .settings.popup {
    transition: all ease-in-out 0.25s;
}

.leaderboard.popup.${hidden}, .settings.popup.${hidden} {
    display: flex !important;
    filter: opacity(0);
    transform: translate(-50%, calc(-50vh - 100%));
}

.attack-slider-wrp {
    transition: all ease-in-out 0.25s;
}

.attack-slider-wrp.${hidden} {
    display: flex !important;
    filter: opacity(0);
    transform: translateY(calc(25vh + 100%));
}

.layers-config.popup, .score.popup {
    visibility: visible;
    transition: visibility 0s, filter ease-in-out 0.25s;
}

.layers-config.popup.${hidden}, .score.popup.${hidden} {
    display: block !important;
    filter: opacity(0);
    visibility: hidden;
}
`

const AddAnimations = () => {
    const input = document.createElement('input')
    const uiSettings = settingSections.at(1)
    if (!!uiSettings) {
        const title = document.createElement('span')
        title.innerText = t('animations')

        input.type = 'checkbox'
        input.dataset.setting = euiAnimations
        const label = document.createElement('label')
        label.classList.add('settings-section__item')
        label.appendChild(title)
        label.appendChild(input)
        uiSettings.appendChild(label)

        // PROPOSAL
        const animationsProposed = localStorage.getItem(`${euiAnimations}${proposed}`)
        if (animationsProposed != 1) {
            localStorage.setItem(`${euiAnimations}${proposed}`, 1)
            localStorage.setItem(euiAnimations, 1)
            input.checked = true
        }
    }

    // STYLES
    const style = document.createElement('style')
    style.dataset.id = euiAnimations
    style.innerHTML = animationsString

    if (localStorage.getItem(euiAnimations) == 1) {
        document.head.appendChild(style)
        input.checked = true
    }

    input.addEventListener(onChange, (event) => {
        if (event.target.checked) {
            document.head.appendChild(style)
            localStorage.setItem(euiAnimations, 1)
        }
        else {
            style.remove()
            localStorage.setItem(euiAnimations, 0)
        }
    })
}

const AddCanvasStyles = async () => {

    let item = document.createElement('div')
    item.className = 'settings-section__item'

    let title = document.createElement('span')
    title.innerText = t('linesOpacity')
    item.appendChild(title)

    let range = document.createElement('input')
    range.id = euiLinksOpacity

    range.setAttribute('type', 'range')
    range.setAttribute('min', '0')
    range.setAttribute('max', '1')
    range.setAttribute('step', '0.01')
    item.appendChild(range)

    const uiSettings = settingSections.at(1)
    uiSettings.appendChild(item)

    const value = localStorage.getItem(euiLinksOpacity)
    range.setAttribute('value', value ?? '0.75')

    let lines = document.querySelector('.ol-layer__lines')

    if (!lines) { // make sure lines layer exist (or loaded if connection is throttling)
        await Sleep(2000)
        lines = document.querySelector('.ol-layer__lines')
    }

    range.addEventListener(onChange, (event) => {
        if (!lines) { // make sure lines layer exist when user change slider
            lines = document.querySelector('.ol-layer__lines')
        }

        if (!!lines) {
            lines.style.filter = `opacity(${event.target.value})`
            localStorage.setItem(euiLinksOpacity, event.target.value)
        }
        else {
            alert(t('linesOpacityMessage'))
        }
    })

    if (!!lines) {
        lines.style.filter = `opacity(${value ?? '0.75'})`
    }
}

const asset64Prefix = 'https://raw.githubusercontent.com/egorantonov/sbg-enhanced/master/assets/64/'
const badgeMap = new Map()
badgeMap.set('Points Captured', { images: [
    {tier: 40000, value: `${asset64Prefix}liberator5-1.png` },
    {tier: 15000, value: `${asset64Prefix}liberator4-1.png` },
    {tier: 5000, value: `${asset64Prefix}liberator3.png` },
    {tier: 1000, value: `${asset64Prefix}liberator2.png` },
    {tier: 100, value: `${asset64Prefix}liberator1.png` },
]})
badgeMap.set('Lines Drawn', { images: [
    {tier: 100000, value: `${asset64Prefix}connector5-1.png` },
    {tier: 25000, value: `${asset64Prefix}connector4-1.png` },
    {tier: 5000, value: `${asset64Prefix}connector3.png` },
    {tier: 1000, value: `${asset64Prefix}connector2.png` },
    {tier: 50, value: `${asset64Prefix}connector1.png` },
]})
badgeMap.set('Unique Points Visited', { images: [
    {tier: 30000, value: `${asset64Prefix}explorer5-1.png` },
    {tier: 10000, value: `${asset64Prefix}explorer4-1.png` },
    {tier: 2000, value: `${asset64Prefix}explorer3.png` },
    {tier: 1000, value: `${asset64Prefix}explorer2.png` },
    {tier: 100, value: `${asset64Prefix}explorer1.png` },
]})
badgeMap.set('Discoveries Done', { images: [
    {tier: 200000, value: `${asset64Prefix}hacker5-1.png` },
    {tier: 100000, value: `${asset64Prefix}hacker4-1.png` },
    {tier: 30000, value: `${asset64Prefix}hacker3.png` },
    {tier: 10000, value: `${asset64Prefix}hacker2.png` },
    {tier: 2000, value: `${asset64Prefix}hacker1.png` },
]})
badgeMap.set('Points Captured', { images: [
    {tier: 20000, value: `${asset64Prefix}pioneer5-1.png` },
    {tier: 5000, value: `${asset64Prefix}pioneer4-1.png` },
    {tier: 1000, value: `${asset64Prefix}pioneer3.png` },
    {tier: 200, value: `${asset64Prefix}pioneer2.png` },
    {tier: 20, value: `${asset64Prefix}pioneer1.png` },
]})
badgeMap.set('Cores Destroyed', { images: [
    {tier: 225000, value: `${asset64Prefix}purifier5-1.png` },
    {tier: 75000, value: `${asset64Prefix}purifier4-1.png` },
    {tier: 22500, value: `${asset64Prefix}purifier3.png` },
    {tier: 7500, value: `${asset64Prefix}purifier2.png` },
    {tier: 1500, value: `${asset64Prefix}purifier1.png` },
]})
badgeMap.set('Cores Deployed', { images: [
    {tier: 150000, value: `${asset64Prefix}builder5-1.png` },
    {tier: 75000, value: `${asset64Prefix}builder4-1.png` },
    {tier: 22500, value: `${asset64Prefix}builder3.png` },
    {tier: 7500, value: `${asset64Prefix}builder2.png` },
    {tier: 1500, value: `${asset64Prefix}builder1.png` },
]})
badgeMap.set('Longest Point Ownership', { images: [
    {tier: 150, value: `${asset64Prefix}guardian5-1.png` },
    {tier: 90, value: `${asset64Prefix}guardian4-1.png` },
    {tier: 20, value: `${asset64Prefix}guardian3.png` },
    {tier: 10, value: `${asset64Prefix}guardian2.png` },
    {tier: 3, value: `${asset64Prefix}guardian1.png` },
]})

const badgeImageClass = 'badge-image'
// removes badges on close button click
const RemoveBadges = () => {
    const profilePopup = document.querySelector('.profile.popup')
    const closeButton = profilePopup.querySelector('button.popup-close')
    if (!!closeButton) {
        closeButton.addEventListener(onClick, () => {
            let previousBadges = profilePopup.querySelectorAll(`.${badgeImageClass}`)
            for (let i = 0; i < previousBadges.length; i++) {
                previousBadges[i].remove()
            }
        })
    }
}

// adds badges
const AddBadges = () => {

    const previousBadges = document.querySelectorAll(`.${badgeImageClass}`)
    for (let i = 0; i < previousBadges.length; i++) {
        previousBadges[i].remove()
    }

    const container = document.querySelector('.pr-stats')
    const stats = Array.from(document.querySelectorAll('.pr-stat'))
    for (let i = 0; i < stats.length; i++) {
        const stat = stats[i]
        const title = stat.firstChild.innerText

        if (badgeMap.has(title)) {
            const tier = +stat.lastChild.innerText.replace(/,| days| km|/g, '')

            const currentTier = badgeMap.get(title).images.find(x => x.tier <= tier)

            if (!currentTier) {
                continue
            }

            const badgeImage = document.createElement('img')
            badgeImage.className = badgeImageClass
            badgeImage.src = currentTier.value
            badgeImage.title = tier
            badgeImage.width = 40
            badgeImage.height = 40
            badgeImage.classList.add('ingress-theme')

            container.prepend(badgeImage)
        }
    }
}

const RenderBadges = () => {
    const profilePopup = document.querySelector('.profile.popup')
    if (!!profilePopup) {
        profilePopup.addEventListener(onProfileStatsChanged, () => {
            AddBadges()
        })
    }
}

const onPointStatsChanged = 'pointStatsChanged'
const InitPointStatsMutationObserver = () => {
    const target = document.querySelector('#i-stat__line-out')

    if (!target) {
        return
    }

    const config = {
        childList: true
    }

    const observer = new MutationObserver(mutationsList => {
        const event = new Event(onPointStatsChanged, { bubbles: true })
        mutationsList[0].target.dispatchEvent(event)
    })

    observer.observe(target, config)
}

// disables draw button when outbound limit is reached
const DisableDrawButton = () => {

    const infoPopup = document.querySelector('.info.popup')
    const draw = document.querySelector('#draw')
    if (!!infoPopup && !!draw) {
        infoPopup.addEventListener(onPointStatsChanged, (event) => {
            if (event.target.innerText >= outboundLinksLimit) {
                draw.setAttribute('disabled', true)
                draw.classList.add('loading')
            }
            else {
                if (draw.classList.contains('loading')) {
                     draw.classList.remove('loading')
                     draw.removeAttribute('disabled')
                }
            }
        })
    }
}

const onDiscoverChanged = 'discoverChanged'
const InitDiscoverMutationObserver = () => {
    const target = document.querySelector('#discover')

    if (!target) {
        return
    }

    const config = {
        attributes: true,
        attributeFilter: ['data-time']
    }

    const observer = new MutationObserver(mutationsList => {
        const event = new Event(onDiscoverChanged, { bubbles: true })
        mutationsList[0].target.dispatchEvent(event)
    })

    observer.observe(target, config)
}

const AddDiscoverProgress = () => {
    const infoPopup = document.querySelector('.info.popup')
    const discover = document.querySelector('#discover')
    if (!!infoPopup && !!discover) {
        const discoverProgress = document.createElement('div')
        discoverProgress.className = discoverProgressClassName
        discover.appendChild(discoverProgress)

        infoPopup.addEventListener(onDiscoverChanged, (event) => {
            let dataTimeString = event.target.dataset?.time

            if (!dataTimeString) {
                discoverProgress.style.width = 0
            }
            else if (dataTimeString.replace('s','') > 0){
                discoverProgress.style.width = `${100*dataTimeString.replace('s','')/60}%`
            }
            else if (dataTimeString.replace('m','') > 0) {
                discoverProgress.style.width = '100%'
            }
            else {
                discoverProgress.style.width = 0
            }
        })
    }
}

const onProfileStatsChanged = 'profileStatsChanged'
const InitProfileStatsMutationObserver = () => {
    const target = document.querySelector('.pr-stats')

    if (!target) {
        return
    }

    const config = {
        childList: true
    }

    const observer = new MutationObserver(mutationsList => {
        if (mutationsList.find(x => x.addedNodes.length && x.addedNodes[0].classList.contains('pr-stats__section'))) {
            const event = new Event(onProfileStatsChanged, { bubbles: true })
            mutationsList[0].target.dispatchEvent(event)
        }
    });

    observer.observe(target, config)
}

const InitObservers = () => {
    InitPointStatsMutationObserver()
    InitProfileStatsMutationObserver()
    InitDiscoverMutationObserver()
}

window.addEventListener(onLoad, function () {
    Sleep(1500)
    .then(() => {
        AddStyles()
        AddHighContrast()
        AddAnimations()
        AddIngressVibes()
        InitObservers()
        DisableDrawButton()
        RemoveBadges()
        AddDiscoverProgress()
        RenderBadges()
        AddReferenceSearch()
    })
}, false)

window.addEventListener(onLoad, async function () {
    await Sleep(1600) // sleep for for a while to make sure SBG is loaded
    await Promise.all([Informer(), AddCanvasStyles(), BeautifyCloseButtons()])
}, false)

})()