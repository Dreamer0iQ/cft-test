import { describe, it, expect } from 'vitest';
import {
  calculateRisk,
  calculateSla,
  calculateCompliance,
  slaNormHours,
} from '@/lib/calculators';

describe('calculateRisk', () => {
  it('returns the minimum score and low level for (LOW, 1, 1, mitigation=true)', () => {
    const res = calculateRisk({
      severity: 'LOW',
      probability: 1,
      impact: 1,
      hasMitigation: true,
    });
    expect(res.score).toBe(0.5);
    expect(res.level).toBe('low');
  });

  it('returns the maximum score and critical level for (CRITICAL, 5, 5, mitigation=false)', () => {
    const res = calculateRisk({
      severity: 'CRITICAL',
      probability: 5,
      impact: 5,
      hasMitigation: false,
    });
    expect(res.score).toBe(100);
    expect(res.level).toBe('critical');
  });

  it('halves the score when mitigation is enabled', () => {
    const noMit = calculateRisk({
      severity: 'HIGH',
      probability: 4,
      impact: 4,
      hasMitigation: false,
    });
    const withMit = calculateRisk({
      severity: 'HIGH',
      probability: 4,
      impact: 4,
      hasMitigation: true,
    });
    expect(withMit.score).toBeCloseTo(noMit.score / 2, 5);
  });

  it('maps score ≤10 to low (boundary)', () => {
    // MEDIUM(2)*2*2 = 8 (low). MEDIUM(2)*2*2.5-ish impossible, so use LOW to hit exactly 10: LOW(1)*5*2 = 10
    const res = calculateRisk({
      severity: 'LOW',
      probability: 5,
      impact: 2,
      hasMitigation: false,
    });
    expect(res.score).toBe(10);
    expect(res.level).toBe('low');
  });

  it('maps score in (10, 25] to medium', () => {
    // MEDIUM(2)*3*3 = 18 → medium
    const res = calculateRisk({
      severity: 'MEDIUM',
      probability: 3,
      impact: 3,
      hasMitigation: false,
    });
    expect(res.score).toBe(18);
    expect(res.level).toBe('medium');
  });

  it('maps score exactly 25 to medium (upper boundary)', () => {
    // LOW(1)*5*5 = 25
    const res = calculateRisk({
      severity: 'LOW',
      probability: 5,
      impact: 5,
      hasMitigation: false,
    });
    expect(res.score).toBe(25);
    expect(res.level).toBe('medium');
  });

  it('maps score in (25, 50] to high', () => {
    // HIGH(3)*4*4 = 48 → high
    const res = calculateRisk({
      severity: 'HIGH',
      probability: 4,
      impact: 4,
      hasMitigation: false,
    });
    expect(res.score).toBe(48);
    expect(res.level).toBe('high');
  });

  it('maps score exactly 50 to high (upper boundary)', () => {
    // MEDIUM(2)*5*5 = 50
    const res = calculateRisk({
      severity: 'MEDIUM',
      probability: 5,
      impact: 5,
      hasMitigation: false,
    });
    expect(res.score).toBe(50);
    expect(res.level).toBe('high');
  });

  it('maps score > 50 to critical', () => {
    // CRITICAL(4)*4*4 = 64 → critical
    const res = calculateRisk({
      severity: 'CRITICAL',
      probability: 4,
      impact: 4,
      hasMitigation: false,
    });
    expect(res.score).toBe(64);
    expect(res.level).toBe('critical');
  });

  it('clamps probability above 5 down to 5', () => {
    const clamped = calculateRisk({
      severity: 'CRITICAL',
      probability: 99,
      impact: 5,
      hasMitigation: false,
    });
    const expected = calculateRisk({
      severity: 'CRITICAL',
      probability: 5,
      impact: 5,
      hasMitigation: false,
    });
    expect(clamped.score).toBe(expected.score);
    expect(clamped.level).toBe(expected.level);
  });

  it('clamps probability below 1 up to 1', () => {
    const clamped = calculateRisk({
      severity: 'LOW',
      probability: -3,
      impact: 1,
      hasMitigation: false,
    });
    const expected = calculateRisk({
      severity: 'LOW',
      probability: 1,
      impact: 1,
      hasMitigation: false,
    });
    expect(clamped.score).toBe(expected.score);
  });

  it('clamps impact outside [1, 5]', () => {
    const high = calculateRisk({
      severity: 'LOW',
      probability: 1,
      impact: 50,
      hasMitigation: false,
    });
    expect(high.score).toBe(5); // 1 * 1 * 5 = 5
    const low = calculateRisk({
      severity: 'LOW',
      probability: 1,
      impact: 0,
      hasMitigation: false,
    });
    expect(low.score).toBe(1); // clamped to 1 → 1*1*1
  });
});

