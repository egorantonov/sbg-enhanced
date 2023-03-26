// ==UserScript==
// @name         SBG Enhanced UI
// @namespace    https://3d.sytes.net/
// @version      1.0.1
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

window.addEventListener('load', async function () {

    await Informer()
    BeautifyCloseButtons()
    HideDrawButton()
    AddStyles()

}, false)

})()