
import { EUI, Events, SVP, t, Translations } from '../constants'
import { ToggleSettingsItem } from '../components/settingsItem'
import { Logger } from '../utils'

const noSupport = 'Wake Lock API не поддерживается'

export default async function EUIWakeLock() {
  if (SVP.Detected()) return
  if (!('wakeLock' in navigator)) {
    Logger.log(noSupport)
    return
  }

  if (!window.EUI) {
    window.EUI = {}
  }

  window.EUI.wakeLockManager = { wakeLock: null, isActive: false }
  const lm = window.EUI.wakeLockManager

  async function handleVisibilityChange() {
    Logger.debug(`📱 Visibility changed to: ${document.visibilityState}`)
    if (!lm.isActive && document.visibilityState === 'visible') {
      Logger.debug('🔙 Возврат к вкладке')

      // let bm = window.EUI.batteryManager // TODO: ???
      // if (bm && !bm.charging && (bm.level * 100 <= EUI.LowBattery)) return
      await requestWakeLock()
    }
  }

  async function requestWakeLock() {
    try {
      Logger.debug('🟠 Screen Wake Lock был запрошен')
      lm.wakeLock = await navigator.wakeLock.request('screen')
      lm.isActive = true

      lm.wakeLock.addEventListener(Events.onRelease, () => {
        lm.isActive = false
        Logger.debug('⚪ Screen Wake Lock был освобожден')
      })
    }
    catch (error) {
      Logger.error('❌ Ошибка Wake Lock: ', error)
    }
  }

  async function EnableWakeLock() {
    Logger.debug('🟢 Включаем wakelock')
    await requestWakeLock()

    document.addEventListener(Events.onVisibilityChange, handleVisibilityChange)
    localStorage.setItem(EUI.WakeLock, 1)
  }

  async function DisableWakeLock() {
    Logger.debug('🔴 Выключаем wakelock')
    if (lm.wakeLock && !lm.wakeLock.released) {
      await lm.wakeLock.release()
      lm.wakeLock = null
    }

    document.removeEventListener(Events.onVisibilityChange, handleVisibilityChange)
    localStorage.setItem(EUI.WakeLock, 0)
  }

  const uiSettings = document.querySelector('h4.settings-section__header[data-i18n="settings.interface.header"]')?.parentElement
  if (!uiSettings) {
    Logger.error('Не найден раздел настроек "Интерфейс"')
    return
  }

  const toggle = ToggleSettingsItem(t(Translations.wakeLock), EnableWakeLock, DisableWakeLock, EUI.WakeLock, { subTitle: t(Translations.wakeLockDesc) })
  uiSettings.appendChild(toggle)
  window.addEventListener(Events.onBeforeUnload, async () => {
    if (lm.wakeLock && !lm.wakeLock.released) {
      await lm.wakeLock.release()
    }
  })
}