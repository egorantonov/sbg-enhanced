// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {EUI, Elements, Events, Modifiers, Nodes, SBG, Translations as i18n, t} from '../constants'

/**
 * Creates informational settings item (label and text)
 * @param {string} labelText 
 * @param {string} valueText 
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