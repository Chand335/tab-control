const STORAGE_KEY = "scrapedPages"

const appendScrapedData = (entry, callback = () => {}) => {
  chrome.storage.local.get([STORAGE_KEY], (result) => {
    const existingEntries = Array.isArray(result[STORAGE_KEY]) ? result[STORAGE_KEY] : []
    const updatedEntries = [...existingEntries, entry]
    chrome.storage.local.set({ [STORAGE_KEY]: updatedEntries }, () => callback(updatedEntries))
  })
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "closeTab") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length) {
        chrome.tabs.remove(tabs[0].id)
      }
    })
  }

  if (message.action === "refreshTab") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length) {
        chrome.tabs.reload(tabs[0].id)
      }
    })
  }

  if (message.action === "storeScrapedData" && message.data) {
    const tabId = sender.tab?.id ?? null
    const entry = {
      ...message.data,
      tabId,
      receivedAt: new Date().toISOString()
    }
    appendScrapedData(entry, (updatedEntries) => {
      sendResponse({ status: "stored", total: updatedEntries.length })
    })
    return true
  }

  if (message.action === "getScrapedData") {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      const entries = Array.isArray(result[STORAGE_KEY]) ? result[STORAGE_KEY] : []
      sendResponse({ status: "ok", data: entries })
    })
    return true
  }

  if (message.action === "clearScrapedData") {
    chrome.storage.local.remove([STORAGE_KEY], () => {
      sendResponse({ status: "cleared" })
    })
    return true
  }
})
