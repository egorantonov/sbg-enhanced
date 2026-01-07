import { ClientData, Elements, Events, EUI, IsWebView, Modifiers, Nodes, Sleep, t, Translations } from '../constants'
import { getSbgSettings, setSbgSettings } from '../utils'
import { flavored_fetch } from '../helpers'
import { InfoSettingsItem } from '../components/settingsItem'
import { GetWebGpu } from '../utils/unsafeImport'

export default async function ImportExport() {
  const Week = 604800000
  const ua = ClientData.GetUserAgentData
  const userAgent = `${ua.platform} ${ua.browser}${ua.mobile ? ' (Mobile)' : ''}`
  await Sleep(100) // make sure other async functions started earlier, e.g. Informer

  const GetSettingsAsJson = () => {
    const itemsToExport = Object.entries(localStorage)
      .reduce((acc, [key, value]) => (
        /*key === 'settings' || key === 'map-config' || */key.startsWith('eui'))
        ? acc.concat({ key, value }) : acc, [])
    return JSON.stringify(itemsToExport)
  }

  const ApplyImportedSettings = (entries) => {
    for (let i = 0; i < entries.length; i++) {
      localStorage.setItem(entries[i].key, entries[i].value)
    }
  }

  const GetUserId = async () => {
    let userId = localStorage.getItem(EUI.UserId)
    if (userId && userId.indexOf('.') > 0) {
      return userId
    }

    const id = await flavored_fetch('/api/self', {
      headers: {
        'content-type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(json => json.g)

    localStorage.setItem(EUI.UserId, id)
    return id
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const GetCloudData = async (userId) => {
    return getSbgSettings()?.euiSettings
    /*return await fetch(`${Host}${Endpoints.Sync}?id=${userId}&userAgent=${userAgent}`)
      .then(response => response.json())
      .then(json => { return json.settings })
      .catch(error => { console.error(`GetCloudSync Error: ${error.message}`) })*/
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const SetCloudData = async (userId) => {
    const settings = GetSettingsAsJson()
    const settingsCache = localStorage.getItem(EUI.SettingsCache)
    if (!settingsCache || settings !== settingsCache) {
      let sbgSettings = getSbgSettings()
      sbgSettings.euiSettings = settings
      setSbgSettings(sbgSettings)
      /*await fetch(`${Host}${Endpoints.Sync}`,
      {
        method: 'POST',
        body: JSON.stringify({ 
          id: userId,
          userAgent: userAgent,
          settings: settings })
      })
      .then(response => response.json())
      .then(json => {
        localStorage.setItem(EUI.CloudSync, json.timestamp)
        localStorage.setItem(EUI.SettingsCache, settings)
        document.getElementById(EUI.LastSynced).innerText = (new Date(+json.timestamp)).toLocaleString()
        createToast('✅ Settings synced with cloud', 'top left')?.showToast()
      })
      .catch(error => { console.error(`SetCloudSync Error: ${error.message}`) })*/
    }
  }

  const CloudSync = async (force = false) => {
    const userId = await GetUserId()
    if (force) { // force overwrite (manual)
      await SetCloudData(userId)
      return
    }

    const cloudData = await GetCloudData(userId)
    if (!cloudData || typeof cloudData !== 'string') { // no cloud data, need to sync local settings
      await SetCloudData(userId)
      return
    }

    const syncedAt = localStorage.getItem(EUI.CloudSync)
    if (syncedAt) {
      if (Date.now() - (+syncedAt) > Week) { // update stale settings
        await SetCloudData(userId)
      }
      return
    }

    ApplyImportedSettings(JSON.parse(cloudData))
    localStorage.setItem(EUI.CloudSync, Date.now())
    if (confirm(t('reloadDialogue'))) {
      location.reload()
    }
  }

  const Import = (e) => {
    let file = e.target.files[0]
    try {
      const reader = new FileReader()
      reader.readAsText(file)

      reader.onload = async function () {
        console.log(reader.result)
        ApplyImportedSettings(JSON.parse(reader.result))
        await SetCloudData(true)
        location.reload()
      }

      reader.onerror = function () {
        console.log(reader.error)
        alert('FileReader error')
      }
    }
    catch (e) {
      alert('Unknown error occurred')
      console.error(e)
    }
  }

  const Export = () => {
    const downloadLink = document.createElement(Elements.Link)
    downloadLink.download = 'sbg.config'
    const json_string = GetSettingsAsJson()
    let file = new Blob([json_string], { type: 'application/json' })
    downloadLink.href = window.URL.createObjectURL(file)
    downloadLink.click()
  }

  const about = Nodes.SettingSections.at(3)

  if (about) {
    // appendLine(about, t('cloudSync'), (new Date(+localStorage.getItem(EUI.CloudSync))).toLocaleString(), EUI.LastSynced)
    about.appendChild(InfoSettingsItem('User ID', `${(await GetUserId()).slice(0,4)}...`, 'eui-userId'))
    about.appendChild(InfoSettingsItem('Client', userAgent, 'eui-clientId'))
    if (navigator.hardwareConcurrency) about.appendChild(InfoSettingsItem('CPU (logical cores)', `${navigator.hardwareConcurrency}`, 'eui-hardwareConcurrency'))
    if (navigator.deviceMemory) about.appendChild(InfoSettingsItem('RAM (at least)', `${navigator.deviceMemory} Gb`, 'eui-deviceMemory'))

    const webGpu = await GetWebGpu()
    const euiGpu = 'eui-gpu'
    let gpu = ClientData.GetGPU

    if (webGpu) {
      let vendor = ''
      if (webGpu.vendor && !gpu.toLowerCase().includes(webGpu.vendor.toLowerCase())) {
        switch (webGpu.vendor.toLowerCase()) {
          case 'intel':
          case 'qualcomm':
          case 'unisoc':
          case 'google':
          case 'apple':
            vendor = `${webGpu.vendor.toUpperCaseFirst()} `
            break
          case 'mediatek':
            vendor = 'MediaTek '
            break
          default:
            vendor = `${webGpu.vendor.toUpperCase()} `
            break
        }
      }

      let architecture = ''
      if (webGpu.architecture) {
        architecture = ` (${webGpu.architecture.toUpperCaseFirst()})`
      }
      gpu = `${vendor}${gpu}${architecture}`
    }

    about.appendChild(InfoSettingsItem('GPU', gpu, euiGpu))

    Nodes.SettingsPopupClose?.addEventListener(Events.onClick, () => CloudSync(true))
    Nodes.GetId('layers-config__save')?.addEventListener(Events.onClick, () => CloudSync(true))
  }

  if (IsWebView()){
    return
  }

  if (about) {
    const key = document.createElement(Elements.Div)
    key.classList.add(`${EUI.SettingItem}__label`)

    const title = document.createElement(Elements.Span)
    title.innerText = t(Translations.importExport)

    const subTitle = document.createElement(Elements.Span)
    subTitle.innerText = t(Translations.importExportDesc)
    subTitle.style.color = '#777'
    subTitle.style.fontSize = 'x-small'

    key.appendChild(title)
    key.appendChild(subTitle)

    const value = document.createElement(Elements.Div)
    value.style.cssText = `
      display: flex;
      flex-direction: row;
      justify-content: center;
      width: 100%;
    `

    const inputFile = document.createElement(Elements.Input)
    inputFile.hidden = true
    inputFile.type = 'file'
    inputFile.id = 'eui-import-export'
    value.appendChild(inputFile)
    inputFile.addEventListener(Events.onChange, (e) => Import(e))

    const importButton = document.createElement(Elements.Button)
    importButton.innerText = ' ↓ '
    importButton.style.width = '50%'
    importButton.addEventListener(Events.onClick, () => inputFile.click())
    value.appendChild(importButton)

    const exportButton = document.createElement(Elements.Button)
    exportButton.innerText = ' ↑ '
    exportButton.style.width = '50%'
    exportButton.addEventListener(Events.onClick, () => Export())
    value.appendChild(exportButton)

    const item = document.createElement(Elements.Div)
    item.classList.add(Modifiers.SettingsSectionItemClassName, EUI.SettingItem)
    item.appendChild(key)
    item.appendChild(value)
    about.appendChild(item)
  }

  await CloudSync()
}