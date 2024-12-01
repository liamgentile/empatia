# empatia

This chrome extension provides real-time analysis of social media comments to identify emotional content and provide inline feedback.

I built this project primarily to learn about Chrome extensions.  It's a great starting point if I ever want to build a more ambitious extension. 

#### This is how the extension works (from a user perspective):

1. Select which sites you want to enable empatia for. Right now it's only available to run on Reddit, Bluesky, and Twitter (X).

2. Adjust the sensitivity.  More sensitive = a lower threshold for triggering emotion-specific inline comments.    

3. Write a comment or a post.  As you're typing, empatia will send your text through sentiment.js (https://www.npmjs.com/package/sentiment) to determine its emotional polarity.

4. You'll see positive reinforcement messages if your comment is positive.

5. If your comment is negative, your text will be classified by the model `SamLowe/roberta-base-go_emotions` via `@huggingface/transformers`, and you'll receive emotion-specific messages (anger, annoyance, disgust, sadness), which may encourage you to rephrase or reconsider your social media engagement. 
