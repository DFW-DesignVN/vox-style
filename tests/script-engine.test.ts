import { buildScriptSystemPrompt, calculateTargetWords, countWords, validateScript } from '../server/scriptEngine.ts';

const target = calculateTargetWords(60, 2.5);
if (target !== 150) throw new Error(`Expected 150 words, got ${target}`);
if (countWords('Một hai ba bốn năm') !== 5) throw new Error('Word counter failed');

const goodNarration = Array.from({ length: 150 }, (_, i) => `word${i + 1}`).join(' ') + '.';
const good = validateScript({
  narration: goodNarration,
  sections: [
    { id: 's1', type: 'cold_open', title: 'Hook', text: 'a', targetWords: 20, actualWords: 20 },
    { id: 's2', type: 'context', title: 'Context', text: 'b', targetWords: 30, actualWords: 30 },
    { id: 's3', type: 'development', title: 'Development', text: 'c', targetWords: 40, actualWords: 40 },
    { id: 's4', type: 'turning_point', title: 'Turning point', text: 'd', targetWords: 30, actualWords: 30 },
    { id: 's5', type: 'ending', title: 'Ending', text: 'e', targetWords: 30, actualWords: 30 }
  ]
}, { durationSeconds: 60, wordsPerSecond: 2.5, tolerancePercent: 3 });
if (!good.valid) throw new Error(`Expected valid script, got ${JSON.stringify(good.issues)}`);

const bad = validateScript({
  narration: 'Here is your script. [VISUAL: show image] TODO.',
  sections: []
}, { durationSeconds: 60, wordsPerSecond: 2.5 });
if (bad.valid) throw new Error('Invalid script was accepted');
if (!bad.issues.some(i => i.code === 'WORD_COUNT_OUT_OF_RANGE')) throw new Error('Missing word count validation');
if (!bad.issues.some(i => i.code === 'PLACEHOLDER_TEXT')) throw new Error('Missing placeholder validation');
if (!bad.issues.some(i => i.code === 'SECTION_COUNT_LOW')) throw new Error('Missing section validation');

const prompt = buildScriptSystemPrompt({ durationSeconds: 600, wordsPerSecond: 2.5 }, 'Nokia', 'technology documentary');
if (!prompt.includes('1500')) throw new Error('Target word count missing from prompt');
if (!prompt.includes('Return JSON only')) throw new Error('Strict JSON instruction missing');

console.log('Script engine test: PASS');
