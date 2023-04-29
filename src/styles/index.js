import { EUI, Elements } from '../constants'
import styles from './styles.css'

// adds filter styles to the canvas wrapper layers
export default function AddStyles() {
    const style = document.createElement(Elements.Style)
    style.dataset.id = EUI.CommonStyles
    document.head.appendChild(style)
    style.innerHTML = styles
}