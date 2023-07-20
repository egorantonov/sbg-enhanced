// unsafe call to WebKit `userAgentData` feature
export function getWebkitUserAgentData() {
  return window?.navigator?.userAgentData
}