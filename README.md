# Empatia

Empatia is a Chrome extension that provides real-time analysis of social media comments to identify emotional content and deliver inline feedback. This project was primarily built as a learning experience for creating Chrome extensions, serving as a foundational starting point for more complex projects in the future.

## Features

Real-time emotional analysis: Empatia analyzes your social media comments and provides feedback based on the emotional content of your message.

Support for multiple platforms: Currently available on Reddit, Bluesky, and Twitter (X).

Adjustable model sensitivity: Control the sensitivity of emotional analysis, which adjusts the threshold for triggering negative emotion feedback messages.

Positive reinforcement and emotion-specific feedback: Depending on the sentiment, receive positive reinforcement or suggestions to deal with negative emotions (anger, annoyance, disgust, sadness).

## How It Works (User Perspective)

1. Select supported sites: Choose which sites (Reddit, Bluesky, or Twitter) Empatia will run on.

2. Adjust sensitivity: Set the sensitivity for emotional feedback (higher sensitivity will detect negative emotions with a lower threshold).

3. Set the minimum word count you want there to be before Empatia starts analyzing the text. 

3. Write a comment or post: As you type, Empatia sends your text through sentiment analysis to assess its emotional polarity.

Positive feedback: Receive messages encouraging positive interactions if your comment is classified as positive.

Negative feedback: If your comment is negative, the system classifies the emotion and provides specific feedback (anger, annoyance, disgust, sadness).

## Technical Details

##### preferences.js

Handles the capturing and retrieval of user preferences.  

##### content.js

Contains the logic for detecting text input, analyzing it for sentiment, and displaying the corresponding feedback in an inline popup.

##### background.js

Acts as the backend of the extension, managing communication between the content script and storage for retrieving and setting user preferences, as well as interacting with sentiment and emotion analysis models.

## Acknowledgements

Thanks to https://www.npmjs.com/package/sentiment, this extension can determine the emotional polarity of text.

Thanks to https://huggingface.co/SamLowe/roberta-base-go_emotions, this extension  can assign specific negative emotions to text.

Thanks to <a href="https://www.flaticon.com/free-icons/letter-e" title="letter e icons">Letter e icons created by arnikahossain - Flaticon</a>, this extension has an icon. 

## How to Test the Chrome Extension Locally

##### Prerequisites

Ensure you have Google Chrome or Brave installed.

Clone this repo somewhere on your machine. 

##### Steps

Open Chrome and navigate to the extensions management page by typing chrome://extensions/ in the address bar and pressing Enter. If using Brave, navigate to brave://extensions. 

At the top right corner of the Extensions page, toggle the Developer mode switch to turn it on.

Click the Load unpacked button.

In the file picker that appears, select the `empatia` folder. 

Once loaded, the extension will appear in the list on the Extensions page.

