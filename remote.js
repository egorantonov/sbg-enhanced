// ==UserScript==
// @name         SBG Enhanced UI Remote Loader
// @namespace    https://3d.sytes.net/
// @version      2.0.0
// @downloadURL  https://github.com/egorantonov/sbg-enhanced/releases/latest/download/remote.js
// @updateURL    https://github.com/egorantonov/sbg-enhanced/releases/latest/download/remote.js
// @description  Remote loader for SBG Enhanced UI
// @author       https://github.com/egorantonov
// @website      https://github.com/egorantonov/sbg-enhanced/releases
// @match        https://3d.sytes.net
// @match        https://3d.sytes.net/*
// @iconUrl      https://i.imgur.com/ZCPXYQA.png
// @icon64Url    https://i.imgur.com/ZCPXYQA.png
// @grant        none
// ==/UserScript==

(function() {
    [
        {
            id: 'cui',
            src: 'https://nicko-v.github.io/sbg-cui/index.min.js'
        },
        {
            id: 'eui',
            src: 'https://github.com/egorantonov/sbg-enhanced/releases/latest/download/index.js'
        }
    ].forEach(s => {
        const script = document.createElement('script')
        script.id = s.id
        script.src = s.src
        script.defer = true
        script.async = true
        script.type = 'text/javascript'
        document.head.appendChild(script)
    })
})()