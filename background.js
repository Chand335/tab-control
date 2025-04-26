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
})
