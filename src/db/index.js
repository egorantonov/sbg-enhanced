import { State } from '../state'
import { Logger } from '../utils'

export const STORE_NAMES = {
  images: 'images'
} 

const dbName = 'eui-db'
const stores = [STORE_NAMES.images]
const version = 1
const MODE = {
  readwrite: 'readwrite',
  readonly: 'readonly'
}

export function IndexedDb() {
  const request = window.indexedDB.open(dbName, version)

  request.onupgradeneeded = function(e) {
    const db = e.target.result

    for (let i = 0; i < stores.length; i++) {
      const storeName = stores[i]
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: 'key', autoIncrement: false })
      }
      else {
        db.deleteObjectStore(storeName)
      }
    }
  }

  request.onerror = (e) => {
    const error = e.target.error
    Logger.error(`Ошибка при открытии БД ${dbName}: ${error.message}`, error)
  }

  request.onsuccess = (e) => {
    const db = e.target.result
    const transaction = db.transaction(stores, MODE.readonly)
    const imageStore = transaction.objectStore(stores[0]) // images only
 
    const getRequest = imageStore.getAll()
    getRequest.onsuccess = () => {
      const images = getRequest.result ?? []
      Logger.log(`${images?.length} images cached in memory`)
      State.Set(stores[0], images) // images only
    }

    getRequest.onerror = (e) => Logger.error(`Ошибка получения данных БД ${e.target.error.message}`, e.target.error)
  }
}

export async function AddEntry(storeName, data) {
  const images = State.Get(stores[0]) ?? [] // images only
  images.push(data)
  const request = window.indexedDB.open(dbName, version)

  request.onsuccess = (e) => { 
    const db = e.target.result
    const transaction = db.transaction([storeName], MODE.readwrite)
    const store = transaction.objectStore(storeName)
    const addRequest = store.add(data) 

    addRequest.onsuccess = function() {
      Logger.log('Entry added successfully')
    }

    addRequest.onerror = function(e) {
      Logger.error('Error adding entry: ', e.target.error)
    }
  }
}

export function GetEntry(storeName, key, callback) {
  let record
  const images = State.Get(storeName)
  if (images?.length) {
    record = images.find(i => i.key === key)
  }

  callback(record)
}

export function StoreInfo(storeName, callback) {
  const request = indexedDB.open(dbName, version)
  request.onsuccess = (event) => { 
    const db = event.target.result
    if (!db.objectStoreNames.contains(storeName)) {
      db.createObjectStore(storeName, { keyPath: 'key', autoIncrement: false })
    }
    const transaction = db.transaction([storeName], MODE.readwrite)
    const store = transaction.objectStore(storeName)

    const countRequest = store.count()
    countRequest.onsuccess = () => {
      callback(countRequest.result)
    }
    countRequest.onerror = () => Logger.error(`Ошибка подсчёта данных БД ${countRequest.error.message}`, countRequest.error)
  }
}


export function ClearStore(storeName, callback) {
  const request = indexedDB.open(dbName, version)
  request.onsuccess = (event) => {
    const db = event.target.result
    const transaction = db.transaction([storeName], MODE.readwrite)
    const store = transaction.objectStore(storeName)

    const deleteRequest = store.clear()
    deleteRequest.onsuccess = () => {
      callback(storeName)
    }
    deleteRequest.onerror = () => Logger.error(`Ошибка удаления данных БД ${deleteRequest.error.message}`, deleteRequest.error)
  }
}