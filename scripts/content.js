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

function attachPopupCloseListener(popupContainer) {
  popupContainer.querySelectorAll(".close-popup").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      popupContainer.remove();
    });
  });
}

function ensureShadowRoot() {
  let shadowHost = document.getElementById("empatia-shadow-host");

  if (!shadowHost) {
    shadowHost = document.createElement("div");
    shadowHost.id = "empatia-shadow-host";
    document.body.appendChild(shadowHost);
    shadowHost.attachShadow({ mode: "open" });
  }

  return shadowHost.shadowRoot;
}

function showPopup(target) {
  const shadowRoot = ensureShadowRoot();

  const existingPopup = shadowRoot.querySelector(".typing-popup");
  if (existingPopup) existingPopup.remove();

  const popupContainer = document.createElement("div");
  popupContainer.className = "typing-popup";

  popupContainer.innerHTML = `
    <link rel="stylesheet" href="${chrome.runtime.getURL(
      "styles/content.css"
    )}">
    <div class="popup-content">
      <button type="button" class="close-popup">&times;</button>
      <div>
        <div class="spinner"></div>
      </div>
    </div>
  `;

  shadowRoot.appendChild(popupContainer);

  const rect = target.getBoundingClientRect();
  const offset = window.location.href.includes("reddit") ? 0 : 6;
  popupContainer.style.position = "absolute";
  popupContainer.style.top = `${window.scrollY + rect.bottom + offset}px`;
  popupContainer.style.left = `${window.scrollX + rect.left}px`;

  attachPopupCloseListener(popupContainer);
}

function updatePopupContent(messageContent) {
  const shadowHost = document.getElementById("empatia-shadow-host");
  if (!shadowHost || !shadowHost.shadowRoot) return;

  const shadowRoot = shadowHost.shadowRoot;

  const popupContainer = shadowRoot.querySelector(".typing-popup");
  if (!popupContainer || !messageContent) return;

  const contentDiv = popupContainer.querySelector(".popup-content > div");
  const logoPath = chrome.runtime.getURL("icons/icon128.png");

  contentDiv.innerHTML = `
    <img src="${logoPath}" alt="Extension Logo" class="popup-icon">
    <span>${messageContent}</span>
  `;

  attachPopupCloseListener(popupContainer);
}

async function handleTyping(userInput) {
  const EMOTION_ACTIONS = {
    anger: { action: "getRandomAngerSuggestion", emoji: "😡" },
    annoyance: { action: "getRandomAnnoyanceSuggestion", emoji: "😒" },
    disgust: { action: "getRandomDisgustSuggestion", emoji: "🤢" },
    sadness: { action: "getRandomSadnessSuggestion", emoji: "😢" },
    default: { action: "getRandomGenericNegativeSuggestion", emoji: "😕" },
  };

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
    document.querySelector(".typing-popup")?.remove();
  }
}

let inactivityTimeout;

function resetInactivityTimer() {
  clearTimeout(inactivityTimeout);
  inactivityTimeout = setTimeout(() => {
    const shadowHost = document.getElementById("empatia-shadow-host");
    if (shadowHost && shadowHost.shadowRoot) {
      const popup = shadowHost.shadowRoot.querySelector(".typing-popup");
      popup?.remove();
    }
  }, 8000);
}

let debouncedHandler;

async function initialize() {
  const shadowHost = document.getElementById("empatia-shadow-host");
  if (shadowHost) {
    shadowHost.remove();
  }

  if (debouncedHandler) {
    document.removeEventListener("input", debouncedHandler);
    debouncedHandler = null;
  }

  if (await isSelectedSocialMediaSite()) {
    const minimumWordCount = await sendChromeMessage("getMinWordCount");

    debouncedHandler = debounce((event) => {
      const { target } = event;
      const textElement = getTextElement(target);
      const currentText = getCurrentText(textElement);

      const wordCount = currentText.split(/\s+/).filter(Boolean).length;

      if (!currentText || wordCount < minimumWordCount) {
        const shadowHost = document.getElementById("empatia-shadow-host");
        if (shadowHost && shadowHost.shadowRoot) {
          const popup = shadowHost.shadowRoot.querySelector(".typing-popup");
          popup?.remove();
        }
        return;
      }

      showPopup(target);
      handleTyping(currentText);

      resetInactivityTimer();
    }, 500);

    document.addEventListener("input", debouncedHandler);
  }
}

initialize();

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "extensionSettingsUpdated") {
    initialize();
  }
});
