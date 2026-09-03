import test from 'node:test';
import assert from 'node:assert/strict';
import { getDefaultMaxCias, resolveMaxCias } from './companyLimit.js';

test('retorna 1 cuando no hay compañías activas', () => {
  assert.equal(getDefaultMaxCias(0), 1);
  assert.equal(getDefaultMaxCias(-2), 1);
});

test('usa el total real de compañías activas del cliente', () => {
  assert.equal(getDefaultMaxCias(3), 3);
  assert.equal(getDefaultMaxCias(7), 7);
});

test('no permite exceder el máximo disponible ni dejar valores inválidos', () => {
  assert.equal(resolveMaxCias(10, 3), 3);
  assert.equal(resolveMaxCias(0, 5), 5);
  assert.equal(resolveMaxCias('2', 4), 2);
});
