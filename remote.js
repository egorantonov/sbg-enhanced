// ==UserScript==
// @name         SBG User Script Remote Loader
// @namespace    https://3d.sytes.net/
// @version      3.0.0
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

    const UserScriptsSection = document.createElement('div')
    UserScriptsSection.classList.add('settings-section')

    const header = document.createElement('h4')
    header.classList.add('settings-section__header')
    header.innerText = 'User Scripts'
    UserScriptsSection.appendChild(header)

    const CreateScript = ({id, src}) => {
        const script = document.createElement('script')
        script.id = id
        script.src = src
        script.defer = true
        script.async = true
        script.type = 'text/javascript'

        return script
    }

    const CreateToggle = ({id, name, src}) => {
        const input = document.createElement('input')
        input.type = 'checkbox'
        input.dataset.id = id

        const title = document.createElement('span')
        title.innerText = name

        const label = document.createElement('label')
        label.classList.add('settings-section__item')

        label.appendChild(title)
        label.appendChild(input)

        if (localStorage.getItem(`userscript-${id}`) == 1)
        {
            const script = CreateScript({id, src})
            document.head.appendChild(script)
            input.checked = true
        }

        input.addEventListener('change', (event) => {
            localStorage.setItem(`userscript-${id}`, event.target.checked ? 1 : 0)
        })

        UserScriptsSection.appendChild(label)
    }

    [
        {
            id: 'cui',
            name: 'SBG Custom UI',
            src: 'https://nicko-v.github.io/sbg-cui/index.min.js'
        },
        {
            id: 'eui',
            name: 'SBG Enhanced UI',
            src: 'https://github.com/egorantonov/sbg-enhanced/releases/latest/download/index.js'
        },
    ].forEach(s => CreateToggle(s))

    const SettingSections = Array.from(document.querySelectorAll('.settings-section'))
    SettingSections.at(-1).after(UserScriptsSection)

})()