importScripts("ui.js");

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "lf_tools_base64",
    title: "LF Tools Base64",
    contexts: ["page", "selection", "editable"]
  });
});

function openLfToolsPopup(tabId, initialText) {
  return chrome.scripting.executeScript({
    target: { tabId },
    func: lfToolsPopup,
    args: [initialText]
  });
}

// Used where scripts can't be injected (chrome:// pages, Web Store, PDF viewer).
function openFallbackWindow(initialText) {
  const url =
    chrome.runtime.getURL("fallback.html") +
    (initialText ? "#" + encodeURIComponent(initialText) : "");
  chrome.windows.create({ url, type: "popup", width: 1100, height: 700 });
}

async function readClipboardInTab(tabId) {
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId },
    func: async () => {
      try {
        const text = await navigator.clipboard.readText();
        return (text || "").trim();
      } catch (e) {
        return "";
      }
    }
  });
  return (result || "").trim();
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  let text = (info.selectionText || "").trim();

  if (!tab || tab.id === undefined || tab.id < 0) {
    openFallbackWindow(text);
    return;
  }

  // No selection: try to pull clipboard text and use it as initial input.
  if (!text) {
    try {
      text = await readClipboardInTab(tab.id);
    } catch (e) {
      // Injection not allowed on this page; the fallback window reads the clipboard itself.
      openFallbackWindow("");
      return;
    }
  }

  try {
    await openLfToolsPopup(tab.id, text);
  } catch (e) {
    openFallbackWindow(text);
  }
});
