// set up preferences
const checkboxes = document.querySelectorAll("#social-media-checkboxes input");
const sensitivitySlider = document.querySelector("#sentiment-slider");

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
