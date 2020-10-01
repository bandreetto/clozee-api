export function getTagsFromComment(comment: string) {
  const tokens = comment.split(' ');
  const tags = tokens.filter(token => token.startsWith('@'));
  return tags.map(tag => tag.slice(1));
}
