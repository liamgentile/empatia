import Sentiment from "https://cdn.jsdelivr.net/npm/sentiment@5.0.2/+esm";
import { pipeline } from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.1.0";
import { positiveReinforcementMessages } from "../content/positive-reinforcement.js";
import { angerSuggestionsMessages } from "../content/anger-suggestions.js";
import { annoyanceSuggestionsMessages } from "../content/annoyance-suggestions.js";
import { disgustSuggestionsMessages } from "../content/disgust-suggestions.js";
import { sadnessSuggestionsMessages } from "../content/sadness-suggestions.js";
import { genericNegativeSuggestions } from "../content/generic-negative-suggestions.js";

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

  if (message.action === "getPredominantEmotion") {
    (async () => {
      try {
        const classifier = await pipeline(
          "text-classification",
          "SamLowe/roberta-base-go_emotions"
        );
        const emotionsSummaryArray = classifier([message.text]);

        const highestScoringEmotion = emotionsSummaryArray.reduce((max, item) =>
          item.score > max.score ? item : max
        );

        sendResponse({ emotion: highestScoringEmotion });
      } catch (error) {
        sendResponse({ emotion: "Error processing emotion" });
      }
    })();
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

  if (message.action === "getRandomAngerSuggestion") {
    const randomMessage =
      angerSuggestionsMessages[
        Math.floor(Math.random() * angerSuggestionsMessages.length)
      ];
    sendResponse({ message: randomMessage });

    return true;
  }

  if (message.action === "getRandomAnnoyanceSuggestion") {
    const randomMessage =
      annoyanceSuggestionsMessages[
        Math.floor(Math.random() * annoyanceSuggestionsMessages.length)
      ];
    sendResponse({ message: randomMessage });

    return true;
  }

  if (message.action === "getRandomDisgustSuggestion") {
    const randomMessage =
      disgustSuggestionsMessages[
        Math.floor(Math.random() * disgustSuggestionsMessages.length)
      ];
    sendResponse({ message: randomMessage });

    return true;
  }

  if (message.action === "getRandomSadnessSuggestion") {
    const randomMessage =
      sadnessSuggestionsMessages[
        Math.floor(Math.random() * sadnessSuggestionsMessages.length)
      ];
    sendResponse({ message: randomMessage });

    return true;
  }

  if (message.action === "getRandomGenericNegativeSuggestion") {
    const randomMessage =
      genericNegativeSuggestions[
        Math.floor(Math.random() * genericNegativeSuggestions.length)
      ];
    sendResponse({ message: randomMessage });

    return true;
  }
});
