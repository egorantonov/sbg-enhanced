import { EUI, Elements, Events, Modifiers, Nodes, Sleep, t, Translations as i18n } from '../constants'
// import { LongTouchEventListener } from '../helpers'
// import { showToast, Logger } from '../utils'

// let Team = 0
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
  search.placeholder = t(i18n.searchRefPlaceholder)
  search.style.order = 1

  const selectButton = document.getElementById('inventory-delete')
  selectButton?.after(search)
  search.style.display = 'none'
  tabs.forEach(tab => {
      tab.addEventListener(Events.onClick, () => {

          if (tab.dataset.tab != 3) {
              refs = []
              search.dataset.active = '0'
              search.style.display = 'none'
          }
          else {
              refs = getRefs()
              inventoryRefs.length === 0 && (inventoryRefs = getRefs())
              search.style.display = 'block'
              search.dataset.active = '1'
              search.value && searchRefs(search.value)
          }
      })
  })

  Nodes.InventoryPopupClose?.addEventListener(Events.onClick, () => {
      refs = []
      inventoryRefs = []
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
}