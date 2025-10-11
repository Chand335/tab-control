const aiCache = new Map()

function buildCacheKey(text, model) {
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i)
    hash |= 0
  }
  return `${model}:${hash}`
}

async function loadSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["aiApiKey", "aiModel"], (items) => {
      resolve(items)
    })
  })
}

async function callOpenAI({ apiKey, model, text, port, cacheKey, controller }) {
  const url = "https://api.openai.com/v1/chat/completions"
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    signal: controller.signal,
    body: JSON.stringify({
      model,
      stream: true,
      messages: [
        {
          role: "system",
          content:
            "You are an assistant that summarizes web pages into structured JSON with sections for keyPoints, actions, and data.",
        },
        {
          role: "user",
          content: text,
        },
      ],
    }),
  })

  if (!response.ok || !response.body) {
    const errorText = await response.text()
    throw new Error(
      `Request failed with status ${response.status}: ${errorText || "Unknown error"}`
    )
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder("utf-8")
  let buffer = ""
  let aggregated = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    const lines = buffer.split("\n")
    buffer = lines.pop() || ""

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue
      if (trimmed === "data: [DONE]") {
        port.postMessage({ type: "complete", full: aggregated })
        aiCache.set(cacheKey, aggregated)
        return aggregated
      }
      if (!trimmed.startsWith("data:")) continue
      try {
        const payload = JSON.parse(trimmed.replace(/^data: /, ""))
        const delta = payload?.choices?.[0]?.delta?.content
        if (delta) {
          aggregated += delta
          port.postMessage({ type: "chunk", delta, full: aggregated })
        }
      } catch (error) {
        console.error("Failed to parse chunk", error)
      }
    }
  }

  if (buffer.trim().length > 0) {
    const trimmed = buffer.trim()
    if (trimmed === "data: [DONE]") {
      port.postMessage({ type: "complete", full: aggregated })
      aiCache.set(cacheKey, aggregated)
      return aggregated
    }
    if (trimmed.startsWith("data:")) {
      try {
        const payload = JSON.parse(trimmed.replace(/^data: /, ""))
        const delta = payload?.choices?.[0]?.delta?.content
        if (delta) {
          aggregated += delta
        }
      } catch (error) {
        console.error("Failed to parse trailing chunk", error)
      }
    }
  }

  port.postMessage({ type: "complete", full: aggregated })
  aiCache.set(cacheKey, aggregated)
  return aggregated
}

const portControllers = new WeakMap()

function abortControllerForPort(port) {
  const controller = portControllers.get(port)
  if (controller) {
    controller.abort()
    portControllers.delete(port)
    return true
  }
  return false
}

async function handleAnalysisRequest({ text, port, controller }) {
  const { aiApiKey, aiModel } = await loadSettings()
  if (!aiApiKey) {
    port.postMessage({
      type: "error",
      message:
        "No API key found. Please add one via the extension options page before requesting AI analysis.",
    })
    if (portControllers.get(port) === controller) {
      portControllers.delete(port)
    }
    return
  }

  const model = aiModel || "gpt-4o-mini"
  const cacheKey = buildCacheKey(text, model)
  if (aiCache.has(cacheKey)) {
    const cached = aiCache.get(cacheKey)
    port.postMessage({ type: "cached", full: cached })
    port.postMessage({ type: "complete", full: cached })
    if (portControllers.get(port) === controller) {
      portControllers.delete(port)
    }
    return cached
  }

  if (controller.signal.aborted) {
    port.postMessage({ type: "cancelled" })
    if (portControllers.get(port) === controller) {
      portControllers.delete(port)
    }
    return
  }

  try {
    await callOpenAI({
      apiKey: aiApiKey,
      model,
      text,
      port,
      cacheKey,
      controller,
    })
  } catch (error) {
    if (error.name === "AbortError" || error?.message?.includes("aborted")) {
      port.postMessage({ type: "cancelled" })
    } else {
      console.error(error)
      port.postMessage({ type: "error", message: error.message })
    }
  } finally {
    if (portControllers.get(port) === controller) {
      portControllers.delete(port)
    }
  }
}

chrome.runtime.onConnect.addListener((port) => {
  if (port.name === "ai-analysis") {
    port.onMessage.addListener((message) => {
      if (message.type === "analyze") {
        abortControllerForPort(port)
        const controller = new AbortController()
        portControllers.set(port, controller)
        handleAnalysisRequest({ text: message.text, port, controller }).catch(
          (error) => {
            console.error(error)
            port.postMessage({ type: "error", message: error.message })
          }
        )
      }
      if (message.type === "cancel") {
        const aborted = abortControllerForPort(port)
        if (!aborted) {
          port.postMessage({ type: "cancelled" })
        }
      }
    })
    port.onDisconnect.addListener(() => {
      abortControllerForPort(port)
    })
  }
})

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
  if (message.action === "scrapePageText") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || tabs.length === 0) {
        sendResponse({ error: "No active tab found" })
        return
      }
      chrome.tabs.sendMessage(
        tabs[0].id,
        { action: "collectPageText" },
        (response) => {
          if (chrome.runtime.lastError) {
            sendResponse({ error: chrome.runtime.lastError.message })
            return
          }
          sendResponse(response)
        }
      )
    })
    return true
  }
})
