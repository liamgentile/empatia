const checkboxes = document.querySelectorAll("#social-media-checkboxes input");
const sensitivitySlider = document.querySelector("#sentiment-slider");
const minWordCountInput = document.querySelector("#min-word-count");

chrome.runtime.sendMessage({ action: "getSelectedSites" }, (selectedSites) => {
  checkboxes.forEach((checkbox) => {
    checkbox.checked = selectedSites.includes(checkbox.value);
  });
});

checkboxes.forEach((checkbox) => {
  checkbox.addEventListener("change", () => {
    const selectedSites = Array.from(checkboxes)
      .filter((checkbox) => checkbox.checked)
      .map((checkbox) => checkbox.value);

    chrome.runtime.sendMessage({ action: "setSelectedSites", selectedSites });
  });
});

chrome.runtime.sendMessage(
  { action: "getModelSensitivity" },
  (modelSensitivity) => {
    sensitivitySlider.value = modelSensitivity;
  }
);

sensitivitySlider.addEventListener("change", () => {
  chrome.runtime.sendMessage({
    action: "setModelSensitivity",
    modelSensitivity: sensitivitySlider.value,
  });
});

chrome.runtime.sendMessage({ action: "getMinWordCount" }, (minWordCount) => {
  minWordCountInput.value = minWordCount;
});

minWordCountInput.addEventListener("change", () => {
  chrome.runtime.sendMessage({
    action: "setMinWordCount",
    minWordCount: minWordCountInput.value,
  });
});

chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          document.dispatchEvent(new Event('extensionSettingsUpdated'));
        }
      });
    });
  });