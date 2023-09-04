import { Backend, Elements, Events, EUI, IsWebView, Modifiers, Nodes, Sleep, t } from '../constants'
import { createToast } from '../utils'
import { getUserAgentData } from './userAgentData.ts'
const { Host, Endpoints } = Backend

export default async function ImportExport() {
  if (!localStorage.getItem('auth')){
    return
  }

  const Week = 604800000
  const ua = getUserAgentData()
  const userAgent = `${ua.platform} ${ua.browser}${ua.mobile ? ' (Mobile)' : ''}`
  await Sleep(500) // make sure other async functions started earlier, e.g. Informer

  const GetSettingsAsJson = () => {
    const itemsToExport = Object.entries(localStorage)
      .reduce((acc, [key, value]) => (
        key === 'settings' || key === 'map-config' || key.startsWith('eui') || key.startsWith('sbgcui'))
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
    
    const id = await fetch(`/api/self`, {
      headers: {
        authorization: `Bearer ${localStorage.getItem('auth')}`,
        'content-type': 'application/json; charset=UTF-8'
      }
    })
    .then(response => response.json())
    .then(json => { return json.g })

    localStorage.setItem(EUI.UserId, id)
    return id
  }

  const GetCloudData = async (userId) => {
    return await fetch(`${Host}${Endpoints.Sync}?id=${userId}&userAgent=${userAgent}`)
      .then(response => response.json())
      .then(json => { return json.settings })
  }

  const SetCloudData = async (userId) => {
    const settings = GetSettingsAsJson()
    const settingsCache = localStorage.getItem(EUI.SettingsCache)
    if (!settingsCache || settings !== settingsCache) {
      await fetch(`${Host}${Endpoints.Sync}`,
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
    }
  }

  const CloudSync = async (force = false) => {
    const userId = await GetUserId()
    if (force) { // force overwrite (manual)
      await SetCloudData(userId)
      return
    }

    const cloudData = await GetCloudData(userId)
    if (!cloudData || typeof cloudData !== "string") { // no cloud data, need to sync local settings
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
  if (!IsWebView() && about) {
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

  if (about) {
    const key = document.createElement(Elements.Span)
    key.innerText = t('cloudSync')

    const value = document.createElement(Elements.Span)
    value.id = EUI.LastSynced
    value.innerText = (new Date(+localStorage.getItem(EUI.CloudSync))).toLocaleString()

    // const syncButton = document.createElement(Elements.Button)
    // syncButton.innerText = ' ☁ '
    // value.appendChild(syncButton)
    // syncButton.addEventListener(Events.onClick, () => CloudSync(true))

    const item = document.createElement(Elements.Div)
    item.classList.add(Modifiers.SettingsSectionItemClassName)
    item.appendChild(key)
    item.appendChild(value)
    about.appendChild(item)

    Nodes.SettingsPopupClose?.addEventListener(Events.onClick, () => CloudSync(true))
    Nodes.GetId('layers-config__save')?.addEventListener(Events.onClick, () => CloudSync(true))

    // CUI Compatibility
    const cuiSaveSettingsButton = document.querySelector("div.sbgcui_settings-buttons_wrp>button")
    !!cuiSaveSettingsButton && cuiSaveSettingsButton.addEventListener(Events.onClick, () => CloudSync(true))
  }

  await CloudSync()
}