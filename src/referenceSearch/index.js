import { EUI, Elements, Events, Modifiers, Nodes, Sleep, t } from '../constants'

export default function AddReferenceSearch() {

  const tabs = Array.from(document.querySelectorAll('.inventory__tab'))
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

  const sortInfo = document.createElement(Elements.Span)
  sortInfo.style.margin = 'auto'
  const sort = document.createElement(Elements.Select)
  sort.id = EUI.Sort

  // CUI compatibility // TODO: removed CUI sort until it has the same sort speed
  const cuiSortButton = document.querySelector('.sbgcui_refs-sort-button')
  const cuiSortSelect = document.querySelector('.sbgcui_refs-sort-select')
  // TODO: // cuiSortButton && (sort.style.display = 'none') && (sortInfo.style.display = 'none')
  cuiSortButton && (cuiSortButton.style.display = 'none')
  cuiSortSelect && (cuiSortSelect.style.display = 'none')

  const sorts = [
    t('sortName'),
    `${t('sortDist')} +`,
    `${t('sortDist')} -`,
    `${t('sortEnergy')} +`,
    `${t('sortEnergy')} -`,
    `${t('sortAmount')} +`,
    `${t('sortAmount')} -`
  ]

  sorts.forEach(s => {
      let opt = document.createElement(Elements.Option)
      opt.value = s
      opt.innerText = s
      sort.appendChild(opt)
  })

  let clearButton = document.getElementById('inventory-delete-section')
  tabs.forEach(tab => {
      tab.addEventListener(Events.onClick, () => {
          if (['1', '2'].includes(tab.dataset.type)) {
              refs = []
              search.dataset.active = '0'
              search.remove()
              sort.selectedIndex = 0
              sort.disabled = false
              sort.remove()
              sortInfo.remove()
          }
          else {
              refs = getRefs()
              inventoryRefs.length === 0 && (inventoryRefs = getRefs())
              clearButton.after(search)
              search.after(sort)
              search.after(sortInfo)
              cuiSortButton && search.after(cuiSortButton) // CUI compatibility
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

  sortInfo.addEventListener(Events.onClick, () => {
    localStorage.removeItem('refs-cache')
    sortInfo.innerText = ''
  })

  sort.addEventListener(Events.onChange, async (e) => {

      sort.disabled = true

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

      if (sortType !== sorts[5] && sortType !== sorts[6] && refs.filter(ref => !ref.classList.contains(Modifiers.Loaded)).length !== 0) {

          let hiddenSet = false

          while (refs.find(ref => !ref.classList.contains(Modifiers.Loaded))) {

              if (!hiddenSet) {
                  refs.forEach(ref => {
                      !ref.classList.contains(Modifiers.Hidden) && ref.classList.add(Modifiers.Hidden)
                  })

                  hiddenSet = true
              }

              scroll()

              console.log('Yet to load: ' + refs.filter(ref => !ref.classList.contains(Modifiers.Loaded)).length)
              await Sleep(250)
          }

          refs.forEach(ref => {
              ref.classList.contains(Modifiers.Hidden) && ref.classList.remove(Modifiers.Hidden)
          })
      }

      // ADD SORTED
      let sorted = []
      if (sortType === sorts[1]) {
        sorted = refs.sort((a, b) => ParseMeterDistance(a) - ParseMeterDistance(b))
      }
      else if (sortType === sorts[2]) {
        sorted = refs.sort((a, b) => ParseMeterDistance(b) - ParseMeterDistance(a))
      }
      else if (sortType === sorts[3]) {
        sorted = refs.sort((a, b) => ParseEnergy(a) - ParseEnergy(b))
      }
      else if (sortType === sorts[4]) {
        sorted = refs.sort((a, b) => ParseEnergy(b) - ParseEnergy(a))
      }
      else if (sortType === sorts[5]) {
        sorted = refs.sort((a, b) => ParseAmount(a) - ParseAmount(b))
      }
      else /*if (sortType === sorts[6])*/ {
        sorted = refs.sort((a, b) => ParseAmount(b) - ParseAmount(a))
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
      const rs = duration < 50 ? refs.length : `${refs.length}\u{a0}x\u{a0}${+(duration/1000).toFixed(1)}s`
      console.log(rs)
      sortInfo.innerText = rs
      sort.disabled = false
  })
}

const DistanceRegex = new RegExp(String.raw`(\d*\.?\d+?)\s(${t('kilo')}?)`, 'i')
const ParseMeterDistance = (ref) => {
    // eslint-disable-next-line no-unused-vars
    const [_, dist, kilo] = ref.querySelector('.inventory__item-descr')
        .lastChild.textContent
        .replace(t('groupSeparator'),'').replace(t('decimalSeparator'),'.')
        .match(DistanceRegex)

    return kilo === t('kilo') ? dist * 1e3 : +dist
}

const ParseEnergy = (ref) => +ref.querySelector('.inventory__item-descr')
        .childNodes[4]?.textContent
        .replace(t('groupSeparator'),'').replace(t('decimalSeparator'),'.')


const ParseAmount = (ref) => {
    const text = ref.querySelector('.inventory__item-title').innerText
    return +text.slice(text.indexOf('(x')+2, text.indexOf(')'))
}