/**
 * Post-install script to copy TypeScript 6.x into the nested node_modules of
 * packages that use the TypeScript compiler API during linting.
 *
 * TypeScript 7 changed its package API (the default export no longer exposes
 * compiler internals like `ts.Extension` or `ts.IntrinsicType`), which breaks
 * typescript-eslint@8.x and ts-api-utils@2.x at runtime.
 *
 * This script copies TypeScript 6 (aliased as "typescript-v6") into:
 *   - node_modules/typescript-eslint/node_modules/typescript
 *   - node_modules/ts-api-utils/node_modules/typescript
 *
 * so that these linting packages resolve the compatible TypeScript 6 API
 * while the root project continues to use TypeScript 7 for compilation.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const ts6Src = path.join(root, 'node_modules', 'typescript-v6');

if (!fs.existsSync(ts6Src)) {
    console.warn('[postinstall] typescript-v6 not found, skipping TypeScript 6 copy for eslint packages.');
    process.exit(0);
}

const destinations = [
    path.join(root, 'node_modules', 'typescript-eslint', 'node_modules'),
    path.join(root, 'node_modules', 'ts-api-utils', 'node_modules'),
];

for (const destDir of destinations) {
    const ts6Dest = path.join(destDir, 'typescript');
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }
    if (fs.existsSync(ts6Dest)) {
        fs.rmSync(ts6Dest, { recursive: true, force: true });
    }
    fs.cpSync(ts6Src, ts6Dest, { recursive: true });
    console.log(`[postinstall] Copied TypeScript 6 to ${path.relative(root, ts6Dest)}`);
}
