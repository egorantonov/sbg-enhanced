import { EUI, Elements, Events, Modifiers, Nodes, Proposed, t } from '../constants'
import styles from './styles.css'

export default function AddAnimations() {
    const input = document.createElement(Elements.Input)
    const uiSettings = Nodes.SettingSections.at(1)
    if (uiSettings) {
        const title = document.createElement(Elements.Span)
        title.innerText = t('animations')

        input.type = Elements.CheckBox
        input.dataset.setting = EUI.Animations
        const label = document.createElement(Elements.Label)
        label.classList.add(Modifiers.SettingsSectionItemClassName)
        label.appendChild(title)
        label.appendChild(input)
        uiSettings.appendChild(label)

        // PROPOSAL
        const animationsProposed = localStorage.getItem(`${EUI.Animations}${Proposed}`)
        if (animationsProposed != 1) {
            localStorage.setItem(`${EUI.Animations}${Proposed}`, 1)
            localStorage.setItem(EUI.Animations, 1)
            input.checked = true
        }
    }

    // STYLES
    const style = document.createElement(Elements.Style)
    style.dataset.id = EUI.Animations
    style.innerHTML = styles

    if (localStorage.getItem(EUI.Animations) == 1) {
        document.head.appendChild(style)
        input.checked = true
    }

    input.addEventListener(Events.onChange, (event) => {
        if (event.target.checked) {
            document.head.appendChild(style)
            localStorage.setItem(EUI.Animations, 1)
        }
        else {
            style.remove()
            localStorage.setItem(EUI.Animations, 0)
        }
    })
}