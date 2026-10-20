import crypto from 'crypto';

export type ChallengeType = 'math' | 'word' | 'reverse' | 'logic';
export type ChallengeDifficulty = 'easy' | 'medium' | 'hard';

export interface GeneratedChallenge {
  type: ChallengeType;
  difficulty: ChallengeDifficulty;
  question: string;
  answer: string;
  audioPrompt: string; // Accessible text representation for speech synthesis
}

const NUMBER_WORDS: Record<number, string> = {
  0: 'zero',
  1: 'one',
  2: 'two',
  3: 'three',
  4: 'four',
  5: 'five',
  6: 'six',
  7: 'seven',
  8: 'eight',
  9: 'nine',
  10: 'ten',
  11: 'eleven',
  12: 'twelve',
  13: 'thirteen',
  14: 'fourteen',
  15: 'fifteen',
  16: 'sixteen',
  17: 'seventeen',
  18: 'eighteen',
  19: 'nineteen',
  20: 'twenty',
};

function getRandomInt(min: number, max: number): number {
  return crypto.randomInt(min, max + 1);
}

function pickRandom<T>(array: T[]): T {
  return array[crypto.randomInt(0, array.length)];
}

/**
 * Generate an accessible, randomized challenge based on difficulty
 */
export function generateChallenge(difficulty: ChallengeDifficulty = 'easy'): GeneratedChallenge {
  if (difficulty === 'hard') {
    return generateHardChallenge();
  }
  if (difficulty === 'medium') {
    return generateMediumChallenge();
  }
  return generateEasyChallenge();
}

/**
 * Easy challenges: Single-step addition or subtraction with numbers <= 25
 */
function generateEasyChallenge(): GeneratedChallenge {
  const isAddition = Math.random() > 0.4;

  if (isAddition) {
    const a = getRandomInt(2, 16);
    const b = getRandomInt(1, 14);
    const sum = a + b;

    const formats = [
      {
        question: `What is ${a} + ${b}?`,
        audio: `What is ${a} plus ${b}?`,
      },
      {
        question: `Calculate: ${a} + ${b}`,
        audio: `Calculate ${a} plus ${b}.`,
      },
      {
        question: `Add ${NUMBER_WORDS[a] || a} and ${NUMBER_WORDS[b] || b}:`,
        audio: `Add ${NUMBER_WORDS[a] || a} and ${NUMBER_WORDS[b] || b}.`,
      },
      {
        question: `Solve: ${a} + ${NUMBER_WORDS[b] || b}`,
        audio: `Solve ${a} plus ${NUMBER_WORDS[b] || b}.`,
      },
    ];

    const chosen = pickRandom(formats);
    return {
      type: 'math',
      difficulty: 'easy',
      question: chosen.question,
      answer: String(sum),
      audioPrompt: chosen.audio,
    };
  } else {
    // Subtraction (guarantee positive result)
    const a = getRandomInt(9, 28);
    const b = getRandomInt(2, a - 1);
    const diff = a - b;

    const formats = [
      {
        question: `What is ${a} - ${b}?`,
        audio: `What is ${a} minus ${b}?`,
      },
      {
        question: `Calculate: ${a} - ${b}`,
        audio: `Calculate ${a} minus ${b}.`,
      },
      {
        question: `Subtract ${NUMBER_WORDS[b] || b} from ${a}:`,
        audio: `Subtract ${NUMBER_WORDS[b] || b} from ${a}.`,
      },
    ];

    const chosen = pickRandom(formats);
    return {
      type: 'math',
      difficulty: 'easy',
      question: chosen.question,
      answer: String(diff),
      audioPrompt: chosen.audio,
    };
  }
}

/**
 * Medium challenges: Basic multiplication or word length queries
 */
function generateMediumChallenge(): GeneratedChallenge {
  const roll = Math.random();

  if (roll < 0.6) {
    // Multiplication
    const a = getRandomInt(3, 9);
    const b = getRandomInt(2, 8);
    const product = a * b;

    return {
      type: 'math',
      difficulty: 'medium',
      question: `What is ${a} × ${b}?`,
      answer: String(product),
      audioPrompt: `What is ${a} multiplied by ${b}?`,
    };
  } else {
    // Letter count
    const words = [
      { w: 'PYTHON', count: 6 },
      { w: 'VECTOR', count: 6 },
      { w: 'SECURE', count: 6 },
      { w: 'DIGITAL', count: 7 },
      { w: 'SYSTEM', count: 6 },
      { w: 'SERVER', count: 6 },
      { w: 'CLOUD', count: 5 },
      { w: 'ENGINE', count: 6 },
    ];
    const item = pickRandom(words);

    return {
      type: 'word',
      difficulty: 'medium',
      question: `How many letters in '${item.w}'?`,
      answer: String(item.count),
      audioPrompt: `How many letters are in the word ${item.w.split('').join(' ')}?`,
    };
  }
}

/**
 * Hard challenges: 2-step arithmetic or word extraction
 */
function generateHardChallenge(): GeneratedChallenge {
  const roll = Math.random();

  if (roll < 0.5) {
    // (a + b) × c or (a × b) + c
    const a = getRandomInt(2, 6);
    const b = getRandomInt(2, 5);
    const c = getRandomInt(2, 4);
    const answer = a * b + c;

    return {
      type: 'math',
      difficulty: 'hard',
      question: `Solve: (${a} × ${b}) + ${c}`,
      answer: String(answer),
      audioPrompt: `Solve: ${a} times ${b}, plus ${c}.`,
    };
  } else {
    const sentences = [
      { text: 'Green trees grow tall', pos: 2, word: 'trees' },
      { text: 'Fast servers deliver data', pos: 3, word: 'deliver' },
      { text: 'Modern web applications scale', pos: 2, word: 'web' },
      { text: 'Clean code prevents bugs', pos: 4, word: 'bugs' },
    ];
    const s = pickRandom(sentences);

    const posWord = s.pos === 1 ? '1st' : s.pos === 2 ? '2nd' : s.pos === 3 ? '3rd' : `${s.pos}th`;

    return {
      type: 'word',
      difficulty: 'hard',
      question: `Type the ${posWord} word in: "${s.text}"`,
      answer: s.word,
      audioPrompt: `Type the ${posWord} word in the sentence: ${s.text}.`,
    };
  }
}

