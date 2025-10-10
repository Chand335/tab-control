(function () {
  if (window.__tabControlScraperLoaded) {
    return
  }
  window.__tabControlScraperLoaded = true

  const textContent = (element) =>
    element?.textContent?.trim().replace(/\s+/g, " ") || ""

  const collectHeadings = () => {
    const selectors = ["h1", "h2", "h3", "h4"]
    return Array.from(document.querySelectorAll(selectors.join(", "))).map((heading) => ({
      tag: heading.tagName.toLowerCase(),
      text: textContent(heading)
    }))
  }

  const collectParagraphs = (limit = 3) =>
    Array.from(document.querySelectorAll("p"))
      .map((paragraph) => textContent(paragraph))
      .filter(Boolean)
      .slice(0, limit)

  const collectMeta = () => {
    const description = document
      .querySelector('meta[name="description"]')
      ?.getAttribute("content")
    const keywords = document
      .querySelector('meta[name="keywords"]')
      ?.getAttribute("content")

    return {
      description: description ? description.trim() : "",
      keywords: keywords ? keywords.trim() : ""
    }
  }

  const collectTables = () => {
    const tables = Array.from(document.querySelectorAll("table"))
    return tables.map((table) => {
      const headers = Array.from(table.querySelectorAll("thead th")).map((header) =>
        textContent(header)
      )

      const rows = Array.from(table.querySelectorAll("tbody tr")).map((row) =>
        Array.from(row.querySelectorAll("th, td")).map((cell) => textContent(cell))
      )

      // Fallback to rows if <thead> is missing
      if (!headers.length && rows.length) {
        const firstRow = Array.from(table.querySelectorAll("tr"))[0]
        if (firstRow) {
          headers.push(
            ...Array.from(firstRow.querySelectorAll("th, td")).map((cell) =>
              textContent(cell)
            )
          )
        }
      }

      return {
        headers,
        rows
      }
    })
  }

  const payload = {
    url: window.location.href,
    title: document.title,
    meta: collectMeta(),
    headings: collectHeadings(),
    paragraphs: collectParagraphs(),
    tables: collectTables(),
    timestamp: new Date().toISOString()
  }

  try {
    chrome.runtime.sendMessage({
      action: "storeScrapedData",
      data: payload
    })
  } catch (error) {
    // In case messaging fails (e.g. because the extension context is not ready yet)
    console.error("tab-control scraper: unable to send payload", error)
  }
})()

