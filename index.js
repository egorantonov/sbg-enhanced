// ==UserScript==
// @name         SBG Enhanced UI
// @namespace    https://3d.sytes.net/
// @version      1.1.0
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
const sbgCompatibleVersion = '0.2.6'

// informer
const Informer = async () => {
    console.log('SBG Enhanced UI, version 1.0.1')
    let sbgCurrentVersion = await fetch('/api/').then(response => {        
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
    let buttons = Array.from(document.querySelectorAll('button'))
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
    let out = document.querySelector('#i-stat__line-out')
    let draw = document.querySelector('#draw')
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
}`

// adds filter styles to the canvas wrapper layers
const AddStyles = () => {
    let style = document.createElement('style')
    document.head.appendChild(style)

    style.innerHTML = styleString
}

const badgeMap = new Map()
badgeMap.set('Points Captured', { images: [
    {tier: 40000, value: 'https://fevgames.net/ingress/ingress-guide/concepts/medal/liberator/liberator5-2/' },
    {tier: 15000, value: 'https://fevgames.net/ingress/ingress-guide/concepts/medal/liberator/liberator4-2/' },
    {tier: 5000, value: 'https://fevgames.net/ingress/ingress-guide/concepts/medal/liberator/liberator3/' },
    {tier: 1000, value: 'https://fevgames.net/ingress/ingress-guide/concepts/medal/liberator/liberator2/' },
    {tier: 100, value: 'https://fevgames.net/ingress/ingress-guide/concepts/medal/liberator/liberator1/' },
]})
badgeMap.set('Lines Drawn', { images: [
    {tier: 100000, value: 'https://fevgames.net/ingress/ingress-guide/concepts/medal/connector/connector5-2/' },
    {tier: 25000, value: 'https://fevgames.net/ingress/ingress-guide/concepts/medal/connector/connector4-2/' },
    {tier: 5000, value: 'https://fevgames.net/ingress/ingress-guide/concepts/medal/connector/connector3/' },
    {tier: 1000, value: 'https://fevgames.net/ingress/ingress-guide/concepts/medal/connector/connector2/' },
    {tier: 50, value: 'https://fevgames.net/ingress/ingress-guide/concepts/medal/connector/connector1/' },
]})
badgeMap.set('Unique Points Visited', { images: [
    {tier: 30000, value: 'https://fevgames.net/ingress/ingress-guide/concepts/medal/explorer/explorer5-2/' },
    {tier: 10000, value: 'https://fevgames.net/ingress/ingress-guide/concepts/medal/explorer/explorer4-2/' },
    {tier: 2000, value: 'https://fevgames.net/ingress/ingress-guide/concepts/medal/explorer/explorer3/' },
    {tier: 1000, value: 'https://fevgames.net/ingress/ingress-guide/concepts/medal/explorer/explorer2/' },
    {tier: 100, value: 'https://fevgames.net/ingress/ingress-guide/concepts/medal/explorer/explorer1/' },
]})
badgeMap.set('Discoveries Done', { images: [
    {tier: 200000, value: 'https://fevgames.net/ingress/ingress-guide/concepts/medal/hacker/hacker5-2/' },
    {tier: 100000, value: 'https://fevgames.net/ingress/ingress-guide/concepts/medal/hacker/hacker4-2/' },
    {tier: 30000, value: 'https://fevgames.net/ingress/ingress-guide/concepts/medal/hacker/hacker3/' },
    {tier: 10000, value: 'https://fevgames.net/ingress/ingress-guide/concepts/medal/hacker/hacker2/' },
    {tier: 2000, value: 'https://fevgames.net/ingress/ingress-guide/concepts/medal/hacker/hacker1/' },
]})
badgeMap.set('Points Captured', { images: [
    {tier: 20000, value: 'https://fevgames.net/ingress/ingress-guide/concepts/medal/pioneer/pioneer5-2/' },
    {tier: 5000, value: 'https://fevgames.net/ingress/ingress-guide/concepts/medal/pioneer/pioneer4-2/' },
    {tier: 1000, value: 'https://fevgames.net/ingress/ingress-guide/concepts/medal/pioneer/pioneer3/' },
    {tier: 200, value: 'https://fevgames.net/ingress/ingress-guide/concepts/medal/pioneer/pioneer2/' },
    {tier: 20, value: 'https://fevgames.net/ingress/ingress-guide/concepts/medal/pioneer/pioneer1/' },
]})
badgeMap.set('Cores Destroyed', { images: [
    {tier: 225000, value: 'https://fevgames.net/ingress/ingress-guide/concepts/medal/purifier/purifier5-2/' },
    {tier: 75000, value: 'https://fevgames.net/ingress/ingress-guide/concepts/medal/purifier/purifier4-2/' },
    {tier: 22500, value: 'https://fevgames.net/ingress/ingress-guide/concepts/medal/purifier/purifier3/' },
    {tier: 7500, value: 'https://fevgames.net/ingress/ingress-guide/concepts/medal/purifier/purifier2/' },
    {tier: 1500, value: 'https://fevgames.net/ingress/ingress-guide/concepts/medal/purifier/purifier1/' },
]})
badgeMap.set('Cores Deployed', { images: [
    {tier: 150000, value: 'https://fevgames.net/ingress/ingress-guide/concepts/medal/builder/builder5-2/' },
    {tier: 75000, value: 'https://fevgames.net/ingress/ingress-guide/concepts/medal/builder/builder4-2/' },
    {tier: 22500, value: 'https://fevgames.net/ingress/ingress-guide/concepts/medal/builder/builder3/' },
    {tier: 7500, value: 'https://fevgames.net/ingress/ingress-guide/concepts/medal/builder/builder2/' },
    {tier: 1500, value: 'https://fevgames.net/ingress/ingress-guide/concepts/medal/builder/builder1/' },
]})
badgeMap.set('Longest Point Ownership', { images: [
    {tier: 150, value: 'https://fevgames.net/ingress/ingress-guide/concepts/medal/guardian/guardian5-2/' },
    {tier: 90, value: 'https://fevgames.net/ingress/ingress-guide/concepts/medal/guardian/guardian4-2/' },
    {tier: 20, value: 'https://fevgames.net/ingress/ingress-guide/concepts/medal/guardian/guardian3/' },
    {tier: 10, value: 'https://fevgames.net/ingress/ingress-guide/concepts/medal/guardian/guardian2/' },
    {tier: 3, value: 'https://fevgames.net/ingress/ingress-guide/concepts/medal/guardian/guardian1/' },
]})

// adds badges
const AddBadges = () => {
    let parent = document.querySelector('.pr-stats')
    let stats = Array.from(document.querySelectorAll('.pr-stat'))
    for (let i = 0; i < stats.length; i++) {
        let stat = stats[i]
        let title = stat.firstChild.innerText

        if (badgeMap.has(title)) {
            let tier = +stat.lastChild.innerText.replace(/,| days| km|/g, '')    
            let badgeImage = document.createElement('img')        
            let currentTier = badgeMap.get(title).images.find(x => x.tier <= tier)
            
            if (!currentTier) {
                continue
            }

            badgeImage.src = currentTier.value
            badgeImage.width = 32
            badgeImage.height = 32

            parent.prepend(badgeImage)
        }
    }
}

window.addEventListener('load', async function () {

    await Informer()
    BeautifyCloseButtons()
    HideDrawButton()
    AddStyles()

    let profile = document.querySelector('.profile-link')
    if (!!profile) {
        profile.addEventListener('click', () => {
            window.setTimeout(() => {
                AddBadges()
            }, 500)
        }, {once : true})
    }

}, false)

})()