
import { pipeline } from '@huggingface/transformers';

export const getEmotions(text) {
    const classifier = await pipeline("text-classification", "SamLowe/roberta-base-go_emotions", "top_k=None");

    const emotionsSummaryArray = classifier([text]);

    const highScoringEmotions = emotionsSummaryArray
    .filter(item => item.score >= 0.5)
    .map(item => item.label);

    return highScoringEmotions;
}