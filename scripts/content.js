function getChromeStorageValue(key, defaultValue = null) {
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (result) => {
      resolve(result[key] || defaultValue);
    });
  });
}

function sendChromeMessage(action, data = {}) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ ...data, action }, resolve);
  });
}

function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

async function isSelectedSocialMediaSite() {
  return getChromeStorageValue("selectedSites", []).then((selectedSites) => {
    const currentUrl = window.location.href.toLowerCase();
    return selectedSites.some((site) => currentUrl.includes(site));
  });
}

function getTextElement(target) {
  const url = window.location.href;

  if (url.includes("reddit")) {
    return target.matches("shreddit-simple-composer, shreddit-composer")
      ? target.shadowRoot?.querySelector('[role="textbox"]') ||
          target.querySelector("[data-lexical-text=true]")
      : null;
  }

  if (url.includes("bsky")) {
    return target.matches(".tiptap") ? target : null;
  }

  if (url.includes("x.com")) {
    return target.matches("textarea, [contenteditable=true]") ? target : null;
  }

  return null;
}

function getCurrentText(textElement) {
  return textElement?.innerText?.trim() || textElement?.value?.trim() || "";
}

function showPopup(target) {
  document.querySelector(".typing-popup")?.remove();

  const popupHTML = `
    <div class="typing-popup">
      <div class="popup-content">
        <button type="button" class="close-popup">&times;</button>
        <div>
          <div class="spinner"></div>
        </div>
      </div>
    </div>
  `;

  target.insertAdjacentHTML("afterend", popupHTML);
  attachPopupCloseListener();
}

function updatePopupContent(messageContent) {
  const popupElement = document.querySelector(".typing-popup");
  if (popupElement && messageContent) {
    const contentDiv = popupElement.querySelector(".popup-content > div");
    const logoPath = chrome.runtime.getURL("icons/icon128.png");

    contentDiv.innerHTML = `
      <img src="${logoPath}" alt="Extension Logo" class="popup-icon">
      <span>${messageContent}</span>
    `;
    attachPopupCloseListener();
  }
}

async function handleTyping(userInput) {
  const EMOTION_ACTIONS = {
    anger: { action: "getRandomAngerSuggestion", emoji: "😡" },
    annoyance: { action: "getRandomAnnoyanceSuggestion", emoji: "😒" },
    disgust: { action: "getRandomDisgustSuggestion", emoji: "🤢" },
    sadness: { action: "getRandomSadnessSuggestion", emoji: "😢" },
    default: { action: "getRandomGenericNegativeSuggestion", emoji: "😕" },
  };

  const wordCount = userInput.split(/\s+/).filter(Boolean).length;
  const minimumWordCount = await sendChromeMessage("getMinWordCount");
  const popupElement = document.querySelector(".typing-popup");

  if (!userInput || wordCount < minimumWordCount) {
    popupElement?.remove();
    return;
  }

  try {
    const modelSensitivity = await sendChromeMessage("getModelSensitivity");
    const negativeThreshold = [0, -3, -6, -9, -12][
      5 - Number(modelSensitivity)
    ];

    const { sentimentScore } = await sendChromeMessage("getSentiment", {
      text: userInput,
    });

    let messageContent = "";

    if (sentimentScore > 2) {
      const { message } = await sendChromeMessage(
        "getRandomPositiveReinforcementMessage"
      );
      messageContent = message ? `😄 ${message}` : "";
    } else if (sentimentScore >= negativeThreshold && sentimentScore <= 2) {
      messageContent = "😎 You're doing great!";
    } else {
      const { emotion } = await sendChromeMessage("getPredominantEmotion", {
        text: userInput,
      });

      const { action, emoji } =
        EMOTION_ACTIONS[emotion] || EMOTION_ACTIONS.default;

      const { message } = await sendChromeMessage(action);
      messageContent = message ? `Feeling ${emoji}? ${message}` : "";
    }

    updatePopupContent(messageContent);
  } catch (error) {
    console.error("Error processing typing:", error);
  }
}

function attachPopupCloseListener() {
  document.querySelectorAll(".close-popup").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      button.closest(".typing-popup")?.remove();
    });
  });
}

async function initialize() {
  if (await isSelectedSocialMediaSite()) {
    const debouncedHandler = debounce((event) => {
      const { target } = event;
      const textElement = getTextElement(target);
      const currentText = getCurrentText(textElement);

      if (!currentText) {
        document.querySelector(".typing-popup")?.remove();
        return;
      }

      showPopup(target);
      handleTyping(currentText);
    }, 500);

    document.addEventListener("input", debouncedHandler);
  }
}

initialize();

document.addEventListener("extensionSettingsUpdated", initialize);
