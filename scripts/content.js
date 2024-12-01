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

function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    const context = this;
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(context, args), delay);
  };
}

async function handleTyping(userInput) {
  const currentText = userInput.trim();
  const wordCount = currentText.split(/\s+/).filter(Boolean).length;
  const minimumWordCount = 5;

  // Remove popup if text is empty
  const popupElement = document.querySelector(".typing-popup");
  if (!currentText || wordCount < minimumWordCount) {
    if (popupElement) {
      popupElement.remove();
    }
    return;
  }

  try {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const modelSensitivityResponse = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: "getModelSensitivity" }, resolve);
    });

    let negativeThreshold;
    switch (modelSensitivityResponse) {
      case 5:
        negativeThreshold = 0;
        break;
      case 4:
        negativeThreshold = -3;
        break;
      case 3:
        negativeThreshold = -6;
        break;
      case 2:
        negativeThreshold = -9;
        break;
      case 1:
        negativeThreshold = -12;
        break;
    }

    let messageContent = "";
    let messageEmoji = "";

    const getSentimentResponse = await new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { action: "getSentiment", text: currentText },
        resolve
      );
    });

    const sentimentScore = getSentimentResponse.sentimentScore;

    if (sentimentScore > 2) {
      const positiveResponse = await new Promise((resolve) => {
        chrome.runtime.sendMessage(
          { action: "getRandomPositiveReinforcementMessage" },
          resolve
        );
      });

      if (positiveResponse.message) {
        messageEmoji = "😄";
        messageContent = `${messageEmoji} ${positiveResponse.message}`;
      }
    } else if (sentimentScore > negativeThreshold && sentimentScore <= 2) {
      messageEmoji = "😎";
      messageContent = `${messageEmoji} You're doing great!`;
    } else {
      const emotionResponse = await new Promise((resolve) => {
        chrome.runtime.sendMessage(
          { action: "getPredominantEmotion" },
          resolve
        );
      });

      let suggestionAction;
      let emotionEmoji;

      switch (emotionResponse.emotion) {
        case "anger":
          suggestionAction = "getRandomAngerSuggestion";
          emotionEmoji = "😡";
          break;
        case "annoyance":
          suggestionAction = "getRandomAnnoyanceSuggestion";
          emotionEmoji = "😒";
          break;
        case "disgust":
          suggestionAction = "getRandomDisgustSuggestion";
          emotionEmoji = "🤢";
          break;
        case "sadness":
          suggestionAction = "getRandomSadnessSuggestion";
          emotionEmoji = "😢";
          break;
        default:
          suggestionAction = "getRandomGenericNegativeSuggestion";
          emotionEmoji = "😕";
      }

      const suggestionResponse = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: suggestionAction }, resolve);
      });

      if (suggestionResponse.message) {
        messageEmoji = emotionEmoji;
        messageContent = `Feeling ${messageEmoji}? ${suggestionResponse.message}`;
      }
    }

    // Update popup with new styling
    if (messageContent) {
      popupElement.innerHTML = `
        <div class="popup-content" style="
          position: relative; 
          padding-right: 20px; 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          line-height: 1.5;
        ">
          <button type="button" class="close-popup" style="
            position: absolute;
            top: 0;
            right: 0;
            background: none;
            border: none;
            font-size: 20px;
            cursor: pointer;
            color: #888;
            padding: 0;
            line-height: 1;
          ">&times;</button>
          <div style="
            background-color: #f0f0f0;
            border-radius: 8px;
            padding: 12px;
            font-size: 14px;
            color: #333;
          ">
            ${messageContent}
          </div>
        </div>
      `;
      attachPopupCloseListener();
    }
  } catch (error) {
    console.error("Error processing typing:", error);
  }
}

function showPopup(target) {
  const previousPopup = document.querySelector(".typing-popup");
  if (previousPopup) {
    previousPopup.remove();
  }

  const popupHTML = `
    <div class="typing-popup" style="
      position: absolute; 
      border: 1px solid #ccc; 
      padding: 10px; 
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1); 
      display: block; 
      z-index: 9999;
      background: white;
    ">
    <button type="button" class="close-popup" style="
          position: absolute;
          top: 0;
          right: 0;
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          color: #888;
          padding: 0;
          line-height: 1;
        ">&times;</button>
      <div class="popup-content" style="position: relative; padding-right: 20px;">
        <div class="spinner" style="
          border: 4px solid #f3f3f3; 
          border-top: 4px solid #3498db; 
          border-radius: 50%; 
          width: 24px; 
          height: 24px; 
          animation: spin 2s linear infinite; 
          margin-bottom: 10px;
        "></div>
        Analyzing text...
      </div>
    </div>
  `;

  target.insertAdjacentHTML("afterend", popupHTML);
  attachPopupCloseListener();
}

function attachPopupCloseListener() {
  const closeButtons = document.querySelectorAll(".close-popup");
  closeButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      const popup = button.closest(".typing-popup");
      if (popup) {
        popup.remove();
      }
    });
  });
}

async function initialize() {
  if (await isSelectedSocialMediaSite()) {
    const debouncedHandler = debounce((event) => {
      const { target } = event;

      let textElement;
      let currentText;

      if (window.location.href.includes("reddit")) {
        if (!target.matches("shreddit-simple-composer, shreddit-composer"))
          return;
        textElement =
          target.shadowRoot?.querySelector('[role="textbox"]') ||
          target.querySelector("[data-lexical-text=true]");

        currentText = textElement?.innerText ?? "";
      } else if (window.location.href.includes("bsky")) {
        if (!target.matches(".tiptap")) return;
        textElement = target;

        currentText = textElement?.innerText ?? "";
      } else if (window.location.href.includes("x.com")) {
        if (!target.matches("textarea, [content-editable=true]")) return;
        textElement = target;

        currentText = textElement?.value ?? "";
      }

      if (!currentText.trim()) {
        const existingPopup = document.querySelector(".typing-popup");
        if (existingPopup) {
          existingPopup.remove();
        }
        return;
      }

      showPopup(target);
      handleTyping(currentText);
    }, 500);

    document.addEventListener("input", debouncedHandler);
  }
}

initialize();
