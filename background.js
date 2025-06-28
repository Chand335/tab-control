chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "closeTab") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.remove(tabs[0].id)
    })
  }

  if (message.action === "refreshTab") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.reload(tabs[0].id)
    })
  }

  if (message.action === "nextTab" || message.action === "prevTab") {
    chrome.tabs.query({ currentWindow: true }, (tabs) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (activeTabs) => {
        const activeIndex = activeTabs[0].index
        let newIndex
        if (message.action === "nextTab") {
          newIndex = (activeIndex + 1) % tabs.length
        } else {
          newIndex = (activeIndex - 1 + tabs.length) % tabs.length
        }
        const targetTab = tabs.find((tab) => tab.index === newIndex)
        if (targetTab) {
          chrome.tabs.update(targetTab.id, { active: true })
        }
      })
    })
  }
})
