// Create buttons container
const buttonContainer = document.createElement("div")
buttonContainer.style.position = "fixed"
buttonContainer.style.top = "10px"
buttonContainer.style.right = "10px"
buttonContainer.style.zIndex = "9999"
buttonContainer.style.display = "flex"
buttonContainer.style.gap = "10px"

// Create Close button
const closeBtn = document.createElement("button")
closeBtn.textContent = "Close"
closeBtn.style.padding = "10px 15px"
closeBtn.style.background = "#ff4444"
closeBtn.style.color = "white"
closeBtn.style.border = "none"
closeBtn.style.borderRadius = "5px"
closeBtn.style.cursor = "pointer"

// Create Refresh button
const refreshBtn = document.createElement("button")
refreshBtn.textContent = "Refresh"
refreshBtn.style.padding = "10px 15px"
refreshBtn.style.background = "#00C851"
refreshBtn.style.color = "white"
refreshBtn.style.border = "none"
refreshBtn.style.borderRadius = "5px"
refreshBtn.style.cursor = "pointer"

// Add hover effects
closeBtn.addEventListener("mouseover", () => (closeBtn.style.opacity = "0.8"))
closeBtn.addEventListener("mouseout", () => (closeBtn.style.opacity = "1"))
refreshBtn.addEventListener(
  "mouseover",
  () => (refreshBtn.style.opacity = "0.8")
)
refreshBtn.addEventListener("mouseout", () => (refreshBtn.style.opacity = "1"))

// Add functionality
closeBtn.addEventListener("click", () => {
  chrome.runtime.sendMessage({ action: "closeTab" })
})

refreshBtn.addEventListener("click", () => {
  chrome.runtime.sendMessage({ action: "refreshTab" })
})

// Append elements to page
buttonContainer.appendChild(refreshBtn)
buttonContainer.appendChild(closeBtn)
document.body.appendChild(buttonContainer)
