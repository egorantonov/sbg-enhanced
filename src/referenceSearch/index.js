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

  const sort = document.createElement(Elements.Select)
  sort.id = EUI.Sort

  // CUI compatibility
  const cuiSort = document.querySelector('.sbgcui_refs-sort-button')
  cuiSort && (sort.style.display = 'none')

  const sorts = ['Name', 'Dist+', 'Dist-']

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
          }
          else {
              refs = getRefs()
              inventoryRefs.length === 0 && (inventoryRefs = getRefs())
              clearButton.after(search)
              search.after(sort)
              cuiSort && search.after(cuiSort) // CUI compatibility
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

  sort.addEventListener(Events.onChange, async (e) => {

      sort.disabled = true

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

      if (refs.filter(ref => !ref.classList.contains(Modifiers.Loaded)).length !== 0) {

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
      let sorted = refs.sort((a, b) => ParseMeterDistance(a) - ParseMeterDistance(b))
      sortType === sorts[2] && sorted.reverse() // REVERSE IF DESC
      sorted.forEach(ref => {
          Nodes.InventoryContent?.appendChild(ref)

          // CUI compatibility
          ref.classList.toggle(Modifiers.Loading)
          ref.classList.toggle(Modifiers.Loading)
      })

      search.dataset.active === '1' && search.value && searchRefs(search.value)
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