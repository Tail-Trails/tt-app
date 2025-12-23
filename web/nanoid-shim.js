// Shim to provide a named `nanoid` export for bundlers that expect it.
// Import the CJS build directly to avoid ESM/CJS interop issues.
const defaultNanoid = require('nanoid/index.cjs');
exports.nanoid = defaultNanoid;
exports.default = defaultNanoid;
