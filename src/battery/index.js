import { EUI, Events, Nodes, t, Translations } from '../constants'
import { Logger, showToast } from '../utils'

const thresholdExtraLow = 10

// TODO: перенести wakeLock?
export default async function Battery() {
  if (!('getBattery' in navigator)) {
    Logger.log('Battery Status API не поддерживается')
    return
  }

  if (!window.EUI) {
    window.EUI = {}
  }

  window.EUI.batteryManager = await navigator.getBattery()
  const bm = window.EUI.batteryManager

  function updateAllBatteryInfo() {
    updateChargeInfo()
    updateLevelInfo()
    updateChargingInfo()
    updateDischargingInfo()
  }
  updateAllBatteryInfo()
  const input = Nodes.GetSelector('input[type=checkbox][data-setting="eui-wakelock"]')

  async function handleLowBattery(lm) {
    const level = bm.level * 100
    if (level <= EUI.LowBattery) {
      await disableWakeLock(lm)
    }
    if (level <= thresholdExtraLow && localStorage.getItem(EUI.PerformanceMode) != 1) {
      showToast(t(Translations.batteryExtraLow, [level]), 'top center')
    }
  }

  async function disableWakeLock(lm) {
    if (!lm) return
    if (lm?.wakeLock) {
      showToast(t(Translations.batteryLow, [bm.level * 100]), 'top center')
      await lm.wakeLock.release()
      lm.wakeLock = null
      lm.isActive = false

      if (input) input.disabled = true
    }
  }

  async function enableWakeLock(lm) {
    if (input && !input.checked) return
    if (!lm || (lm.wakeLock && !lm.wakeLock.released && lm.isActive)) return

    showToast(t(Translations.batteryHighOrCharging), 'top center')
    Logger.debug('🟠 Screen Wake Lock был запрошен (batteryManager)')
    try {
      lm.wakeLock = await navigator.wakeLock.request('screen')
      lm.isActive = true

      if (input) input.disabled = false

      lm.wakeLock.addEventListener(Events.onRelease, () => {
        lm.isActive = false
        Logger.debug('⚪ Screen Wake Lock был освобожден')
      })
    }
    catch (error) {
      Logger.error('❌ Ошибка Wake Lock: ', error)
    }
  }

  // Charging //
  bm.addEventListener(Events.onChargingChange, async () => {
    updateChargeInfo()
    const lm = window.EUI.wakeLockManager
    if (bm.charging) { // воткнули зарядку
      await enableWakeLock(lm)
    }
    else { // убрали зарядку
      await handleLowBattery(lm)
    }
  })
  function updateChargeInfo() {
    Logger.log(`Battery is ${(bm.charging ? 'charging' : 'discharging')}`)
  }

  // Level change //
  bm.addEventListener(Events.onLevelChange, async () => {
    updateLevelInfo()
    if (bm.charging) return // ?
    await handleLowBattery(window.EUI.wakeLockManager)
  })
  function updateLevelInfo() {
    Logger.log(`Battery level: ${bm.level * 100}%`)
  }

  // bm.addEventListener(Events.onChargingTimeChange, () => {
  //   updateChargingInfo()
  // })
  function updateChargingInfo() {
    Logger.log(`Battery charging time: ${bm.chargingTime} seconds`)
  }

  // bm.addEventListener(Events.onDischargingTimeChange, () => {
  //   updateDischargingInfo()
  // })
  function updateDischargingInfo() {
    Logger.log(`Battery discharging time: ${bm.dischargingTime} seconds`)
  }
  //})
}