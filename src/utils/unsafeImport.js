// unsafe call to WebKit `userAgentData` feature
export function getWebkitUserAgentData() {
  return window?.navigator?.userAgentData
}

export async function WebGPU() {
  if (!('gpu' in navigator) || !('requestAdapter' in navigator.gpu)) {
    console.log('WebGPU not supported')
    return null
  }
  const adapter = await navigator.gpu.requestAdapter()
  if (!adapter || !('requestDevice' in adapter)) {
    console.log('Couldn\'t request WebGPU adapter')
    return null
  }

  const device = await adapter.requestDevice()
  if (!device) {
    return null
  }

  return device.adapterInfo?.architecture
}