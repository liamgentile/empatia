import { getEmotionalPolarity } from "./get-emotional-polarity.js";
import { isSelectedSocialMediaSite } from "./is-selected-social-media-site.js";

// Make lastValue a global variable or store it in a more persistent scope
let lastValue = ""; 
let typingTimeout;
const minimumWordCount = 5; // Minimum number of words to trigger sentiment analysis
const delay = 1000; // Time (ms) to wait after the user stops typing before triggering sentiment analysis

// Function to handle user input and trigger sentiment analysis
export function handleTyping(userInput) {
  console.log("handle typing reached");
  const currentText = userInput.trim();
  const wordCount = currentText.split(/\s+/).filter(Boolean).length; // Count words

  if (wordCount >= minimumWordCount) {
    clearTimeout(typingTimeout); // Clear the previous timeout

    typingTimeout = setTimeout(() => {
      if (isSelectedSocialMediaSite()) {
        if (currentText !== lastValue) {
          lastValue = currentText; // Update the last typed value

          const sentimentScore = getEmotionalPolarity(currentText);
          console.log("Sentiment Score:", sentimentScore);

          // Here you can perform your logic based on the sentiment score (positive/negative)
          if (sentimentScore < 0) {
            console.log("Consider rephrasing your comment");
          }
        }
      }
    }, delay); // Trigger analysis after a delay
  }
}
