// ==UserScript==
// @name         SBG Enhanced UI
// @namespace    https://3d.sytes.net/
// @version      1.6.0
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

// SBG Constants
const OutboundLinksLimit = 20
const DefaultCloseButtonText = '[x]'
const SbgVersionHeader = 'sbg-version'
const SbgCompatibleVersion = '0.2.9'
const SbgSettings = 'settings'
const DefaultLang = 'en'

// EUI Constants
const EuiCloseButtonText = ' ✕ '
const EuiIncompatibility = 'eui-incompatibility'
const EuiVersion = '1.6.0'
const EuiLinksOpacity = 'eui-links-opacity'
const EuiHighContrast = 'eui-high-contrast'
const EuiAnimations = 'eui-animations'
const EuiSort = 'eui-sort'
const EuiSearch = 'eui-search'
const EuiIngressTheme = 'eui-ingress-theme'

// Events
const onClick = 'click'
const onChange = 'change'
const onLoad = 'load'
const onInput = 'input'

// Classes and attributes
const Auto = 'auto'
const Hidden = 'hidden'
const Disabled = 'disabled'
const Loading = 'loading'
const Loaded = 'loaded'
const ReferenceSearch = 'reference-search'
const DiscoverProgressClassName = 'discover-progress'
const SettingsSectionItemClassName = 'settings-section__item'

const Elements = {
    Input: 'input',
    Span: 'span',
    Div: 'div',
    Label: 'label',
    Style: 'style',
    CheckBox: 'checkbox'
}

const Proposed = '-proposed'

const InfoPopup = document.querySelector('.info.popup')
const Discover = document.getElementById('discover')

const ProfilePopup = document.querySelector('.profile.popup')
const ProfileStats = ProfilePopup?.querySelector('.pr-stats')

const Ops = document.getElementById('ops')
const InventoryPopupClose = document.getElementById('inventory__close')
const InventoryContent = document.querySelector('.inventory__content')

