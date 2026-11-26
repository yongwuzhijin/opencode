// OpenCode turns updates on for a packaged app that shipped app-update.yml.
// This fork does not publish desktop builds. That file is the opencode.ai feed and would replace Seal.
const PUBLISHES_DESKTOP_UPDATES = false

/** Whether this desktop build should contact an update feed. */
export function desktopUpdatesEnabled(packaged: boolean, feed: boolean): boolean {
  if (!packaged || !feed) return false

  return PUBLISHES_DESKTOP_UPDATES
}
