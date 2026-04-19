import type { Severity } from '@prisma/client';

export const severityWeight: Record<Severity, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
};

// SLA norms per severity (hours). Source: ТЗ.
export const slaNormHours: Record<Severity, number> = {
  CRITICAL: 7 * 24,
  HIGH: 30 * 24,
  MEDIUM: 60 * 24,
  LOW: 90 * 24,
};

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface RiskInput {
  severity: Severity;
  probability: number;
  impact: number;
  hasMitigation: boolean;
}

export interface RiskOutput {
  score: number;
  level: RiskLevel;
}

export function calculateRisk(input: RiskInput): RiskOutput {
  const { severity, probability, impact, hasMitigation } = input;
  const p = clamp(probability, 1, 5);
  const i = clamp(impact, 1, 5);
  const raw = severityWeight[severity] * p * i * (hasMitigation ? 0.5 : 1);
  const score = round2(raw);

  let level: RiskLevel;
  if (score <= 10) level = 'low';
  else if (score <= 25) level = 'medium';
  else if (score <= 50) level = 'high';
  else level = 'critical';

  return { score, level };
}

export type SlaStatus = 'on_track' | 'due_soon' | 'overdue' | 'met';

export interface SlaInput {
  detectedAt: Date;
  severity: Severity;
  normHours?: number;
  now?: Date;
  resolvedAt?: Date | null;
}

export interface SlaOutput {
  deadline: Date;
  overdueHours: number;
  hoursLeft: number;
  status: SlaStatus;
}

export function calculateSla(input: SlaInput): SlaOutput {
  const norm = input.normHours ?? slaNormHours[input.severity];
  const now = input.now ?? new Date();
  const deadline = new Date(input.detectedAt.getTime() + norm * 3_600_000);

  if (input.resolvedAt) {
    const diffH = (deadline.getTime() - input.resolvedAt.getTime()) / 3_600_000;
    return {
      deadline,
      overdueHours: diffH < 0 ? round2(-diffH) : 0,
      hoursLeft: diffH > 0 ? round2(diffH) : 0,
      status: 'met',
    };
  }

  const diffH = (deadline.getTime() - now.getTime()) / 3_600_000;

  if (diffH < 0) {
    return { deadline, overdueHours: round2(-diffH), hoursLeft: 0, status: 'overdue' };
  }

  // due_soon when <= 20% of the norm remains
  const status: SlaStatus = diffH <= norm * 0.2 ? 'due_soon' : 'on_track';
  return { deadline, overdueHours: 0, hoursLeft: round2(diffH), status };
}

export type ComplianceLevel = 'full' | 'partial' | 'non_compliant';

export interface ComplianceInput {
  fulfilled: number;
  unfulfilled: number;
}

export interface ComplianceOutput {
  percent: number;
  level: ComplianceLevel;
}

export function calculateCompliance(input: ComplianceInput): ComplianceOutput {
  const { fulfilled, unfulfilled } = input;
  const total = fulfilled + unfulfilled;
  if (total <= 0) return { percent: 0, level: 'non_compliant' };

  const percent = round2((fulfilled / total) * 100);
  let level: ComplianceLevel;
  if (percent >= 95) level = 'full';
  else if (percent >= 60) level = 'partial';
  else level = 'non_compliant';

  return { percent, level };
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
