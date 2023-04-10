// ==UserScript==
// @name         SBG Enhanced UI Remote Loader
// @namespace    https://3d.sytes.net/
// @version      1.0.0
// @downloadURL  https://github.com/egorantonov/sbg-enhanced/releases/latest/download/remote.js
// @updateURL    https://github.com/egorantonov/sbg-enhanced/releases/latest/download/remote.js
// @description  Remote loader for SBG Enhanced UI
// @author       https://github.com/egorantonov
// @website      https://github.com/egorantonov/sbg-enhanced/releases
// @match        https://3d.sytes.net
// @match        https://3d.sytes.net/*
// @iconUrl      https://raw.githubusercontent.com/egorantonov/sbg-enhanced/master/assets/script/64.png
// @icon64Url    https://raw.githubusercontent.com/egorantonov/sbg-enhanced/master/assets/script/64.png
// @grant        none
// ==/UserScript==

(async function() {
    'use strict';

    await new Promise(r => setTimeout(r, 1000))
    let script = document.createElement('script')
    script.id = 'eui'
    script.src = 'https://github.com/egorantonov/sbg-enhanced/releases/latest/download/index.js'
    script.defer = true
    script.async = true
    script.type = 'text/javascript'
    document.head.appendChild(script)
})();