import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import postcss from 'postcss';

const css = await readFile(new URL('../app/theme.css', import.meta.url), 'utf8');
const root = postcss.parse(css);
function lastValue(selector, property) {
  let value;
  root.walkRules(rule => {
    if (!rule.selector.startsWith('html[data-theme="light"]')) return;
    if (!rule.selector.includes(selector)) return;
    rule.walkDecls(property, decl => { value = decl.value; });
  });
  return value;
}

test('light reading surfaces blend into the page without changing geometry', () => {
  for (const selector of ['.lesson-card,.concept-flow', '.course-entry.glass', '.note{', '.profile-panel.glass', '.forum-aside section']) {
    // .note is a standalone rule, not its descendant text rule.
    const target = selector === '.note{' ? ' .note' : selector;
    assert.equal(lastValue(target, 'background'), 'transparent', selector);
  }
  for (const selector of ['.deep-lesson,.feature-section', '.profile-panel>header', '.forum-tabs']) {
    assert.equal(lastValue(selector, selector === '.forum-tabs' ? 'border-bottom-color' : 'border-color'), 'transparent');
  }
});

test('light tools retain legible surfaces and keyboard feedback', () => {
  assert.equal(lastValue('.chat.glass', 'background'), 'var(--ui-surface)');
  assert.equal(lastValue('.forum-editor', 'background'), 'var(--ui-control)');
  assert.equal(lastValue('.profile-field input', 'background'), 'var(--ui-surface-raised)');
  assert.match(css, /\.theme-toggle:focus-visible\{\s*outline:2px/);
  assert.match(css, /\.code-example,\.sandbox,\.run-history,\.code-viewer-dialog,\.mac-code-window,\.deep-code-block/);
});
