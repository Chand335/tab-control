# Page Control Extension

This Chrome extension adds quick page controls and AI-powered insights for any tab you open.

## Features

- Refresh and close buttons injected directly into pages.
- Popup with refresh, close, and AI analysis controls.
- Options page for securely storing an AI API key and selecting the model.
- Background service worker streams responses from the AI API and caches results per page/model.
- Popup UI displays structured AI insights and lets you copy or export them as JSON.

## Getting Started

1. Install dependencies (none required for the extension itself).
2. In Chrome, open `chrome://extensions`, enable **Developer mode**, and choose **Load unpacked**.
3. Select the `tab-control` folder.
4. Configure your AI API key and model under the extension's **Options** page. The key is saved locally via `chrome.storage.local` and is never checked into source control.
5. Navigate to any page, open the extension popup, and click **Analyze with AI**.

## Notes

- The extension calls the OpenAI Chat Completions API by default. You can change the model identifier from the options page, including custom deployments.
- Responses are cached for the active session based on page content and model to reduce repeat requests.
- AI outputs are requested in JSON form, but if a response is not valid JSON it will still be available under the `insights` key when exporting or copying.
