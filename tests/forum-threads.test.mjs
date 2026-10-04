import test from 'node:test';
import assert from 'node:assert/strict';
import { groupReplyThreads } from '../app/forum/reply-threads.mjs';

const row = (id, replyToId = null, createdAt = '2026-10-04 00:00:00') => ({
  id, createdAt, replyTo: replyToId ? { id: replyToId } : null,
});
const shape = groups => groups.map(group => [group.root.id, group.replies.map(reply => reply.id)]);

test('groups direct and deeper replies beneath their top-level floor', () => {
  const rows = [row('root-a'), row('root-b'), row('child-a', 'root-a'), row('grandchild-a', 'child-a'), row('child-b', 'root-b')];
  assert.deepEqual(shape(groupReplyThreads(rows)), [
    ['root-a', ['child-a', 'grandchild-a']],
    ['root-b', ['child-b']],
  ]);
});

test('keeps paginated replies visible until their parent is loaded', () => {
  const child = row('child', 'root');
  assert.deepEqual(shape(groupReplyThreads([child])), [['child', []]]);
  assert.deepEqual(shape(groupReplyThreads([child, row('root')])), [['root', ['child']]]);
});

test('orders floors and descendants by timestamp then id regardless of fetch order', () => {
  const rows = [row('late', null, '2026-10-04 00:00:01'), row('child-z', 'early'), row('child-a', 'early'), row('early')];
  assert.deepEqual(shape(groupReplyThreads(rows)), [
    ['early', ['child-a', 'child-z']],
    ['late', []],
  ]);
});
