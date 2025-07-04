import { CardData } from "@/hooks/use-firebase-flashcards";

/**
 * Selects a flashcard based on a weighted random distribution,
 * giving higher probability to cards with lower correct counts (less mastered).
 * @param cards An array of flashcard objects.
 * @returns A randomly selected flashcard, or null if the array is empty.
 */
export const getWeightedRandomCard = (cards: CardData[]): CardData | null => {
  if (cards.length === 0) return null;

  // Calculate weights: lower correctCount means higher weight
  // Using 1 / (correctCount + 1) to ensure cards with 0 correctCount have max weight
  const weightedCards = cards.map(card => ({
    card,
    weight: 1 / (card.correctCount + 1)
  }));

  const totalWeight = weightedCards.reduce((sum, wc) => sum + wc.weight, 0);
  let random = Math.random() * totalWeight;

  for (let i = 0; i < weightedCards.length; i++) {
    random -= weightedCards[i].weight;
    if (random <= 0) {
      return weightedCards[i].card;
    }
  }
  // Fallback in case of floating point inaccuracies (shouldn't happen often)
  return weightedCards[0].card;
};

/**
 * Calculates the character-based closeness percentage between two strings.
 * Useful for grading user answers against correct definitions.
 * @param userAns The user's answer string.
 * @param correctDef The correct definition string.
 * @returns A percentage (0-100) indicating how close the user's answer is to the correct definition.
 */
export const calculateCloseness = (userAns: string, correctDef: string): number => {
  const user = userAns.toLowerCase().trim();
  const correct = correctDef.toLowerCase().trim();
  if (correct.length === 0) return 0;
  let matches = 0;
  for (let i = 0; i < Math.min(user.length, correct.length); i++) {
    if (user[i] === correct[i]) {
      matches++;
    }
  }
  return parseFloat(((matches / correct.length) * 100).toFixed(2)); // Percentage
};