import { pipeline } from '@huggingface/transformers';

export const getEmotionalPolarity(text) {
    const classifier = await pipeline("sentiment-analysis");

    const output = classifier(text);

    return output
}