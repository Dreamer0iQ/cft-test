import { describe, it, expect } from 'vitest';
import {
  loginInput,
  commentInput,
  statusUpdateInput,
  severityUpdateInput,
  userCreateInput,
  userRoleUpdateInput,
} from '@/lib/validators';

// Example cuid-looking strings for the schemas that require it.
const CUID = 'ckxyz0000000000000000000';

describe('loginInput', () => {
  it('accepts a valid email + password', () => {
    const res = loginInput.safeParse({ email: 'user@example.com', password: 'secret123' });
    expect(res.success).toBe(true);
  });

  it('rejects a malformed email', () => {
    const res = loginInput.safeParse({ email: 'not-an-email', password: 'secret123' });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues.some((i) => i.path.includes('email'))).toBe(true);
    }
  });

  it('rejects a password shorter than 6 characters', () => {
    const res = loginInput.safeParse({ email: 'user@example.com', password: '12345' });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues.some((i) => i.path.includes('password'))).toBe(true);
    }
  });
});

describe('commentInput', () => {
  it('accepts a valid auditId + non-empty text', () => {
    const res = commentInput.safeParse({ auditId: CUID, text: 'Согласовал.' });
    expect(res.success).toBe(true);
  });

  it('rejects a non-cuid auditId', () => {
    const res = commentInput.safeParse({ auditId: 'not-a-cuid', text: 'hello' });
    expect(res.success).toBe(false);
  });

  it('rejects empty text (after trim)', () => {
    const res = commentInput.safeParse({ auditId: CUID, text: '   ' });
    expect(res.success).toBe(false);
  });
});

describe('statusUpdateInput', () => {
  it('accepts a valid status transition', () => {
    const res = statusUpdateInput.safeParse({ auditId: CUID, status: 'IN_PROGRESS' });
    expect(res.success).toBe(true);
  });

  it('rejects an unknown status value', () => {
    const res = statusUpdateInput.safeParse({ auditId: CUID, status: 'NOT_A_STATUS' });
    expect(res.success).toBe(false);
  });

  it('rejects a note longer than 2000 chars', () => {
    const res = statusUpdateInput.safeParse({
      auditId: CUID,
      status: 'RESOLVED',
      note: 'x'.repeat(2001),
    });
    expect(res.success).toBe(false);
  });
});

describe('severityUpdateInput', () => {
  it('accepts a valid severity + reason', () => {
    const res = severityUpdateInput.safeParse({
      auditId: CUID,
      severity: 'HIGH',
      reason: 'Повышаем, так как появилась эксплуатация в дикой природе.',
    });
    expect(res.success).toBe(true);
  });

  it('rejects an unknown severity', () => {
    const res = severityUpdateInput.safeParse({
      auditId: CUID,
      severity: 'EXTREME',
      reason: 'because',
    });
    expect(res.success).toBe(false);
  });

  it('rejects a reason shorter than 3 characters (after trim)', () => {
    const res = severityUpdateInput.safeParse({
      auditId: CUID,
      severity: 'HIGH',
      reason: 'ok',
    });
    expect(res.success).toBe(false);
  });
});

describe('userCreateInput', () => {
  it('accepts a valid payload', () => {
    const res = userCreateInput.safeParse({
      email: 'new@cft.local',
      name: 'Иван Новиков',
      role: 'L1',
      password: 'password123',
    });
    expect(res.success).toBe(true);
  });

  it('rejects a password shorter than 8 chars', () => {
    const res = userCreateInput.safeParse({
      email: 'new@cft.local',
      name: 'Иван Новиков',
      role: 'L1',
      password: 'short',
    });
    expect(res.success).toBe(false);
  });

  it('rejects an unknown role', () => {
    const res = userCreateInput.safeParse({
      email: 'new@cft.local',
      name: 'Иван Новиков',
      role: 'L4',
      password: 'password123',
    });
    expect(res.success).toBe(false);
  });
});

describe('userRoleUpdateInput', () => {
  it('accepts a valid cuid + role', () => {
    const res = userRoleUpdateInput.safeParse({ userId: CUID, role: 'L3' });
    expect(res.success).toBe(true);
  });

  it('rejects a non-cuid userId', () => {
    const res = userRoleUpdateInput.safeParse({ userId: 'not-a-cuid', role: 'L3' });
    expect(res.success).toBe(false);
  });

  it('rejects an unknown role', () => {
    const res = userRoleUpdateInput.safeParse({ userId: CUID, role: 'SUPERUSER' });
    expect(res.success).toBe(false);
  });
});
