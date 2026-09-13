import test from 'node:test';
import assert from 'node:assert/strict';
import { pbkdf2Sync } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const source = readFileSync(new URL('../worker/password-kdf.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const module = { exports: {} };
new Function('require', 'module', 'exports', compiled)(require, module, module.exports);
const { derivePasswordBytes } = module.exports;

test('preserves existing password hashes and works when native PBKDF2 rejects high iterations', async (t) => {
  t.mock.method(crypto.subtle, 'deriveBits', async () => { throw new DOMException('iteration counts above 100000 are not supported', 'NotSupportedError'); });
  const salt = Uint8Array.from({ length: 16 }, (_, i) => i);
  for (const [password, iterations] of [['TestPassword123', 210000], ['中文Password123', 100000], ['OtherPassword987', 210000]]) {
    const expected = pbkdf2Sync(password, salt, iterations, 32, 'sha256');
    assert.deepEqual(Buffer.from(await derivePasswordBytes(password, salt, iterations)), expected);
  }
  assert.notDeepEqual(await derivePasswordBytes('correct123', salt, 210000), await derivePasswordBytes('wrong123', salt, 210000));
});

test('rejects invalid work factors without deriving a key', async () => {
  for (const iterations of [0, -1, 1.5, NaN, 1000001]) {
    await assert.rejects(derivePasswordBytes('password123', new Uint8Array(16), iterations));
  }
});
