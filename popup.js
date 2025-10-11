const statusEl = document.getElementById("status")
const outputEl = document.getElementById("aiOutput")
const analyzeBtn = document.getElementById("analyzeBtn")
const copyBtn = document.getElementById("copyBtn")
const exportBtn = document.getElementById("exportBtn")

const port = chrome.runtime.connect({ name: "ai-analysis" })
let latestResult = ""
let isAnalyzing = false
let isCancelling = false

function setStatus(message, isError = false) {
  statusEl.textContent = message
  statusEl.style.color = isError ? "#d32f2f" : "#555"
}

function cancelActiveRequest() {
  if (!isAnalyzing || isCancelling) {
    return
  }
  isCancelling = true
  setStatus("Cancelling...")
  analyzeBtn.disabled = true
  port.postMessage({ type: "cancel" })
}

function getStructuredData() {
  const raw = latestResult.trim()
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch (err) {
    return { insights: raw }
  }
}

function downloadJSON(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "ai-insights.json"
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

port.onMessage.addListener((message) => {
  switch (message.type) {
    case "chunk":
      outputEl.value = message.full
      latestResult = message.full
      setStatus("Streaming response...")
      isAnalyzing = true
      isCancelling = false
      analyzeBtn.disabled = false
      break
    case "complete":
      outputEl.value = message.full
      latestResult = message.full
      setStatus("Analysis complete")
      isAnalyzing = false
      isCancelling = false
      analyzeBtn.disabled = false
      break
    case "cached":
      outputEl.value = message.full
      latestResult = message.full
      setStatus("Loaded from cache")
      isAnalyzing = false
      isCancelling = false
      analyzeBtn.disabled = false
      break
    case "error":
      setStatus(message.message || "AI request failed", true)
      isAnalyzing = false
      isCancelling = false
      analyzeBtn.disabled = false
      break
    case "cancelled":
      isAnalyzing = false
      isCancelling = false
      analyzeBtn.disabled = false
      setStatus("")
      break
    default:
      break
  }
})

port.onDisconnect.addListener(() => {
  isAnalyzing = false
  isCancelling = false
  analyzeBtn.disabled = false
  setStatus("Connection to background lost", true)
})

document.getElementById("closeBtn").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.remove(tabs[0].id)
  })
})

document.getElementById("refreshBtn").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.reload(tabs[0].id)
  })
})

analyzeBtn.addEventListener("click", () => {
  if (isCancelling) {
    return
  }

  if (isAnalyzing) {
    cancelActiveRequest()
    return
  }

  analyzeBtn.disabled = true
  setStatus("Collecting page text...")
  outputEl.value = ""
  latestResult = ""
  isAnalyzing = true
  isCancelling = false

  chrome.runtime.sendMessage({ action: "scrapePageText" }, (response) => {
    if (chrome.runtime.lastError) {
      setStatus(chrome.runtime.lastError.message, true)
      analyzeBtn.disabled = false
      isAnalyzing = false
      isCancelling = false
      return
    }

    if (response?.error) {
      setStatus(response.error, true)
      analyzeBtn.disabled = false
      isAnalyzing = false
      isCancelling = false
      return
    }

    const text = response?.text
    if (!text) {
      setStatus("Unable to collect page text", true)
      analyzeBtn.disabled = false
      isAnalyzing = false
      isCancelling = false
      return
    }

    setStatus("Sending to AI...")
    port.postMessage({ type: "analyze", text })
    analyzeBtn.disabled = false
  })
})

window.addEventListener("beforeunload", () => {
  cancelActiveRequest()
})

window.addEventListener("pagehide", () => {
  cancelActiveRequest()
})

copyBtn.addEventListener("click", async () => {
  const data = getStructuredData()
  if (!data) {
    setStatus("Nothing to copy", true)
    return
  }
  try {
    await navigator.clipboard.writeText(JSON.stringify(data, null, 2))
    setStatus("Copied to clipboard")
  } catch (error) {
    setStatus("Clipboard copy failed", true)
  }
})

exportBtn.addEventListener("click", () => {
  const data = getStructuredData()
  if (!data) {
    setStatus("Nothing to export", true)
    return
  }
  downloadJSON(data)
  setStatus("Exported JSON")
})
