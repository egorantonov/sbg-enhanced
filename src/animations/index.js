import { ToggleSettingsItem } from '../components/settingsItem'
import { EUI, Elements, Events, Nodes, Translations, t } from '../constants'
import styles from './styles.min.css'

export default function AddAnimations() {
    const IsAnimated = () => localStorage.getItem(EUI.Animations) == 1
    const uiSettings = Nodes.SettingSections.at(1)
    if (!uiSettings) return

    // STYLES
    const style = document.createElement(Elements.Style)
    style.dataset.id = EUI.Animations
    style.innerHTML = styles

    const Enable = () => {
        document.head.appendChild(style)
        localStorage.setItem(EUI.Animations, 1)
    }

    const Disable = () => {
        style.remove()
        localStorage.setItem(EUI.Animations, 0)
    }

    const toggle = ToggleSettingsItem(t(Translations.animations), Enable, Disable, EUI.Animations, { disabled: localStorage.getItem(EUI.PerformanceMode) == 1 })
    uiSettings.appendChild(toggle)

    // SWIPE ANIMATIONS - INFO POPUP
    const SwipeToCloseInfoPopup = () => {
        let startX
        let startY
        let isSwipe = false

        const deploySliderClassName = '.deploy-slider-wrp'
        const deploySlider = Nodes.InfoPopup?.querySelector(deploySliderClassName)
        Nodes.InfoPopup?.addEventListener(Events.onTouchStart, (e) => {
            if (!IsAnimated()) return
            if (e.touches.length !== 1 || e.target.contains(deploySlider) || e.target.closest(deploySliderClassName)) {
                isSwipe = false
            }
            else {
                const touch = e.touches[0]
                startX = touch.clientX
                startY = touch.clientY
                isSwipe = true
            }
        })

        Nodes.InfoPopup?.addEventListener(Events.onTouchMove, (e) => {
            if (!isSwipe || !IsAnimated()) return

            e.preventDefault() // Prevent scrolling while swiping
        })

        Nodes.InfoPopup?.addEventListener(Events.onTouchEnd, (e) => {
            if (!isSwipe || !IsAnimated()) return

            const touch = e.changedTouches[0]
            const deltaX = touch.clientX - startX
            const deltaY = touch.clientY - startY

            if (Math.abs(deltaX) < 50 || Math.abs(deltaY) > 70) return

            // Check if the swipe is primarily horizontal and to the right
            if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX > 0) {
                Nodes.InfoPopupClose.click()
            }
        })
    }

    // SWIPE ANIMATIONS - INVENTORY
    const SwipeToCloseInventoryPopup = () => {
        let startX
        let startY
        let isSwipe = false

        Nodes.InventoryPopup?.addEventListener(Events.onTouchStart, (e) => {
            if (!IsAnimated()) return
            if (e.touches.length !== 1) {
                isSwipe = false
            }
            else {
                const touch = e.touches[0]
                startX = touch.clientX
                startY = touch.clientY
                isSwipe = true
            }
        })

        Nodes.InventoryPopup?.addEventListener(Events.onTouchMove, () => {
            if (!isSwipe || !IsAnimated()) return
        })

        Nodes.InventoryPopup?.addEventListener(Events.onTouchEnd, (e) => {
            if (!isSwipe || !IsAnimated()) return

            const touch = e.changedTouches[0]
            const deltaX = touch.clientX - startX
            const deltaY = touch.clientY - startY

            if (Math.abs(deltaX) < 50 || Math.abs(deltaY) > 70) return

            // Check if the swipe is primarily horizontal and to the left
            if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX < 0) {
                Nodes.InventoryPopupClose.click()
            }
        })
    }

    SwipeToCloseInfoPopup()
    SwipeToCloseInventoryPopup()
}