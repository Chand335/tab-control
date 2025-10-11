const DEFAULT_RETENTION_DAYS = 30
const DEFAULT_MAX_ENTRIES = 200

document.addEventListener("DOMContentLoaded", async () => {
  const apiKeyInput = document.getElementById("apiKey")
  const modelSelect = document.getElementById("model")
  const customModelInput = document.getElementById("customModel")
  const scrapeRetentionInput = document.getElementById("scrapeRetentionDays")
  const scrapeMaxEntriesInput = document.getElementById("scrapeMaxEntries")
  const status = document.getElementById("status")
  const saveBtn = document.getElementById("save")

  chrome.storage.local.get(
    ["aiApiKey", "aiModel", "scrapeRetentionDays", "scrapeMaxEntries"],
    ({ aiApiKey, aiModel, scrapeRetentionDays, scrapeMaxEntries }) => {
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
      const retentionValue = parseInt(scrapeRetentionDays, 10)
      const maxEntriesValue = parseInt(scrapeMaxEntries, 10)
      scrapeRetentionInput.value =
        Number.isFinite(retentionValue) && retentionValue > 0
          ? retentionValue
          : DEFAULT_RETENTION_DAYS
      scrapeMaxEntriesInput.value =
        Number.isFinite(maxEntriesValue) && maxEntriesValue > 0
          ? maxEntriesValue
          : DEFAULT_MAX_ENTRIES
    }
  )

  saveBtn.addEventListener("click", () => {
    const apiKey = apiKeyInput.value.trim()
    const selectedModel = modelSelect.value
    const customModel = customModelInput.value.trim()
    const model = customModel || selectedModel
    const retentionDays = parseInt(scrapeRetentionInput.value, 10)
    const maxEntries = parseInt(scrapeMaxEntriesInput.value, 10)

    chrome.storage.local.set(
      {
        aiApiKey: apiKey,
        aiModel: model || "gpt-4o-mini",
        scrapeRetentionDays:
          Number.isFinite(retentionDays) && retentionDays > 0
            ? retentionDays
            : DEFAULT_RETENTION_DAYS,
        scrapeMaxEntries:
          Number.isFinite(maxEntries) && maxEntries > 0
            ? maxEntries
            : DEFAULT_MAX_ENTRIES,
      },
      () => {
        status.textContent = "Settings saved."
        setTimeout(() => (status.textContent = ""), 3000)
      }
    )
  })
})
