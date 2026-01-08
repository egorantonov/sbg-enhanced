import { EUI, Elements, IsWebView, Translations, t } from '../constants'
import { CircularProgress } from './circular'

window.CircularProgress = CircularProgress
let currentStep = 0
const defaultSteps = 26

export function Progress() {
  if (IsWebView()) return
  getTotal()

  /* CONTAINER */
  const container = document.createElement(Elements.Div)
  container.id = EUI.Progress
  container.classList.add('progress-container')
  container.style.cssText = `
    padding: 0;
    margin: 0;
    position: fixed;
    top: 0;
    z-index: 999;
    width: 100%;
    height: 100%;
    background: var(--background-transp);
    backdrop-filter: blur(50px) saturate(0);
    -webkit-backdrop-filter: blur(50px) saturate(0);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    font-family: system-ui, sans-serif !important;
  `
  /* IMAGE */
  const img = document.createElement(Elements.Div)
  img.style.cssText = `
    display: block;
    width: 64px;
    height: 64px;
    margin: 32px auto;
    background: url(https://raw.githubusercontent.com/egorantonov/sbg-enhanced/master/assets/script/64.png) no-repeat;
  `
  container.appendChild(img)

  /* TEXT */
  const text = document.createElement(Elements.Div)
  text.id = EUI.ProgressText
  text.textContent = t(Translations.progress)
  container.appendChild(text)

  /* STATUS BG */
  const progress = document.createElement(Elements.Div)
  progress.style.cssText = `
    background: #7777;
    width: 50%;
    height: 5px;
    margin-top: 10px;
    overflow: hidden;
    border-radius: 10px;
  `
  container.appendChild(progress)

  /* STATUS */
  const status = document.createElement(Elements.Div)
  status.id = EUI.ProgressStatus
  status.style = `
    background: linear-gradient(90deg, var(--progress), #00AA77);
    width: 0;
    height: 100%;
    transition: width 0.25s ease-in-out;
  `
  progress.appendChild(status)

  document.body.appendChild(container)
}

export function UpdateProgressStatus(stepText) {
  if (IsWebView()) return
  const total = getTotal()
  const status = document.getElementById(EUI.ProgressStatus)
  let value = 100 * ++currentStep / total
  if (value > 100) value = 100
  if (status) status.style.width = `${value}%`
  const container = document.getElementById(EUI.Progress)
  if (container) {
    container.style.backdropFilter = `blur(50px) saturate(${value/100})`
    container.style.webkitBackdropFilter = `blur(50px) saturate(${value/100})`
  }
  const text = document.getElementById(EUI.ProgressText)
  if (text && stepText) text.textContent = stepText
}

export function RemoveProgress() {
  if (IsWebView()) return
  const container = document.getElementById(EUI.Progress)
  if (container) container.remove()
  const total = getTotal()
  if (total != currentStep) {
    localStorage.setItem(EUI.ProgressStepsCount, currentStep)
  } 
}

function getTotal() {
  let total = +localStorage.getItem(EUI.ProgressStepsCount)
  if (!total) {
    total = defaultSteps
    localStorage.setItem(EUI.ProgressStepsCount, defaultSteps)
  }
  return total
}