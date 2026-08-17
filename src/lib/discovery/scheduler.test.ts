import { describe, expect, it } from 'vitest';
import { isSourceDue } from './scheduler';

const now = new Date('2026-08-14T12:00:00.000Z');

describe('discovery source scheduling', () => {
  it('henüz senkronize edilmemiş kaynağı hemen çalıştırır', () => {
    expect(isSourceDue({ lastSyncedAt: null, syncIntervalMinutes: 120 }, now)).toBe(true);
  });

  it('kaynağın kendi senkronizasyon aralığı dolmadan yeni tarama yapmaz', () => {
    expect(
      isSourceDue(
        { lastSyncedAt: new Date('2026-08-14T11:00:01.000Z'), syncIntervalMinutes: 60 },
        now
      )
    ).toBe(false);
    expect(
      isSourceDue(
        { lastSyncedAt: new Date('2026-08-14T11:00:00.000Z'), syncIntervalMinutes: 60 },
        now
      )
    ).toBe(true);
  });

  it('aralığı olmayan kaynakta güvenli varsayılanı kullanır', () => {
    expect(
      isSourceDue(
        { lastSyncedAt: new Date('2026-08-14T06:00:00.000Z'), syncIntervalMinutes: null },
        now
      )
    ).toBe(true);
    expect(
      isSourceDue(
        { lastSyncedAt: new Date('2026-08-14T06:00:01.000Z'), syncIntervalMinutes: null },
        now
      )
    ).toBe(false);
  });
});
