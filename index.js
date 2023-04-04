// ==UserScript==
// @name         SBG Enhanced UI
// @namespace    https://3d.sytes.net/
// @version      1.1.1
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
const interval = 100
const defaultCloseButtonText = '[x]'
const enhancedCloseButtonText = ' ✕ '
const euiIncompatibility = 'eui-incompatibility'
const sbgVersionHeader = 'sbg-version'
const sbgCompatibleVersion = '0.2.7'
const onClick = 'click'
const onLoad = 'load'

// informer
const Informer = async () => {
    console.log('SBG Enhanced UI, version 1.1.1')
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
const BeautifyCloseButtons = () => {
    const buttons = Array.from(document.querySelectorAll('button'))
    for (let i = 0; i < buttons.length; i++) {
        if (buttons[i].innerText === defaultCloseButtonText) {
            buttons[i].innerText = enhancedCloseButtonText
            buttons[i].style.border = '2px solid transparent'
            buttons[i].style.borderRadius = '50%'
        }
    }
}

// hides draw button when outbound limit is reached
const HideDrawButton = () => {
    const out = document.querySelector('#i-stat__line-out')
    const draw = document.querySelector('#draw')
    !!draw && !!out && window.setInterval(() => { 
        draw.style.display = out.innerText == outboundLinksLimit ? 'none' : 'block' 
    }, interval)
}

const styleString = `       
.ol-layer__lines {
    filter: opacity(.5);
}

.ol-layer__markers {
    filter: brightness(1.2);
}

.popup {
    backdrop-filter: blur(5px);
    background-color: var(--background-transp);
}

.game-menu > button, button#ops, .ol-control > button {
    background-color: var(--background-transp);
    backdrop-filter: blur(5px);
    text-transform: uppercase;
}

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

// adds badges
const badgeImageClass = 'badge-image'
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

const onProfileStatsChanged = 'profileStatsChanged'
const InitProfileStatsMutationObserver = () => {
    const target = document.querySelector('.pr-stats')

    const config = {
        childList: true
    }

    const profileStatsObserver = new MutationObserver(mutationsList => {
        if (mutationsList.find(x => x.addedNodes.length && x.addedNodes[0].classList.contains('pr-stats__section'))) {
            const event = new Event(onProfileStatsChanged, { bubbles: true });
            mutationsList[0].target.dispatchEvent(event);
        }
    });

    profileStatsObserver.observe(target, config);
}

const InitObservers = () => {
    InitProfileStatsMutationObserver()
}

window.addEventListener(onLoad, async function () {

    await Informer()
    BeautifyCloseButtons()
    HideDrawButton()
    AddStyles()
    InitObservers()
    RemoveBadges()

    const profilePopup = document.querySelector('.profile.popup')
    if (!!profilePopup) {
        profilePopup.addEventListener(onProfileStatsChanged, () => {
            AddBadges()
        })
    }

}, false)

})()