import { getClientVisualTheme, ClientVisualStyleId } from '../src/visualDirector/StyleVisualTheme.ts';

const styles: ClientVisualStyleId[] = [
  'classic_vox','investigative','newspaper','timeline','map_intelligence','data_documentary',
  'blueprint','case_file','archive_museum','modern_editorial','financial_terminal','cyber_intelligence',
  'scientific_lab','geopolitical','minimal_cinematic','photo_essay','split_screen','evidence_board','mixed_media'
];

const signatures = new Set<string>();
for (const id of styles) {
  const theme = getClientVisualTheme(id);
  if (!theme.bg || !theme.panel || !theme.ink || !theme.accent) throw new Error(`Incomplete theme: ${id}`);
  signatures.add(`${theme.bg}|${theme.panel}|${theme.accent}|${theme.frame}`);
}
if (styles.length !== 19) throw new Error(`Expected 19 themes, got ${styles.length}`);
if (signatures.size < 15) throw new Error(`Themes are too visually similar: ${signatures.size} unique signatures`);
console.log(`Visual theme test: PASS (${styles.length} styles, ${signatures.size} distinct signatures)`);
