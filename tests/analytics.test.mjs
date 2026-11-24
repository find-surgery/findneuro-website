import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

test('Google tag receives command Arguments objects without clearing queued data', () => {
  const existingEvent = { event: 'existing_event' };
  const window = { dataLayer: [existingEvent] };
  const scripts = [];
  const document = {
    createElement: () => ({}),
    head: { appendChild: script => scripts.push(script) },
  };
  const source = readFileSync(new URL('../src/ts/analytics.ts', import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.None },
  });
  runInNewContext(outputText, { window, document });

  assert.equal(window.dataLayer[0], existingEvent);
  const commands = window.dataLayer.slice(1);
  assert.equal(commands.length, 2);
  for (const command of commands) {
    // gtag.js distinguishes command Arguments objects from dataLayer arrays.
    assert.equal(Object.prototype.toString.call(command), '[object Arguments]');
    assert.equal(Array.isArray(command), false);
  }
  assert.equal(commands[0][0], 'js');
  assert.equal(Object.prototype.toString.call(commands[0][1]), '[object Date]');
  assert.deepEqual(Array.from(commands[1]), ['config', 'G-RVD8TGQLHK']);
  assert.equal(scripts[0].src, 'https://www.googletagmanager.com/gtag/js?id=G-RVD8TGQLHK');
  assert.equal(scripts[0].async, true);
  assert.equal(scripts[1].src, 'https://snap.licdn.com/li.lms-analytics/insight.min.js');
  assert.equal(window._linkedin_partner_id, '8671618');
});
