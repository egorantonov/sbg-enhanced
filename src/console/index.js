export function EuiConsole () {
  const euiConsole = 'eui-console'
  const hidden = 'hidden'
  const LB = '\r\n'
  function getNativeConsole() {
    if (!window._nativeConsole) {
      const iframe = document.createElement('iframe')
      iframe.style.display = 'none'
      document.body.appendChild(iframe)
      window._nativeConsole = iframe.contentWindow.console
    }
    return window._nativeConsole
  }

  const consolePopup = document.createElement('div')
  consolePopup.id = euiConsole
  consolePopup.classList.add('popup')
  consolePopup.classList.add(hidden)
  document.body.appendChild(consolePopup)

  const title = document.createElement('h3')
  title.textContent = 'EUI Console'
  consolePopup.appendChild(title)

  const output = document.createElement('textarea')
  output.id = `${euiConsole}-output`
  output.placeholder = '>'
  output.disabled = true
  consolePopup.appendChild(output)

  const input = document.createElement('textarea')
  input.id = `${euiConsole}-input`
  input.placeholder = '>'
  consolePopup.appendChild(input)

  const executeButton = document.createElement('button')
  executeButton.id = `${euiConsole}-execute`
  executeButton.textContent = 'Execute'
  var logger = getNativeConsole()

  function executeCallback() {
    var toEval = input.value
    if (!toEval) return
    logger.log(`Evaluating: ${LB}${toEval}`)
    output.value += `${toEval}${LB}${LB}`
    if (toEval == 'clear' || toEval == 'clear()') {
      input.value = ''
      output.value = '>'
      return
    }
    try {
      var res = eval(toEval)
      logger.log(res)
      input.value = ''
      if (Array.isArray(res)) {
        output.value += `${JSON.stringify(res)}${LB}${LB}>`
      }
      else if (typeof res === 'object' && !Array.isArray(res) && res !== null) {
        output.value += `${res}${LB}`
        output.value += `${JSON.stringify(res)}${LB}${LB}>`
      }
      else {
        output.value += `${res}${LB}${LB}>`
      }
    }
    catch (error) {
      logger.error(error)
      input.value = ''
      output.value += `Error: ${error}${LB}${LB}>`
    }
    output.scrollTop = output.scrollHeight
  }

  executeButton.addEventListener('click', executeCallback)
  consolePopup.append(executeButton)

  consolePopup.appendChild(document.createElement('br'))

  const closeButton = document.createElement('button')
  closeButton.id = `${euiConsole}-close`
  closeButton.textContent = ' ✕ '
  closeButton.dataset.round = 'true'
  closeButton.classList.add('popup-close')
  closeButton.addEventListener('click', () => {
    consolePopup.classList.add(hidden)
  })
  consolePopup.appendChild(closeButton)

  const about = Array.from(document.querySelectorAll('.settings-section')).at(3)
  if (about) {
    const key = document.createElement('span')
    key.innerText = 'Debug Console'
    const consoleShow = document.createElement('button')
    consoleShow.innerText = 'Open'
    consoleShow.addEventListener('click', () => {
      consolePopup.classList.toggle(hidden)
    })
    const settingsItem = document.createElement('div')
    settingsItem.classList.add('settings-section__item')
    settingsItem.appendChild(key)
    settingsItem.appendChild(consoleShow)
    setTimeout(() => about.appendChild(settingsItem), 1000)
  }
}