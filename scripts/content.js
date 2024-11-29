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

function handleTyping(userInput) {
  const currentText = userInput.trim();
  const wordCount = currentText.split(/\s+/).filter(Boolean).length;
  const minimumWordCount = 5;

  let typingTimeout;
  let lastValue = "";

  if (wordCount >= minimumWordCount) {
    clearTimeout(typingTimeout);

    typingTimeout = setTimeout(async () => {
      if (currentText !== lastValue) {
        lastValue = currentText;

        chrome.runtime.sendMessage(
          { action: "getSentiment", text: currentText },
          (response) => {
            const sentimentScore = response.sentimentScore;

            const popupElement = document.querySelector(".typing-popup");

            if (sentimentScore > 2) {
              chrome.runtime.sendMessage(
                { action: "getRandomPositiveReinforcementMessage" },
                (positiveResponse) => {
                  if (positiveResponse.message) {
                    popupElement.innerHTML = `
                        <div style="color: green;">${positiveResponse.message}</div>
                      `;
                  }
                }
              );
            }

            if (sentimentScore < 0) {
              chrome.runtime.sendMessage(
                { action: "getPredominantEmotion" },
                (response) => {
                  if (response.emotion === "anger") {
                    chrome.runtime.sendMessage(
                      { action: "getRandomAngerSuggestion" },
                      (response) => {
                        if (response.message) {
                          popupElement.innerHTML = `
                              <div style="color: red;">${response.message}</div>
                            `;
                        }
                      }
                    );
                  } else if (response.emotion === "disgust") {
                    chrome.runtime.sendMessage(
                      { action: "getRandomAnnoyanceSuggestion" },
                      (response) => {
                        if (response.message) {
                          popupElement.innerHTML = `
                              <div style="color: red;">${response.message}</div>
                            `;
                        }
                      }
                    );
                  } else {
                    chrome.runtime.sendMessage(
                      { action: "getRandomDisgustSuggestion" },
                      (response) => {
                        if (response.message) {
                          popupElement.innerHTML = `
                              <div style="color: red;">${response.message}</div>
                            `;
                        }
                      }
                    );
                  }
                }
              );
            }
          }
        );
      }
    }, 500);
  }
}

function showPopup(target) {
  const previousPopup = document.querySelector(".typing-popup");

  if (previousPopup) {
    previousPopup.remove();
  }
  const popupHTML = `
    <div class="typing-popup" style="position: absolute; background-color: #fff; border: 1px solid #ccc; padding: 10px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1); display: block; z-index: 9999;">
    <div class="spinner" style="border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 24px; height: 24px; animation: spin 2s linear infinite; margin-bottom: 10px;"></div>
        Analyzing text...
    </div>
  `;

  target.insertAdjacentHTML("afterend", popupHTML);
}

async function initialize() {
  if (await isSelectedSocialMediaSite()) {
    document.addEventListener("input", (event) => {
      const { target } = event;

      // reddit specific implementation
      const textElement =
        target.shadowRoot?.querySelector('[role="textbox"]') ||
        target.querySelector("[data-lexical-text=true]");

      if (!target.matches("shreddit-simple-composer, shreddit-composer"))
        return;

      clearTimeout(typingTimeout);
      typingTimeout = setTimeout(() => {
        showPopup(target);
        handleTyping(textElement?.innerText ?? "");
      }, 500);
    });
  }
}

initialize();
