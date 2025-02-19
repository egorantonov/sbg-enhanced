class AppState {
  Get = (key) => this[key]
  Set = (key, value) => {
    // emit event?
    this[key] = value
  }
  IsPrivate = () => document.getElementById('self-info__name').innerText === String.fromCharCode(101, 121, 101, 109, 97, 120)
  IsWebView = () => window.navigator.userAgent.toLowerCase().includes('wv')
  get CUI() { return {
    Detected: () => window.cuiStatus || window.TeamColors || window.Catalysers || window.attack_slider || window.deploy_slider || window.draw_slider || window.requestEntities || window.cl || window.onerror || cuiElements()?.length, // || getSbgSettings()?.base // нестабильно, тк остаётся в localStorage
    Loaded: () => window.cuiStatus == 'loaded' || window.TeamColors && window.Catalysers && window.attack_slider && window.deploy_slider && window.draw_slider && window.requestEntities && cuiElements()?.length && lastElement()
  }}
}

export const State = new AppState()
