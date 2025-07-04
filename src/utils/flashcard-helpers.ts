import { CardData } from "@/hooks/use-flashcards"; // Updated import

/**
 * Selects a flashcard based on a weighted random distribution,
 * giving higher probability to cards with lower correct counts (less mastered).
 * @param cards An array of flashcard objects.
 * @returns A randomly selected flashcard, or null if the array is empty.
 */
export const getWeightedRandomCard = (cards: CardData[]): CardData | null => {
  if (cards.length === 0) return null;

  // Assign base weights based on status
  // 'new' cards are prioritized most, then 'learning', then 'mastered'
  const getBaseWeight = (status: CardData['status']): number => {
    switch (status) {
      case 'new': return 3;
      case 'learning': return 2;
      case 'mastered': return 0.5; // Less likely to be picked
      default: return 1;
    }
  };

  const weightedCards = cards.map(card => {
    let weight = getBaseWeight(card.status);

    // Further adjust weight based on seen_count (less seen = higher weight)
    // Avoid division by zero if seen_count is 0
    weight *= (1 / (card.seen_count + 1));

    // Further adjust weight based on last_reviewed_at (older review = higher weight)
    if (card.last_reviewed_at) {
      const lastReviewedDate = new Date(card.last_reviewed_at);
      const now = new Date();
      const daysSinceReview = (now.getTime() - lastReviewedDate.getTime()) / (1000 * 60 * 60 * 24);
      // Exponential increase for older cards, but cap it to prevent extreme weights
      weight *= Math.min(5, Math.exp(daysSinceReview / 30)); // e.g., double weight every 30 days
    } else {
      // New cards or cards never reviewed get a boost
      weight *= 2;
    }

    return { card, weight };
  });

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