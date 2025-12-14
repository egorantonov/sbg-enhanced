// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {EUI, Elements, Events, Modifiers, Nodes, SBG, Translations as i18n, t} from '../constants'

/**
 * Creates informational settings item (label and text)
 * @param {string} labelText 
 * @param {string} valueText 
 * @param {string} id 
 * @returns {HTMLElement} Item
 */
export function InfoSettingsItem(labelText, valueText, id) {
  const label = document.createElement(Elements.Span)
  label.innerText = labelText
  const value = document.createElement(Elements.Span)
  value.innerText = valueText
  id && (value.id = id)
  const item = document.createElement(Elements.Div)
  item.classList.add(Modifiers.SettingsSectionItemClassName)
  item.appendChild(label)
  item.appendChild(value)
  return item
}

/**
 * Creates button settings item (label and text)
 * @param {string} labelText 
 * @param {string} valueText 
 * @param {Function} callback 
 * @param {string} id 
 * @returns {HTMLElement} Item
 */
export function ButtonSettingsItem(labelText, valueText, callback, id) {
  const label = document.createElement(Elements.Span)
  label.innerText = labelText
  const button = document.createElement(Elements.Button)
  button.innerText = valueText
  button.addEventListener(Events.onClick, () => callback())
  button && (button.id = id)
  const item = document.createElement(Elements.Div)
  item.classList.add(Modifiers.SettingsSectionItemClassName)
  item.appendChild(label)
  item.appendChild(button)
  return item
}

/**
 * Creates toggle settings item (label)
 * @param {string} labelText 
 * @param {Function} enableCallback 
 * @param {Function} disableCallback 
 * @param {string} id 
 * @returns {HTMLElement} Item
 */
export function ToggleSettingsItem(labelText, enableCallback, disableCallback, id, options = {}) {
  const label = document.createElement(Elements.Span)
  label.innerText = labelText
  const input = document.createElement(Elements.Input)
  input.type = Elements.CheckBox
  input.disabled = options.disabled
  if (localStorage.getItem(id) == 1) {
    enableCallback()
    input.checked = true
  }
  input.dataset.setting = id
  input.addEventListener(Events.onChange, e => e.target.checked ? enableCallback() : disableCallback())
  const item = document.createElement(Elements.Div)
  item.classList.add(Modifiers.SettingsSectionItemClassName)
  item.appendChild(label)
  item.appendChild(input)

  return item
}