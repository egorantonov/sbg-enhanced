import { EUI, Elements, Events, Modifiers, Nodes, Sleep, t, Translations as i18n } from '../constants'
import { LongTouchEventListener } from '../helpers'
import { createToast, Logger } from '../utils'

let Team = 0
export default async function AddReferenceSearch() {

  const tabs = Nodes.GetSelectorAll('.inventory__tab')
  let inventoryRefs = []
  let refs = [] /* REFS CONTAINER */
  const scroll = () => Nodes.InventoryContent.dispatchEvent(new Event('scroll'))

  const getRefs = () => Array.from(Nodes.InventoryContent.querySelectorAll('div.inventory__item'))
  const searchRefs = (input) => {
      let searchRefs = getRefs()
      searchRefs.forEach(ref => ref.classList.remove(Modifiers.Hidden))
      searchRefs.filter(ref => !ref.innerText
       .slice(ref.innerText.indexOf(')')+1, ref.innerText.indexOf('\n'))
       .trim()
       .toLowerCase()
       .includes(input.toLowerCase()))
       .forEach(ref => ref.classList.add(Modifiers.Hidden))

      scroll()
  }

  const search = document.createElement(Elements.Input)
  search.type = 'search'
  search.id = EUI.Search
  search.dataset.type = Modifiers.ReferenceSearch
  search.placeholder = t('searchRefPlaceholder')

  const sort = document.createElement(Elements.Select)
  sort.id = EUI.Sort

  document.querySelector('.sbgcui_refs-sort-button')?.remove()
  document.querySelector('.sbgcui_refs-sort-select')?.remove()

  const sorts = [
    t(i18n.sortName),
    `${t(i18n.sortDist)} +`,
    `${t(i18n.sortDist)} -`,
    `${t(i18n.sortEnergy)} +`,
    `${t(i18n.sortEnergy)} -`,
    `${t(i18n.sortAmount)} +`,
    `${t(i18n.sortAmount)} -`,
    `${t(i18n.sortTeam)} +`,
    `${t(i18n.sortTeam)} -`,
    `${t(i18n.sortLevel)} +`,
    `${t(i18n.sortLevel)} -`,
    `${t(i18n.sortAnotherUselessInformation)}`
  ]

  sorts.forEach(s => {
    let opt = document.createElement(Elements.Option)
    opt.value = s
    opt.innerText = s
    sort.appendChild(opt)
  })

  const selectButton = document.getElementById('inventory-delete')
  tabs.forEach(tab => {
      tab.addEventListener(Events.onClick, () => {
          if (['1', '2'].includes(tab.dataset.tab)) {
              refs = []
              search.dataset.active = '0'
              search.remove()
              sort.selectedIndex = 0
              sort.disabled = false
              sort.remove()
          }
          else {
              refs = getRefs()
              inventoryRefs.length === 0 && (inventoryRefs = getRefs())
              selectButton?.before(search)
              search.after(sort)
              search.dataset.active = '1'
              search.value && searchRefs(search.value)
          }
      })
  })

  Nodes.InventoryPopupClose?.addEventListener(Events.onClick, () => {
      refs = []
      inventoryRefs = []
      sort.selectedIndex = 0
      sort.disabled = false
  })
  Nodes.Ops?.addEventListener(Events.onClick, async () => {

      if (search.dataset.active === '1') {

          refs = []
          while (refs.length === 0) {
              await Sleep(200) // let SBG request inventory
              refs = getRefs()
              inventoryRefs = getRefs()
          }

          search.value && searchRefs(search.value)
      }

  })

  search.addEventListener(Events.onInput, (e) => {
      searchRefs(e.target.value)
  })

  LongTouchEventListener(sort, () => {
    localStorage.removeItem('refs-cache')
    createToast('♻ Refs cache cleared')?.showToast()
  })

  sort.addEventListener(Events.onChange, async (e) => {
    Team = +localStorage.getItem(EUI.Team) || 0
    sort.style.filter = 'saturate(0.5)'
    sort.disabled = true
    Logger.log('Starting sorting')

      performance.mark('start')

      const sortType = e.target.value

      // RETURN IF DEFAULT SORTED
      if (sortType === sorts[0]) {
          refs.forEach(ref => ref.remove())
          refs = []
          inventoryRefs.forEach(ref => Nodes.InventoryContent?.appendChild(ref))
          search.dataset.active === '1' && search.value && searchRefs(search.value)
          sort.disabled = false
          return
      }

      refs = getRefs()

      Logger.log('Loaded refs nodes')
      if (sortType !== sorts[5] && sortType !== sorts[6] && refs.filter(ref => !ref.classList.contains(Modifiers.Loaded)).length !== 0) {

          Logger.log('Fetching info from server')
          let hiddenSet = false

          while (refs.find(ref => !ref.classList.contains(Modifiers.Loaded))) {

              if (!hiddenSet) {
                  refs.forEach(ref => {
                      !ref.classList.contains(Modifiers.Hidden) && ref.classList.add(Modifiers.Hidden)
                  })

                  hiddenSet = true
              }

              scroll()

              Logger.log('Yet to load: ' + refs.filter(ref => !ref.classList.contains(Modifiers.Loaded)).length)
              await Sleep(250)
          }

          refs.forEach(ref => {
              ref.classList.contains(Modifiers.Hidden) && ref.classList.remove(Modifiers.Hidden)
              const params = ref.querySelector('.inventory__item-descr').textContent.split(';')
              ref.dataset.level = params[0].split(' ')[1]
              ref.dataset.energy = parseFloat(params[2].split(' ')[2].slice(0, -1).replace(t('groupSeparator'),'').replace(t('decimalSeparator'),'.'))
              ref.dataset.dist = parseFloat(params[3].split(' ')[2]
                .replace(t('groupSeparator'),'').replace(t('decimalSeparator'),'.')
                .replace(` ${t('kilo')}${t('m')}`, 'e3'))
              ref.dataset.guard = +(params[4]?.split(' ')[2] ?? 0)
          })
      }

      Logger.log('Sorting...')

      // ADD SORTED
      let sorted = []
      if (sortType === sorts[1]) {
        sorted = refs.sort((a, b) => a.dataset.dist - b.dataset.dist)
      }
      else if (sortType === sorts[2]) {
        sorted = refs.sort((a, b) => b.dataset.dist - a.dataset.dist)
      }
      else if (sortType === sorts[3]) {
        sorted = refs.sort((a, b) => ParseTeam(a) - ParseTeam(b) || ParseEnergy(a) - ParseEnergy(b))
      }
      else if (sortType === sorts[4]) {
        sorted = refs.sort((a, b) => ParseTeam(a) - ParseTeam(b) || ParseEnergy(b) - ParseEnergy(a))
      }
      else if (sortType === sorts[5]) {
        sorted = refs.sort((a, b) => ParseAmount(a) - ParseAmount(b))
      }
      else if (sortType === sorts[6]) {
        sorted = refs.sort((a, b) => ParseAmount(b) - ParseAmount(a))
      }
      else if (sortType === sorts[7]) {
        sorted = refs.sort((a, b) => ParseTeam(a) - ParseTeam(b))
      }
      else if (sortType === sorts[8]) {
        sorted = refs.sort((a, b) => ParseTeam(b) - ParseTeam(a))
      }
      else if (sortType === sorts[9]) {
        sorted = refs.sort((a, b) => a.dataset.level - b.dataset.level)
      }
      else if (sortType === sorts[10])  {
        sorted = refs.sort((a, b) => b.dataset.level - a.dataset.level)
      }
      else {
        sorted = refs.sort((a, b) => b.dataset.guard - a.dataset.guard)
      }

      sorted.forEach(ref => {
          Nodes.InventoryContent?.appendChild(ref)

          // CUI compatibility
          ref.classList.toggle(Modifiers.Loading)
          ref.classList.toggle(Modifiers.Loading)
      })

      search.dataset.active === '1' && search.value && searchRefs(search.value)

      performance.mark('end')
      const duration = performance.measure('time','start','end').duration
      const rs = duration < 50 ? refs.length : `${refs.length}\u{a0}×\u{a0}${+(duration/1000).toFixed(1)}s`
      Logger.log(rs)
      sort.style.filter = 'none'
      createToast(rs)?.showToast()
      sort.disabled = false
  })
}

const DistanceRegex = new RegExp(String.raw`(\d*\.?\d+?)\s?(${t('kilo')}?)${t('m')}`, 'i')

const ParseEnergy = (ref) => +ref.querySelector('.inventory__item-descr')
.childNodes[4]?.textContent
.replace(t('groupSeparator'),'').replace(t('decimalSeparator'),'.')

const ParseAmount = (ref) => {
  const text = ref.querySelector('.inventory__item-title').innerText
  return +text.slice(text.indexOf('(x')+2, text.indexOf(')'))
}

const ParseTeam = (ref) => {
    const text = +ref.querySelector('.inventory__item-title').style.color.slice(11,12) || 0
    return text === Team ? -1 : text 
}

const ParseLevel = (ref) => {
    return +ref.querySelector('.inventory__item-descr').firstChild.style.color.slice(12,-1)
}