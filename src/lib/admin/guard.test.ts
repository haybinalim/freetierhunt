import { describe, expect, it } from 'vitest';
import { safeEqual } from './guard';

describe('safeEqual', () => {
  it('aynı iki değeri eşit kabul eder', () => {
    expect(safeEqual('freetierhunt-secret', 'freetierhunt-secret')).toBe(true);
  });

  it('farklı değerleri reddeder', () => {
    expect(safeEqual('freetierhunt-secret', 'freetierhunt-other')).toBe(false);
  });

  it('farklı uzunluktaki değerleri reddeder', () => {
    expect(safeEqual('short', 'much-longer')).toBe(false);
  });
});
