import {Elements, EUI, Events, Modifiers} from '../constants'

/**
 * Creates informational settings item (label and text)
 * @param {string} labelText 
 * @param {string} valueText 
 * @param {string} id 
 * @param {{}} [options={}] 
 * @returns {HTMLElement} Item
 */
export function InfoSettingsItem(labelText, valueText, id, options = {}) {
  const label = getLabel(labelText, id, options)
  const value = document.createElement(Elements.Span)
  value.innerText = valueText
  value.id = id
  const item = document.createElement(Elements.Div)
  item.classList.add(Modifiers.SettingsSectionItemClassName, EUI.SettingItem)
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
 * @param {{}} [options={}] 
 * @returns {HTMLElement} Item
 */
export function ButtonSettingsItem(labelText, valueText, callback, id, options = {}) {
  const labelContainer = getLabel(labelText, id, options)
  const button = document.createElement(Elements.Button)
  button.innerText = valueText
  button.addEventListener(Events.onClick, () => callback())
  button.id = id
  const item = document.createElement(Elements.Div)
  item.classList.add(Modifiers.SettingsSectionItemClassName, EUI.SettingItem)
  item.appendChild(labelContainer)
  item.appendChild(button)
  item.id = `${id}-item`
  return item
}

/**
 * Creates toggle settings item (label)
 * @param {string} labelText 
 * @param {Function} enableCallback 
 * @param {Function} disableCallback 
 * @param {string} id 
 * @param {{}} [options={}] 
 * @returns {HTMLElement} Item
 */
export function ToggleSettingsItem(labelText, enableCallback, disableCallback, id, options = {}) {
  const labelContainer = getLabel(labelText, id, options)
  const input = document.createElement(Elements.Input)
  input.type = Elements.CheckBox
  input.disabled = options.disabled
  if (localStorage.getItem(id) == 1) {
    if ( !options?.once ) {
      enableCallback()
    }
    input.checked = true
  }
  input.id = id
  input.dataset.setting = id
  input.addEventListener(Events.onChange, e => e.target.checked ? enableCallback() : disableCallback())
  const item = document.createElement(Elements.Div)
  item.classList.add(Modifiers.SettingsSectionItemClassName, EUI.SettingItem)
  item.appendChild(labelContainer)
  item.appendChild(input)

  return item
}

function getLabel(titleText, id, options) {
  const label = document.createElement(Elements.Div)
  label.id = `${id}-label`
  label.classList.add(`${EUI.SettingItem}__label`)
  // label.style.display = 'flex'
  // label.style.flexDirection = 'column'

  const title = document.createElement(Elements.Span)
  title.innerText = titleText
  title.id = `${id}-title`

  label.appendChild(title)

  if (options?.subTitle) {
    const subTitle = document.createElement(Elements.Span)
    subTitle.textContent = options.subTitle
    subTitle.id = `${id}-subTitle`
    subTitle.style.color = '#777'
    subTitle.style.fontSize = 'x-small'
    label.appendChild(subTitle)
  }

  if (options?.data) {
    if (options.data?.labelPrefix) {
      title.dataset.prefix = options.data.labelPrefix
    }
    if (options.data?.labelPostfix) {
      title.dataset.postfix = options.data.postfix
    }
  }
  return label
}