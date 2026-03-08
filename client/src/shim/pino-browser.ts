/**
 * Shim for pino in browser: pino/browser.js only has default export (CJS),
 * but @aztec/bb.js does `import { pino } from 'pino'`. This re-exports default as named.
 */
// @ts-ignore - pino types may not match browser build
import pinoDefault from 'pino/browser.js';
export const pino = pinoDefault;
export default pinoDefault;
