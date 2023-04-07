// ==UserScript==
// @name         SBG Enhanced UI
// @namespace    https://3d.sytes.net/
// @version      1.2.0
// @downloadURL  https://github.com/egorantonov/sbg-enhanced/releases/latest/download/index.js
// @updateURL    https://github.com/egorantonov/sbg-enhanced/releases/latest/download/index.js
// @description  Enhanced UI for SBG
// @author       https://github.com/egorantonov
// @match        https://3d.sytes.net/
// @grant        none
// ==/UserScript==

(function() {

'use strict'

const outboundLinksLimit = 20
const defaultCloseButtonText = '[x]'
const enhancedCloseButtonText = ' ✕ '
const euiIncompatibility = 'eui-incompatibility'
const sbgVersionHeader = 'sbg-version'
const sbgCompatibleVersion = '0.2.7'
const onClick = 'click'
const onLoad = 'load'

// informer
const Informer = async () => {
    console.log('SBG Enhanced UI, version 1.2.0')
    const sbgCurrentVersion = await fetch('/api/').then(response => {        
        return response.headers.get(sbgVersionHeader)
    })

    if (sbgCurrentVersion != sbgCompatibleVersion) {
        const alertShown = localStorage.getItem(euiIncompatibility)

        if (alertShown != 'true') {
            alert(`⚠️ Enhanced UI may be incompatible with current version of SBG ${sbgCurrentVersion}. Check for updates.`)
            localStorage.setItem(euiIncompatibility, true)
        }
    }
    else {
        localStorage.setItem(euiIncompatibility, false)
    }
}

// makes close buttons look better
const BeautifyCloseButtons = async () => {
    await new Promise(r => setTimeout(r, 100)) // wait for SBG CUI modify inventory close button from 'X' to '[x]'
    const buttons = Array.from(document.querySelectorAll('button'))
    for (let i = 0; i < buttons.length; i++) {
        if (buttons[i].innerText === defaultCloseButtonText) {
            buttons[i].innerText = enhancedCloseButtonText
            buttons[i].dataset.round = true
        }
    }
}

const INGRESS = {
    backgroundColor: '112025',
    buttonColor: '97FBFB',
    buttonBackgroundColor: '20474C',
    buttonGlowColor: '007B85',
    buttonBorderColor: '38E8E6',
    buttonDisabledColor: '7E888A',
    buttonDisabledBackgroundColor: '112325',
    buttonDisabledAccentColor: '4E3B35',
}

const styleString = `
@import url('https://fonts.googleapis.com/css2?family=Coda&family=Oswald:wght@500&display=swap');

/* LINES AND POINTS LAYERS */
@keyframes blink {
    50% {
      filter: opacity(.45);
    }  
}

.ol-layer__lines {
    filter: opacity(.55);
    animation: blink 3s linear infinite;
}

.ol-layer__markers {
    filter: brightness(1.2);
}

/* POPUPS */

.popup {
    backdrop-filter: blur(5px);
    background-color: var(--background-transp);
    border-radius: 5px;
}

/* BUTTONS */

.i-buttons>button, button#attack-slider-fire, .draw-slider-buttons>button {
    color: #${INGRESS.buttonColor};
    background: linear-gradient(to top, #${INGRESS.buttonGlowColor} 0%, #${INGRESS.buttonBackgroundColor} 30%, #${INGRESS.buttonBackgroundColor} 70%, #${INGRESS.buttonGlowColor} 100%);
    border-color: #${INGRESS.buttonBorderColor};
    border-style: solid;
    text-transform: uppercase;
    font-family: 'Coda', 'Oswald';
}

.i-buttons>button[disabled], button#attack-slider-fire[disabled], .draw-slider-buttons>button[disabled] {
    color: #${INGRESS.buttonDisabledColor};
    background: #${INGRESS.buttonDisabledBackgroundColor};
    border-color: #${INGRESS.buttonDisabledAccentColor};
}

.game-menu > button, button#ops, .ol-control > button {
    background-color: var(--background-transp);
    backdrop-filter: blur(5px);
    text-transform: uppercase;
}

.popup-close[data-round=true], #inventory__close[data-round=true] {
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

.discover-progress {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    background-color: #${INGRESS.buttonDisabledAccentColor};
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

.draw-slider-wrp .splide__slide.is-active .refs-list__image>div {
    box-shadow: 0px -5px 0px #${INGRESS.buttonBorderColor} inset;
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
    flex-wrap: nowrap;
    margin: 0.5em 0 0.5em;
}

.i-buttons>button {
    padding: 6px;
    min-width: fit-content;
    width: calc(25% - 0.25em);
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

/* SBG CUI Enhancements*/

.sbgcui_xpProgressBar {
    background-color: var(--background-transp);
    backdrop-filter: blur(5px);
    border-radius: 5px;
}
`

// adds filter styles to the canvas wrapper layers
const AddStyles = () => {
    const style = document.createElement('style')
    document.head.appendChild(style)

    style.innerHTML = styleString
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

            container.prepend(badgeImage)
        }
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
        discoverProgress.className = 'discover-progress'
        discover.appendChild(discoverProgress)

        infoPopup.addEventListener(onDiscoverChanged, (event) => {

            if (event.target.dataset?.time > 0) {
                discoverProgress.style.width = `${100*event.target.dataset.time/90}%`
                discover.setAttribute('disabled', true)
                discover.classList.add('loading')
            }
            else {
                discoverProgress.style.width = 0
                
                if (discover.classList.contains('loading')) {
                    discover.classList.remove('loading')
                    discover.removeAttribute('disabled')
                }
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

window.addEventListener(onLoad, async function () {

    await Informer()
    AddStyles()
    InitObservers()
    await BeautifyCloseButtons()
    DisableDrawButton()
    RemoveBadges()
    AddDiscoverProgress()

    const profilePopup = document.querySelector('.profile.popup')
    if (!!profilePopup) {
        profilePopup.addEventListener(onProfileStatsChanged, () => {
            AddBadges()
        })
    }



}, false)

})()