describe('calculateSla', () => {
  const base = new Date('2026-04-18T12:00:00Z');

  it('computes the deadline as detectedAt + norm hours', () => {
    const norm = slaNormHours.HIGH; // 30*24
    const res = calculateSla({
      detectedAt: base,
      severity: 'HIGH',
      now: base,
    });
    const expected = new Date(base.getTime() + norm * 3_600_000);
    expect(res.deadline.getTime()).toBe(expected.getTime());
  });

  it('returns status=on_track when more than 20% of the norm remains', () => {
    const norm = slaNormHours.HIGH; // 30d
    // Elapsed 10% of norm → 90% remaining → on_track
    const now = new Date(base.getTime() + norm * 3_600_000 * 0.1);
    const res = calculateSla({
      detectedAt: base,
      severity: 'HIGH',
      now,
    });
    expect(res.status).toBe('on_track');
    expect(res.overdueHours).toBe(0);
    expect(res.hoursLeft).toBeGreaterThan(0);
  });

  it('returns status=due_soon when ≤20% of the norm remains', () => {
    const norm = slaNormHours.HIGH;
    // 90% elapsed → 10% remaining
    const now = new Date(base.getTime() + norm * 3_600_000 * 0.9);
    const res = calculateSla({
      detectedAt: base,
      severity: 'HIGH',
      now,
    });
    expect(res.status).toBe('due_soon');
    expect(res.hoursLeft).toBeGreaterThan(0);
  });

  it('returns status=overdue when past deadline', () => {
    const norm = slaNormHours.MEDIUM;
    const now = new Date(base.getTime() + (norm + 10) * 3_600_000);
    const res = calculateSla({
      detectedAt: base,
      severity: 'MEDIUM',
      now,
    });
    expect(res.status).toBe('overdue');
    expect(res.overdueHours).toBeGreaterThan(0);
    expect(res.hoursLeft).toBe(0);
  });

  it('returns status=met with overdueHours=0 when resolved before deadline', () => {
    const norm = slaNormHours.LOW;
    const resolvedAt = new Date(base.getTime() + norm * 3_600_000 * 0.5);
    const res = calculateSla({
      detectedAt: base,
      severity: 'LOW',
      resolvedAt,
      now: new Date(base.getTime() + norm * 3_600_000 * 0.6),
    });
    expect(res.status).toBe('met');
    expect(res.overdueHours).toBe(0);
    expect(res.hoursLeft).toBeGreaterThan(0);
  });

  it('returns status=met with overdueHours>0 when resolved after deadline', () => {
    const norm = slaNormHours.CRITICAL;
    const resolvedAt = new Date(base.getTime() + (norm + 5) * 3_600_000);
    const res = calculateSla({
      detectedAt: base,
      severity: 'CRITICAL',
      resolvedAt,
    });
    expect(res.status).toBe('met');
    expect(res.overdueHours).toBeGreaterThan(0);
    expect(res.hoursLeft).toBe(0);
  });

  it('accepts a custom normHours override', () => {
    const res = calculateSla({
      detectedAt: base,
      severity: 'LOW',
      normHours: 10,
      now: base,
    });
    const expected = new Date(base.getTime() + 10 * 3_600_000);
    expect(res.deadline.getTime()).toBe(expected.getTime());
  });
});

describe('calculateCompliance', () => {
  it('returns non_compliant and percent=0 when both counts are zero', () => {
    const res = calculateCompliance({ fulfilled: 0, unfulfilled: 0 });
    expect(res.percent).toBe(0);
    expect(res.level).toBe('non_compliant');
  });

  it('returns full when percent ≥ 95', () => {
    const res = calculateCompliance({ fulfilled: 95, unfulfilled: 5 });
    expect(res.percent).toBe(95);
    expect(res.level).toBe('full');
  });

  it('returns full for 100%', () => {
    const res = calculateCompliance({ fulfilled: 10, unfulfilled: 0 });
    expect(res.percent).toBe(100);
    expect(res.level).toBe('full');
  });

  it('returns partial when 60 ≤ percent < 95', () => {
    const res = calculateCompliance({ fulfilled: 60, unfulfilled: 40 });
    expect(res.percent).toBe(60);
    expect(res.level).toBe('partial');
  });

  it('returns non_compliant when percent < 60', () => {
    const res = calculateCompliance({ fulfilled: 5, unfulfilled: 10 });
    expect(res.level).toBe('non_compliant');
    expect(res.percent).toBeCloseTo(33.33, 1);
  });
});
