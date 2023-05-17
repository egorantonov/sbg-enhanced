import { Elements, Events, Modifiers, Nodes, Sleep, t } from '../constants'

export default async function ImportExport() {
  await Sleep(500) // make sure other async functions started earlier, e.g. Informer

  const ApplyImportedSettings = (entries) => {
    for (let i = 0; i<entries.length; i++) {
      localStorage.setItem(entries[i].key, entries[i].value)
    }
  }

  const Import = (e) => {
    let file = e.target.files[0]
    try {
      const reader = new FileReader()
      reader.readAsText(file)

      reader.onload = function() {
        console.log(reader.result)
        ApplyImportedSettings(JSON.parse(reader.result))
      }

      reader.onerror = function() {
        console.log(reader.error)
      }
    }
    catch (e) {
      console.error('Unknown error occured')
      console.error(e)
    }

    location.reload()
  }

  const Export = () => {
    const itemsToExport = Object.entries(localStorage)
      .reduce((acc, [key, value]) => (key === 'settings' || key.startsWith('eui') || key.startsWith('sbgcui'))
        ? acc.concat({ key, value }) : acc, [])
    const json_string = JSON.stringify(itemsToExport)

    let downloadLink = document.createElement('a')
    downloadLink.download = 'sbg.config'
    let file = new Blob([json_string], {type: 'text/plain'})
    downloadLink.href = window.URL.createObjectURL(file)
    downloadLink.click()
  }

  const about = Nodes.SettingSections.at(3)
  if (about) {
    const key = document.createElement(Elements.Span)
    key.innerText = t('importExport')
    const value = document.createElement(Elements.Div)

    const inputFile = document.createElement(Elements.Input)
    inputFile.hidden = true
    inputFile.type = 'file'
    inputFile.id = 'eui-import-export'
    value.appendChild(inputFile)
    inputFile.addEventListener(Events.onChange, (e) => Import(e))

    const importButton = document.createElement(Elements.Button)
    importButton.innerText = ' ↓ '
    value.appendChild(importButton)
    importButton.addEventListener(Events.onClick, () => inputFile.click())

    const exportButton = document.createElement(Elements.Button)
    exportButton.innerText = ' ↑ '
    value.appendChild(exportButton)
    exportButton.addEventListener(Events.onClick, () => Export())

    const item = document.createElement(Elements.Div)
    item.classList.add(Modifiers.SettingsSectionItemClassName)
    item.appendChild(key)
    item.appendChild(value)
    about.appendChild(item)
  }
}