// Create buttons container
const buttonContainer = document.createElement("div")
buttonContainer.style.position = "fixed"
buttonContainer.style.top = "10px"
buttonContainer.style.right = "10px"
// buttonContainer.style.left = "10px"
buttonContainer.style.zIndex = "9999"
buttonContainer.style.display = "flex"
buttonContainer.style.gap = "10px"
// buttonContainer.style.width = "100%"

// Create Close button
const closeBtn = document.createElement("button")
closeBtn.textContent = "Close"
closeBtn.style.padding = "10px 15px"
closeBtn.style.background = "#ff4444"
closeBtn.style.color = "white"
closeBtn.style.border = "none"
closeBtn.style.borderRadius = "5px"
closeBtn.style.cursor = "pointer"
closeBtn.style.width = "50%"

// Create Refresh button
const refreshBtn = document.createElement("button")
refreshBtn.textContent = "Refresh"
refreshBtn.style.padding = "10px 15px"
refreshBtn.style.background = "#00C851"
refreshBtn.style.color = "white"
refreshBtn.style.border = "none"
refreshBtn.style.borderRadius = "5px"
refreshBtn.style.cursor = "pointer"
refreshBtn.style.width = "50%"

// Create pervBtn button
const pervBtn = document.createElement("button")
pervBtn.textContent = "pervBtn"
pervBtn.style.padding = "10px 15px"
pervBtn.style.background = "#00C851"
pervBtn.style.color = "white"
pervBtn.style.border = "none"
pervBtn.style.borderRadius = "5px"
pervBtn.style.cursor = "pointer"
pervBtn.style.width = "50%"

// Create nextBtn button
const nextBtn = document.createElement("button")
nextBtn.textContent = "nextBtn"
nextBtn.style.padding = "10px 15px"
nextBtn.style.background = "#00C851"
nextBtn.style.color = "white"
nextBtn.style.border = "none"
nextBtn.style.borderRadius = "5px"
nextBtn.style.cursor = "pointer"
nextBtn.style.width = "50%"

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
pervBtn.addEventListener("click", () => {
  chrome.runtime.sendMessage({ action: "prevTab" })
})
nextBtn.addEventListener("click", () => {
  chrome.runtime.sendMessage({ action: "nextBtn" })
})

// Append elements to page
buttonContainer.appendChild(refreshBtn)
buttonContainer.appendChild(closeBtn)
buttonContainer.appendChild(pervBtn)
buttonContainer.appendChild(nextBtn)
document.body.appendChild(buttonContainer)
