// Background script to manage storage logic

// Listen for checkbox state changes and store the selected sites
chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
  if (message.action === "getSelectedSites") {
    chrome.storage.local.get("selectedSites", (result) => {
      sendResponse(result.selectedSites || []);
    });
    return true; // to keep the response open
  }

  if (message.action === "setSelectedSites") {
    chrome.storage.local.set({ selectedSites: message.selectedSites }, () => {
      sendResponse({ status: "success" });
    });
    return true; // to keep the response open
  }

  if (message.action === "getModelSensitivity") {
    chrome.storage.local.get("modelSensitivity", (result) => {
      sendResponse(result.modelSensitivity || 3);
    });
    return true;
  }

  if (message.action === "setModelSensitivity") {
    chrome.storage.local.set(
      { modelSensitivity: message.modelSensitivity },
      () => {
        sendResponse({ status: "success" });
      }
    );
    return true;
  }
});
