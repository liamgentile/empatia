function isSelectedSocialMediaSite() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["selectedSites"], function (result) {
      const selectedSites = result.selectedSites || [];
      const currentUrl = window.location.href.toLowerCase();

      const isSelected = selectedSites.some((site) =>
        currentUrl.includes(site)
      );

      resolve(isSelected);
    });
  });
}

let lastValue = "";
let typingTimeout;
const minimumWordCount = 5;
const delay = 1000;

function handleTyping(userInput) {
  const currentText = userInput.trim();
  const wordCount = currentText.split(/\s+/).filter(Boolean).length;

  console.log(currentText);
  if (wordCount >= minimumWordCount) {
    clearTimeout(typingTimeout);

    typingTimeout = setTimeout(async () => {
      if (await isSelectedSocialMediaSite()) {
        console.log("Site is selected for sentiment analysis.");
        if (currentText !== lastValue) {
          lastValue = currentText;

          chrome.runtime.sendMessage(
            { action: "getSentiment", text: currentText },
            (response) => {
              const sentimentScore = response.sentimentScore;
              console.log("Sentiment Score:", response);

              const popupElement = document.querySelector('.typing-popup');

              if (sentimentScore > 2) {
                // Request a random positive reinforcement message
                chrome.runtime.sendMessage(
                  { action: "getRandomPositiveReinforcementMessage" },
                  (positiveResponse) => {
                      console.log(positiveResponse.message);
                    if (positiveResponse.message) {
                        popupElement.innerHTML = `
                        <div style="color: green;">${positiveResponse.message}</div>
                      `;
                    }
                  }
                );
              }
            }
          );
        }
      }
    }, delay);
  }
}

let lastPopupElement = null; // Track the last popup element

function showPopup(target) {
    // Remove the previous popup if it exists
  if (lastPopupElement) {
    lastPopupElement.remove();
  }
  const popupHTML = `
    <div class="typing-popup" style="position: absolute; background-color: #fff; border: 1px solid #ccc; padding: 10px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1); display: block; z-index: 9999;">
    <div class="spinner" style="border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 24px; height: 24px; animation: spin 2s linear infinite; margin-bottom: 10px;"></div>
        Analyzing text...
    </div>
  `;

  target.insertAdjacentHTML("afterend", popupHTML);
  lastPopupElement = target.nextElementSibling;
}

document.addEventListener("input", (event) => {
  const { target } = event;

  // reddit specific implementation
  const textElement =
    target.shadowRoot?.querySelector('[role="textbox"]') ||
    target.querySelector("[data-lexical-text=true]");

  if (!target.matches("shreddit-simple-composer, shreddit-composer")) return;

  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    showPopup(target);
    handleTyping(textElement?.innerText ?? "");
  }, delay);
});
