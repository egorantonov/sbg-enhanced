/* eslint-disable @typescript-eslint/no-unused-vars */
import { EUI, Elements, Events, Modifiers, Nodes, Sleep, Translations, t } from '../constants'
import { createToast, getSbgSettings, setSbgSettings } from '../utils'

let currentStep = 0
const defaultSteps = 22

export function InitProgress() {
  if (document.readyState === 'interactive') {
    progress()
  }
  else {
    window.addEventListener('DOMContentLoaded', () => progress())
  }
}

function progress() {
  getTotal()
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
    background: var(--background);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    font-family: system-ui, sans-serif !important;
  `

  const text = document.createElement(Elements.Div)
  text.id = EUI.ProgressText
  text.textContent = t(Translations.progress)
  container.appendChild(text)

  const progress = document.createElement(Elements.Div)
  progress.style.cssText = `
    background: #7777;
    width: 50%;
    height: 12px;
    margin-top: 10px;
  `
  container.appendChild(progress)

  const status = document.createElement(Elements.Div)
  status.id = EUI.ProgressStatus
  status.style = `
    background: var(--progress);
    width: 0;
    height: 100%;
  `
  progress.appendChild(status)

  document.body.appendChild(container)
}

export function UpdateProgressStatus(stepText) {
  const total = getTotal()
  const status = document.getElementById(EUI.ProgressStatus)
  let value = 100 * ++currentStep / total
  if (value > 100) value = 100
  if (status) status.style.width = `${value}%`
  const text = document.getElementById(EUI.ProgressText)
  if (text && stepText) text.textContent = stepText
}

export function RemoveProgress() {
  const container = document.getElementById(EUI.Progress)
  if (container) container.remove()
  const total = getTotal()
  if (total < currentStep) {
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