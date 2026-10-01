// Opt-in debug tracing. `console.log` calls in render paths and pipelines
// were shipping to every build (QA GRW-19); route them through here so they
// are silent unless EXPO_PUBLIC_DEBUG_LOGS=1 is set in a dev session.
const enabled = __DEV__ && process.env.EXPO_PUBLIC_DEBUG_LOGS === '1';

export function devLog(...args: unknown[]): void {
  if (enabled) console.log(...args);
}
