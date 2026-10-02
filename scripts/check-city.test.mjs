import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolveCityId } from '../src/city-id.js';

test('local development and arbitrary preview hosts load Barcelos', () => {
  for (const host of ['', 'localhost', '127.0.0.1', 'barcelos-preview-123.vercel.app']) {
    assert.equal(resolveCityId(undefined, '', host), 'barcelos');
  }
});

test('a build-time city pin cannot be overridden by a shared URL', () => {
  assert.equal(resolveCityId('barcelos', '?city=braga', 'braga-3d.com'), 'barcelos');
});

test('without a build pin, a valid query wins over the hostname', () => {
  assert.equal(resolveCityId(undefined, '?city=barcelos', 'braga-3d.com'), 'barcelos');
});

test('invalid query and environment identifiers cannot become config paths', () => {
  for (const invalid of ['../secret', '/braga', 'BRAGA', 'barcelos.json', 'a/b']) {
    assert.equal(resolveCityId(invalid, `?city=${encodeURIComponent(invalid)}`, 'localhost'), 'barcelos');
  }
});

test('known and generic city hostnames still resolve', () => {
  assert.equal(resolveCityId(undefined, '', 'www.barcelos-3d.com'), 'barcelos');
  assert.equal(resolveCityId(undefined, '', 'barcelos-3d.vercel.app'), 'barcelos');
  assert.equal(resolveCityId(undefined, '', 'www.porto-3d.com'), 'porto');
});
