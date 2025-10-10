document.addEventListener("DOMContentLoaded", async () => {
  const apiKeyInput = document.getElementById("apiKey")
  const modelSelect = document.getElementById("model")
  const customModelInput = document.getElementById("customModel")
  const status = document.getElementById("status")
  const saveBtn = document.getElementById("save")

  chrome.storage.local.get(["aiApiKey", "aiModel"], ({ aiApiKey, aiModel }) => {
    if (aiApiKey) {
      apiKeyInput.value = aiApiKey
    }
    if (aiModel) {
      const optionExists = Array.from(modelSelect.options).some(
        (opt) => opt.value === aiModel
      )
      if (optionExists) {
        modelSelect.value = aiModel
      } else {
        modelSelect.value = ""
        customModelInput.value = aiModel
      }
    }
  })

  saveBtn.addEventListener("click", () => {
    const apiKey = apiKeyInput.value.trim()
    const selectedModel = modelSelect.value
    const customModel = customModelInput.value.trim()
    const model = customModel || selectedModel

    chrome.storage.local.set(
      {
        aiApiKey: apiKey,
        aiModel: model || "gpt-4o-mini",
      },
      () => {
        status.textContent = "Settings saved."
        setTimeout(() => (status.textContent = ""), 3000)
      }
    )
  })
})
