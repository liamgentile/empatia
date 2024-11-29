import Sentiment from "https://cdn.jsdelivr.net/npm/sentiment@5.0.2/+esm";
import { positiveReinforcementMessages } from "../content/positive-reinforcement.js";

chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
  if (message.action === "getSelectedSites") {
    chrome.storage.local.get("selectedSites", (result) => {
      sendResponse(result.selectedSites || []);
    });
    return true;
  }

  if (message.action === "setSelectedSites") {
    chrome.storage.local.set({ selectedSites: message.selectedSites }, () => {
      sendResponse({ status: "success" });
    });
    return true;
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

  if (message.action === "getSentiment") {
    const sentiment = new Sentiment();
    const sentimentResult = sentiment.analyze(message.text);
    sendResponse({ sentimentScore: sentimentResult.score });
    return true;
  }

  if (message.action === "getRandomPositiveReinforcementMessage") {
    const randomMessage =
      positiveReinforcementMessages[
        Math.floor(Math.random() * positiveReinforcementMessages.length)
      ];
    sendResponse({ message: randomMessage });

    return true;
  }
});