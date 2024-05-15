import { expect, expectTypeOf, test } from 'vitest';
import { HTMLElement } from 'happy-dom';

import { GlobalRegistrator } from '@happy-dom/global-registrator';
GlobalRegistrator.register({
  url: 'http://localhost:3000',
  width: 1920,
  height: 1080,
});

import { htmlFn } from './html.js';

test('is a function', () => {
  console.log('type:', typeof htmlFn);
  expectTypeOf(htmlFn).toBeFunction();
});

test('returns element', () => {
  expect(htmlFn('<div>Hi there</div>')).toBeInstanceOf(HTMLElement);
});
