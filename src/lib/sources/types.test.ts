import { describe, expect, it } from 'vitest';
import { resolveHealthAfterFetch } from './types';

describe('resolveHealthAfterFetch', () => {
  it('başarılı veya değişmemiş kaynakta hata sayacını sıfırlar', () => {
    expect(resolveHealthAfterFetch({ previousFailures: 2, runStatus: 'succeeded' })).toMatchObject({
      status: 'healthy',
      consecutiveFailures: 0,
    });
    expect(
      resolveHealthAfterFetch({ previousFailures: 2, runStatus: 'not_modified' })
    ).toMatchObject({
      status: 'healthy',
      consecutiveFailures: 0,
    });
  });

  it('ilk iki geçici hatada kaynağı healthy bırakır', () => {
    expect(resolveHealthAfterFetch({ previousFailures: 0, runStatus: 'failed' })).toMatchObject({
      status: 'healthy',
      consecutiveFailures: 1,
    });
    expect(resolveHealthAfterFetch({ previousFailures: 1, runStatus: 'failed' })).toMatchObject({
      status: 'healthy',
      consecutiveFailures: 2,
    });
  });

  it('üçüncü ardışık hatada kaynağı degraded durumuna geçirir', () => {
    expect(resolveHealthAfterFetch({ previousFailures: 2, runStatus: 'failed' })).toMatchObject({
      status: 'degraded',
      consecutiveFailures: 3,
    });
  });

  it('otomatik sync uygun değilse kaynağı paused olarak işaretler', () => {
    expect(resolveHealthAfterFetch({ previousFailures: 2, runStatus: 'skipped' })).toMatchObject({
      status: 'paused',
      consecutiveFailures: 2,
    });
  });
});