const SettingSections = Array.from(document.querySelectorAll('.settings-section'))
const Sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// localisation
const Locale = JSON.parse(localStorage.getItem(SbgSettings))?.lang ?? DefaultLang
const Translations = {
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

const t = (key) => Translations[key][Locale] ?? Translations[key][DefaultLang]

// informer
const Informer = async () => {
    console.log(`SBG Enhanced UI, version ${EuiVersion}`)
    const sbgCurrentVersion = await fetch('/api/', {method: 'OPTIONS'})
        .then(response => response.headers.get(SbgVersionHeader))

    if (sbgCurrentVersion != SbgCompatibleVersion) {
        const alertShown = localStorage.getItem(EuiIncompatibility)

        if (alertShown != 'true') {
            alert(`⚠️ ${t('incompatibility')} (${sbgCurrentVersion})`)
            localStorage.setItem(EuiIncompatibility, true)
        }
    }
    else {
        localStorage.setItem(EuiIncompatibility, false)
    }

    const about = SettingSections.at(-1)
    if (!!about) {
        const key = document.createElement(Elements.Span)
        key.innerText = t('enhancedUIVersion')
        const value = document.createElement(Elements.Span)
        value.innerText = `v${EuiVersion}`
        const item = document.createElement(Elements.Div)
        item.classList.add(SettingsSectionItemClassName)
        item.appendChild(key)
        item.appendChild(value)
        about.appendChild(item)
    }
}

// makes close buttons look better
const BeautifyCloseButtons = async () => {
    const beautifyButton = (button) => {
        button.innerText = EuiCloseButtonText
        button.dataset.round = true
    }

    Array.from(document.body.querySelectorAll('button.popup-close, button#inventory__close')).forEach(button => {
        button.innerText.toLowerCase() === DefaultCloseButtonText && beautifyButton(button)
    })

    /* CREDITS POPUP IS BEING FETCHED AS HTML */
    const creditsViewButton = document.getElementById('settings-credits')
    creditsViewButton?.addEventListener(onClick, async () => {

        let creditsPopupClose = document.querySelector('.credits.popup .popup-close')

        while (!creditsPopupClose) { // wait for SBG fetches CREDITS POPUP
            await Sleep(250)
            creditsPopupClose = document.querySelector('.credits.popup .popup-close')
        }

        creditsPopupClose?.dataset?.round != true && beautifyButton(creditsPopupClose)
    }, {once: true} )

    /* INVENTORY CLOSE BUTTON IS NOT POPUP-CLOSE */
    Ops?.addEventListener(onClick, async () => {

        InventoryPopupClose.innerText === 'X' && await Sleep(1000) // wait for SBG CUI modify inventory close button from 'X' to '[x]'
        InventoryPopupClose.innerText.toLowerCase() === DefaultCloseButtonText && (InventoryPopupClose.dataset.round = true)
        InventoryPopupClose.innerText = EuiCloseButtonText

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

img.${EuiIngressTheme} {
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
#classic-login,
#form__buttons-login,
.sbgcui_compare_stats>button,
input:not(.sbgcui_settings-amount_input), 
select {
    border-style: solid;
    text-transform: uppercase;
    font-family: 'Coda', 'Manrope', sans-serif;
}

#discover, #deploy, #repair, #draw {
    position: relative;
}

#${EuiSort}:${Disabled} {
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
#layers-config__save,
#classic-login,
#form__buttons-login {
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

#attack-slider-fire[${Disabled}], #draw-slider-confirm[${Disabled}] {
    filter: opacity(0.75);
    -webkit-backdrop-filter: blur(5px);
    backdrop-filter: blur(5px);
}

.i-buttons>button[${Disabled}], .draw-slider-buttons>button[${Disabled}] {
    color: #${INGRESS.buttonDisabledColor};
    background: #${INGRESS.buttonDisabledBackgroundColor};
    border-color: #${INGRESS.buttonDisabledAccentColor};
}

.i-buttons>button[${Disabled}]::before, .draw-slider-buttons>button[${Disabled}]::before {
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

.${DiscoverProgressClassName} {
    border-radius: 0px !important;
    background-color: #${INGRESS.buttonDisabledAccentColor};
}

.deploy-slider-error {
    background-color: #${INGRESS.backgroundColor}AA;
}


/* SETTINGS */

input#${EuiLinksOpacity} {
    background: #${INGRESS.buttonBackgroundColor} !important;
    border-radius: 0px !important;
    border: 2px solid #${INGRESS.buttonBorderColor} !important;
}

input#${EuiLinksOpacity}::-webkit-slider-thumb {
    border-radius: 0px;
    background: #${INGRESS.buttonBorderColor};
    box-shadow: -250px 0 0 250px #${INGRESS.buttonBorderColor};
}

input#${EuiLinksOpacity}::-moz-range-thumb {
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
    const input = document.createElement(Elements.Input)
    const settings = SettingSections.at(0)
    if (!!settings) {
        const title = document.createElement(Elements.Span)
        title.innerText = t('ingressStyle')

        input.type = Elements.CheckBox
        input.dataset.setting = EuiIngressTheme
        const label = document.createElement(Elements.Label)
        label.classList.add(SettingsSectionItemClassName)
        label.appendChild(title)
        label.appendChild(input)
        settings.appendChild(label)
    }

    // PROPOSAL
    const themeProposed = localStorage.getItem(`${EuiIngressTheme}${Proposed}`)
    if (themeProposed != 1) {
        localStorage.setItem(`${EuiIngressTheme}${Proposed}`, 1)
        localStorage.setItem(EuiIngressTheme, 1)
        input.checked = true
        document.documentElement.dataset.theme = Auto
        let gameSettings = JSON.parse(localStorage.getItem(SbgSettings))

        if (gameSettings) {
            gameSettings.theme = Auto
            localStorage.setItem(SbgSettings, JSON.stringify(gameSettings))
        }
    }

    // STYLES
    const style = document.createElement(Elements.Style)
    style.dataset.id = EuiIngressTheme
    style.innerHTML = ingressVibes

    if (localStorage.getItem(EuiIngressTheme) == 1) {
        document.head.appendChild(style)
        input.checked = true
    }

    input.addEventListener(onChange, (event) => {
        if (event.target.checked) {
            document.head.appendChild(style)
            localStorage.setItem(EuiIngressTheme, 1)
        }
        else {
            style.remove()
            localStorage.setItem(EuiIngressTheme, 0)
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
    const input = document.createElement(Elements.Input)
    const uiSettings = SettingSections.at(1)
    if (!!uiSettings) {
        const title = document.createElement(Elements.Span)
        title.innerText = t('highContrast')

        input.type = Elements.CheckBox
        input.dataset.setting = EuiHighContrast
        const label = document.createElement(Elements.Label)
        label.classList.add(SettingsSectionItemClassName)
        label.appendChild(title)
        label.appendChild(input)
        uiSettings.appendChild(label)
    }

    // STYLES
    const style = document.createElement(Elements.Style)
    style.dataset.id = EuiHighContrast
    style.innerHTML = highContrast

    if (localStorage.getItem(EuiHighContrast) == 1) {
        document.head.appendChild(style)
        input.checked = true
    }

    input.addEventListener(onChange, (event) => {
        if (event.target.checked) {
            document.head.appendChild(style)
            localStorage.setItem(EuiHighContrast, 1)
        }
        else {
            style.remove()
            localStorage.setItem(EuiHighContrast, 0)
        }
    })
}

const styleString = `

/* BADGES */

img.${EuiIngressTheme} {
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

#discover:not([data-time]) .${DiscoverProgressClassName},
.info.popup.hidden .${DiscoverProgressClassName} {
    display: none;
}

.${DiscoverProgressClassName} {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    border-radius: 2px;
    background-color: #7777;
    filter: opacity(.75);
    transition: width 1s linear;
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

.i-buttons>button[${Disabled}] {
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

input#${EuiLinksOpacity} {
    -webkit-appearance: none;
    appearance: none;
    overflow: hidden;
    padding: 0;
    max-width: 100px;
    background: #7777;
    border-radius: 3px;
    border: none !important;
}

input#${EuiLinksOpacity}::-webkit-slider-thumb {
    -webkit-appearance: none;
    border: 0px solid transparent;
    height: 16px;
    width: 16px;
    border-radius: 3px;
    background: var(--selection);
    box-shadow: -250px 0 0 250px var(--selection);
    cursor: pointer;
}

input#${EuiLinksOpacity}::-moz-range-thumb {

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

input[data-type="${ReferenceSearch}"] {
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
    const style = document.createElement(Elements.Style)
    style.dataset.id = 'eui-common-styles'
    document.head.appendChild(style)
    style.innerHTML = styleString
}

const AddReferenceSearch = () => {

    const tabs = Array.from(document.querySelectorAll('.inventory__tab'))
    let inventoryRefs = []
    let refs = [] /* REFS CONTAINER */
    const scroll = () => InventoryContent.dispatchEvent(new Event('scroll'))

    const getRefs = () => Array.from(InventoryContent.querySelectorAll('div.inventory__item'))
    const searchRefs = (input) => {
        let searchRefs = getRefs()
        searchRefs.forEach(ref => ref.classList.remove(Hidden))
        searchRefs.filter(ref => !ref.innerText
         .slice(ref.innerText.indexOf(')')+1, ref.innerText.indexOf('\n'))
         .trim()
         .toLowerCase()
         .includes(input.toLowerCase()))
         .forEach(ref => ref.classList.add(Hidden))

        scroll()
    }

    const search = document.createElement(Elements.Input)
    search.type = 'search'
    search.id = EuiSearch
    search.dataset.type = ReferenceSearch
    search.placeholder = t('searchRefPlaceholder')

    const sort = document.createElement('select')
    sort.id = EuiSort

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

    let clearButton = document.getElementById('inventory-delete-section')
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



    InventoryPopupClose?.addEventListener(onClick, () => {
        refs = []
        inventoryRefs = []
        sort.selectedIndex = 0
        sort.disabled = false
    })
    Ops?.addEventListener(onClick, async () => {

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
            inventoryRefs.forEach(ref => InventoryContent.appendChild(ref))
            search.dataset.active === '1' && search.value && searchRefs(search.value)
            sort.disabled = false
            return
        }

        refs = getRefs()

        if (refs.filter(ref => !ref.classList.contains(Loaded)).length !== 0) {

            let hiddenSet = false

            while (refs.find(ref => !ref.classList.contains(Loaded))) {

                if (!hiddenSet) {
                    refs.forEach(ref => {
                        !ref.classList.contains(Hidden) && ref.classList.add(Hidden)
                    })

                    hiddenSet = true
                }

                scroll()

                console.log("Yet to load: " + refs.filter(ref => !ref.classList.contains(Loaded)).length)
                await Sleep(250)
            }

            refs.forEach(ref => {
                ref.classList.contains(Hidden) && ref.classList.remove(Hidden)
            })
        }

        // ADD SORTED
        let sorted = refs.sort((a, b) => ParseMeterDistance(a) - ParseMeterDistance(b))
        sortType === sorts[2] && sorted.reverse() // REVERSE IF DESC
        sorted.forEach(ref => {
            InventoryContent.appendChild(ref)

            // CUI compatibility
            ref.classList.toggle(Loading)
            ref.classList.toggle(Loading)
        })

        search.dataset.active === '1' && search.value && searchRefs(search.value)
        sort.disabled = false
    })
}

const DistanceRegex = new RegExp(String.raw`(\d*\.?\d+?)\s(${t('kilo')}?)`, 'i')
const ParseMeterDistance = (ref) => {
    const [_, dist, kilo] = ref.querySelector('.inventory__item-descr')
        .lastChild.textContent
        .replace(',','')
        .match(DistanceRegex)

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

.info.popup.${Hidden}, .profile.popup.${Hidden} {
    display: flex !important;
    filter: opacity(0);
    transform: translateX(calc(100% + 10px));
}

@media (max-width: 425px) {
    .info.popup.${Hidden}, .profile.popup.${Hidden} {
        transform: translate(calc(100% + 10px), -50%);
    }
}

.inventory.popup {
    transition: all ease-in-out 0.25s;
}

.inventory.popup.${Hidden} {
    display: flex !important;
    filter: opacity(0);
    transform: translate(calc(-150% - 10px), -50%);
}

.leaderboard.popup, .settings.popup {
    transition: all ease-in-out 0.25s;
}

.leaderboard.popup.${Hidden}, .settings.popup.${Hidden} {
    display: flex !important;
    filter: opacity(0);
    transform: translate(-50%, calc(-50vh - 100%));
}

.attack-slider-wrp {
    transition: all ease-in-out 0.25s;
}

.attack-slider-wrp.${Hidden} {
    display: flex !important;
    filter: opacity(0);
    transform: translateY(calc(25vh + 100%));
}

.layers-config.popup, .score.popup {
    visibility: visible;
    transition: visibility 0s, filter ease-in-out 0.25s;
}

.layers-config.popup.${Hidden}, .score.popup.${Hidden} {
    display: block !important;
    filter: opacity(0);
    visibility: hidden;
}
`

const AddAnimations = () => {
    const input = document.createElement(Elements.Input)
    const uiSettings = SettingSections.at(1)
    if (!!uiSettings) {
        const title = document.createElement(Elements.Span)
        title.innerText = t('animations')

        input.type = Elements.CheckBox
        input.dataset.setting = EuiAnimations
        const label = document.createElement(Elements.Label)
        label.classList.add(SettingsSectionItemClassName)
        label.appendChild(title)
        label.appendChild(input)
        uiSettings.appendChild(label)

        // PROPOSAL
        const animationsProposed = localStorage.getItem(`${EuiAnimations}${Proposed}`)
        if (animationsProposed != 1) {
            localStorage.setItem(`${EuiAnimations}${Proposed}`, 1)
            localStorage.setItem(EuiAnimations, 1)
            input.checked = true
        }
    }

    // STYLES
    const style = document.createElement(Elements.Style)
    style.dataset.id = EuiAnimations
    style.innerHTML = animationsString

    if (localStorage.getItem(EuiAnimations) == 1) {
        document.head.appendChild(style)
        input.checked = true
    }

    input.addEventListener(onChange, (event) => {
        if (event.target.checked) {
            document.head.appendChild(style)
            localStorage.setItem(EuiAnimations, 1)
        }
        else {
            style.remove()
            localStorage.setItem(EuiAnimations, 0)
        }
    })
}

const AddCanvasStyles = async () => {
    const getLines = () => document.querySelector('.ol-layer__lines')
    const DefaultOpacityLevel = '0.75'

    let item = document.createElement(Elements.Div)
    item.className = SettingsSectionItemClassName

    let title = document.createElement(Elements.Span)
    title.innerText = t('linesOpacity')
    item.appendChild(title)

    let range = document.createElement(Elements.Input)
    range.id = EuiLinksOpacity

    range.setAttribute('type', 'range')
    range.setAttribute('min', '0')
    range.setAttribute('max', '1')
    range.setAttribute('step', '0.01')
    item.appendChild(range)

    const uiSettings = SettingSections.at(1)
    uiSettings?.appendChild(item)

    const value = localStorage.getItem(EuiLinksOpacity)
    range.setAttribute('value', value ?? DefaultOpacityLevel)

    let lines = getLines()

    if (!lines) { // make sure lines layer exist (or loaded if connection is throttling)
        await Sleep(2000)
        lines = getLines()
    }

    range.addEventListener(onChange, (event) => {
        if (!lines) { // make sure lines layer exist when user change slider
            lines = getLines()
        }

        if (!!lines) {
            lines.style.filter = `opacity(${event.target.value})`
            localStorage.setItem(EuiLinksOpacity, event.target.value)
        }
        else {
            alert(t('linesOpacityMessage'))
        }
    })

    if (!!lines) {
        lines.style.filter = `opacity(${value ?? DefaultOpacityLevel})`
    }
}

const asset64Prefix = 'https://raw.githubusercontent.com/egorantonov/sbg-enhanced/master/assets/64/'
const badgeMap = new Map()

const createImages = (tiers, badge) => {
    let images = []
    for (let i = tiers.length; i > 0; i--) {
        images.push({tier: tiers[tiers.length-i], value: `${asset64Prefix}${badge}${i}.png` })
    }
    return images
}

badgeMap.set('Points Captured', { images: createImages([40000,15000,5000,1000,100], 'liberator') })
badgeMap.set('Lines Drawn', { images: createImages([100000,25000,5000,1000,50], 'connector') })
badgeMap.set('Unique Points Visited', { images: createImages([30000,10000,2000,1000,100], 'explorer') })
badgeMap.set('Discoveries Done', { images: createImages([200000,100000,30000,10000,2000], 'hacker') })
badgeMap.set('Points Captured', { images: createImages([20000,5000,1000,200,20], 'pioneer') })
badgeMap.set('Cores Destroyed', { images: createImages([225000,75000,22500,7500,1500], 'purifier') })
badgeMap.set('Cores Deployed', { images: createImages([150000,75000,22500,7500,1500], 'builder') })
badgeMap.set('Longest Point Ownership', { images: createImages([150,90,20,10,3], 'guardian') })

const badgeImageClass = 'badge-image'
// removes badges on close button click
const RemoveBadges = () => {
    const closeButton = ProfilePopup?.querySelector('button.popup-close')
    closeButton?.addEventListener(onClick, () => {
        let previousBadges = ProfilePopup.querySelectorAll(`.${badgeImageClass}`)
        for (let i = 0; i < previousBadges.length; i++) {
            previousBadges[i].remove()
        }
    })
}

// adds badges
const AddBadges = () => {

    const previousBadges = document.querySelectorAll(`.${badgeImageClass}`)
    for (let i = 0; i < previousBadges.length; i++) {
        previousBadges[i].remove()
    }

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
            badgeImage.classList.add(EuiIngressTheme)

            ProfileStats?.prepend(badgeImage)
        }
    }
}

const InitObserver = ({target, config, callback}) => target && config && callback && new MutationObserver(callback).observe(target, config)

const onPointStatsChanged = 'pointStatsChanged'
const PointStatsChanged = {
    target: document.getElementById('i-stat__line-out'),
    config: { childList: true },
    callback: (mutationsList) => {
        const event = new Event(onPointStatsChanged, { bubbles: true })
        mutationsList[0].target.dispatchEvent(event)
    }
}

// disables draw button when outbound limit is reached
const DisableDrawButton = () => {

    const draw = document.getElementById('draw')
    if (!!InfoPopup && !!draw) {
        InfoPopup.addEventListener(onPointStatsChanged, (event) => {
            if (event.target.innerText >= OutboundLinksLimit) {
                draw.setAttribute(Disabled, true)
                draw.classList.add(Loading)
            }
            else {
                if (draw.classList.contains(Loading)) {
                    draw.classList.remove(Loading)
                    draw.removeAttribute(Disabled)
                }
            }
        })
    }
}

const onDiscoverChanged = 'discoverChanged'
const DiscoverChanged = {
    target: Discover,
    config: {
        attributes: true,
        attributeFilter: ['data-time']
    },
    callback: (mutationsList) => {
        const event = new Event(onDiscoverChanged, { bubbles: true })
        mutationsList[0].target.dispatchEvent(event)
    }
}

const AddDiscoverProgress = () => {

    if (!!InfoPopup && !!Discover) {
        const discoverProgress = document.createElement(Elements.Div)
        discoverProgress.className = DiscoverProgressClassName
        Discover.appendChild(discoverProgress)

        InfoPopup.addEventListener(onDiscoverChanged, (event) => {
            let dataTimeString = event.target.dataset?.time

            if (!dataTimeString) {
                discoverProgress.style.width = 0
            }
            else if (dataTimeString.replace('s','') > 0) { // TODO: localization issue
                discoverProgress.style.width = `${100 * dataTimeString.replace('s','') / 60}%` // TODO: localization issue
            }
            else if (dataTimeString.replace('m','') > 0) { // TODO: localization issue
                discoverProgress.style.width = '100%'
            }
            else {
                discoverProgress.style.width = 0
            }
        })
    }
}

const onProfileStatsChanged = 'profileStatsChanged'
const ProfileStatsChanged = {
    target: ProfileStats,
    config: { childList: true },
    callback: (mutationsList) => {
        if (mutationsList.find(x => x.addedNodes.length && x.addedNodes[0].classList.contains('pr-stats__section'))) {
            const event = new Event(onProfileStatsChanged, { bubbles: true })
            mutationsList[0].target.dispatchEvent(event)
        }
    }
}

const RenderBadges = () => {
    ProfilePopup?.addEventListener(onProfileStatsChanged, () => {
        AddBadges()
    })
}

const InitObservers = () => [PointStatsChanged, ProfileStatsChanged, DiscoverChanged].forEach(o => InitObserver(o))

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