export function escapeRegex(regex: string) {
  return regex.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}
