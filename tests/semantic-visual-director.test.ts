import assert from 'node:assert/strict';
import { buildSemanticVisualPlan, selectSemanticVisualStyle } from '../src/visualDirector/SemanticVisualDirector.ts';

const cases:Array<[string,string]>=[
  ['The rate increased 42% and revenue doubled.','data_documentary'],
  ['A route across the border connected three countries.','map_intelligence'],
  ['Before and after the merger, the company looked completely different.','split_screen'],
  ['Investigators found evidence and a hidden clue in the case file.','evidence_board'],
  ['The experiment revealed a new biological mechanism.','scientific_lab'],
  ['A ransomware attack compromised the network server.','cyber_intelligence'],
  ['The machine mechanism is explained by this technical schematic.','blueprint'],
  ['The treaty changed the diplomatic balance between two powers.','geopolitical'],
  ['A 1920 manuscript is now preserved in the museum.','archive_museum'],
  ['A dramatic reveal opens the documentary in silence.','minimal_cinematic'],
  ['A broad documentary explanation of the topic begins here.','classic_vox']
];
for(const [text,expected] of cases) assert.equal(selectSemanticVisualStyle({narration:text}),expected,`${text} should map to ${expected}`);
const plan=buildSemanticVisualPlan({narration:'Before and after the merger: revenue rose 42%.',assetCount:4});
assert.equal(plan.visualStyle,'split_screen');
assert.equal(plan.frames.length,4);
assert.equal(plan.recommendedAssetRoles[0],'hero');
console.log(`Semantic visual director test: PASS (${cases.length+3} assertions)`);
