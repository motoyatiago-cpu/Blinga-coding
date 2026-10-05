/**
 * Keep every loaded reply in its original conversation, even when the direct
 * parent is on another page. Once that parent is loaded, the group can move
 * beneath its actual root without losing the reply.
 *
 * @template {{ id: string, createdAt: string, replyTo: { id: string } | null }} T
 * @param {T[]} rows
 * @returns {{ root: T, replies: T[] }[]}
 */
export function groupReplyThreads(rows) {
  const byId = new Map(rows.map(row => [row.id, row]));
  const groups = new Map();
  const compare = (left, right) => left.createdAt.localeCompare(right.createdAt) || left.id.localeCompare(right.id);

  for (const row of rows) {
    let root = row;
    const visited = new Set([row.id]);
    while (root.replyTo && byId.has(root.replyTo.id) && !visited.has(root.replyTo.id)) {
      root = byId.get(root.replyTo.id);
      visited.add(root.id);
    }

    let group = groups.get(root.id);
    if (!group) {
      group = { root, replies: [] };
      groups.set(root.id, group);
    }
    if (row.id !== root.id) group.replies.push(row);
  }

  return [...groups.values()]
    .sort((left, right) => compare(left.root, right.root))
    .map(group => ({ ...group, replies: group.replies.sort(compare) }));
}
