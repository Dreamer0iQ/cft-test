import { PrismaClient, Role, Severity, AuditStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { calculateRisk } from '../src/lib/calculators';

const prisma = new PrismaClient();

// deterministic PRNG (mulberry32) — so seed is reproducible without adding faker
function rng(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = rng(20260418);
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)]!;
const pickInt = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;

const SYSTEMS: { name: string; module: string }[] = [
  { name: 'АБС Ядро', module: 'Core' },
  { name: 'ДБО Юрлиц', module: 'Web' },
  { name: 'ДБО Физлиц', module: 'Web' },
  { name: 'Процессинг Карт', module: 'Payments' },
  { name: 'Антифрод', module: 'Risk' },
  { name: 'СБП Шлюз', module: 'Payments' },
  { name: 'Кредитный Конвейер', module: 'Lending' },
  { name: 'CRM Продажи', module: 'CRM' },
];

const CATEGORIES = [
  'Контроль доступа',
  'Шифрование',
  'Аудит и логирование',
  'Сетевая безопасность',
  'Управление уязвимостями',
  'Резервное копирование',
] as const;

const TITLES: Record<(typeof CATEGORIES)[number], string[]> = {
  'Контроль доступа': [
    'Слабая политика паролей в админ-панели',
    'Роли не пересматривались 12 месяцев',
    'Общие учётные записи на проде',
    'Отсутствует MFA для привилегированных пользователей',
    'Просроченные техучётки не отключаются',
  ],
  'Шифрование': [
    'TLS 1.0 включён на внутреннем API',
    'Секреты в открытом виде в конфигах',
    'Ротация ключей шифрования не настроена',
    'Использование устаревшего SHA-1',
    'Хранение пин-блоков без HSM',
  ],
  'Аудит и логирование': [
    'Логи действий администраторов не собираются',
    'Короткий срок хранения журналов (14 дней)',
    'Отсутствует алертинг по критичным событиям',
    'Целостность логов не обеспечивается',
    'Логи содержат персональные данные',
  ],
  'Сетевая безопасность': [
    'Открытые порты СУБД во внутренней сети',
    'Сегментация DMZ нарушена',
    'Устаревшие правила WAF',
    'Отсутствуют правила по исходящему трафику',
    'IDS/IPS не покрывает DMZ',
  ],
  'Управление уязвимостями': [
    'Критические CVE без патча > 30 дней',
    'Отсутствует процесс триажа CVE',
    'Контейнеры с устаревшими базовыми образами',
    'SCA не интегрирован в CI',
    'Ручное сканирование раз в квартал',
  ],
  'Резервное копирование': [
    'Резервные копии не шифруются',
    'Тесты восстановления не проводятся',
    'Бэкапы хранятся в том же ЦОДе',
    'RPO превышает нормативный порог',
    'Отсутствует офлайн-копия',
  ],
};

const DESCRIPTIONS = [
  'В ходе проверки выявлено несоответствие требованиям политики ИБ. Требуется устранение в рамках SLA.',
  'Зафиксирован риск раскрытия конфиденциальных данных. Рекомендовано провести дополнительную оценку.',
  'Обнаружено отклонение от стандарта безопасной конфигурации. Подтверждено при повторной проверке.',
  'Анализ показал отсутствие компенсирующих мер. Требуется заведение задачи владельцу системы.',
  'Инцидент не зафиксирован, однако уровень остаточного риска выше приемлемого порога.',
];

const COMMENT_TEXTS = [
  'Согласовал с владельцем системы, работаем.',
  'Подтверждаю приоритет, плановая дата в следующем спринте.',
  'Требуется уточнение у архитектора — поставил в очередь.',
  'По факту воспроизвели на стенде, картина та же.',
  'Добавил компенсирующую меру, снижаем вероятность до 2.',
  'Эскалировано на L3, жду подтверждения критичности.',
  'Принятый риск — оформим через ИБ-комитет.',
  'Закрываем, верификация пройдена.',
];

const SEVS: Severity[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const STATUSES: AuditStatus[] = [
  'NEW',
  'IN_PROGRESS',
  'UNDER_REVIEW',
  'RESOLVED',
  'REJECTED',
  'ACCEPTED_RISK',
];

async function main() {
  console.log('→ reset volatile tables (оставляем users/systems — иначе ломаются JWT-сессии и ссылки)');
  await prisma.activityLog.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.auditResult.deleteMany();

  const hash = await bcrypt.hash('password123', 10);

  console.log('→ users (upsert by email — id стабилен между рестартами)');
  const USERS_SEED: Array<{ email: string; name: string; role: Role }> = [
    { email: 'admin@cft.local', name: 'Анна Администратор', role: Role.ADMIN },
    { email: 'l3@cft.local', name: 'Сергей Эксперт', role: Role.L3 },
    { email: 'l2@cft.local', name: 'Мария Аналитик', role: Role.L2 },
    { email: 'l1@cft.local', name: 'Иван Новиков', role: Role.L1 },
  ];
  const users = await Promise.all(
    USERS_SEED.map((u) =>
      prisma.user.upsert({
        where: { email: u.email },
        update: { name: u.name, role: u.role, passwordHash: hash },
        create: { email: u.email, name: u.name, role: u.role, passwordHash: hash },
      }),
    ),
  );

  console.log('→ systems (upsert by name)');
  const systems = await Promise.all(
    SYSTEMS.map((s) =>
      prisma.system.upsert({
        where: { name: s.name },
        update: { module: s.module },
        create: s,
      }),
    ),
  );

  console.log('→ audits');
  const now = new Date('2026-04-18T12:00:00Z');
  const MS_DAY = 86_400_000;
  const audits: { id: string; severity: Severity; status: AuditStatus }[] = [];

  for (let i = 0; i < 50; i++) {
    const category = pick(CATEGORIES);
    const title = pick(TITLES[category]);
    const system = pick(systems);
    const severity = weightedSeverity();
    const detectedAt = new Date(now.getTime() - pickInt(1, 270) * MS_DAY);
    const probability = pickInt(2, 5);
    const impact = pickInt(2, 5);
    const hasMitigation = rand() < 0.3;
    const { score } = calculateRisk({ severity, probability, impact, hasMitigation });

    // ~15% resolved, ~20% overdue (unresolved past dueDate), rest mixed
    const bucket = rand();
    let status: AuditStatus;
    let dueDate: Date | null = null;
    let resolvedAt: Date | null = null;

    if (bucket < 0.15) {
      status = 'RESOLVED';
      dueDate = new Date(detectedAt.getTime() + slaHours(severity) * 3_600_000);
      resolvedAt = new Date(
        detectedAt.getTime() + pickInt(2, Math.max(3, Math.floor(slaHours(severity) / 24))) * MS_DAY,
      );
    } else if (bucket < 0.35) {
      status = pick(['IN_PROGRESS', 'NEW', 'UNDER_REVIEW'] as const);
      dueDate = new Date(now.getTime() - pickInt(1, 40) * MS_DAY);
    } else {
      status = pick(STATUSES.filter((s) => s !== 'RESOLVED') as AuditStatus[]);
      dueDate = new Date(detectedAt.getTime() + slaHours(severity) * 3_600_000);
    }

    // guarantee a handful of open CRITICAL
    if (i < 4) {
      // first 4 records: force CRITICAL + open
      const a = await prisma.auditResult.create({
        data: {
          title: pick(TITLES['Контроль доступа']),
          systemId: system.id,
          category: 'Контроль доступа',
          description: pick(DESCRIPTIONS),
          severity: 'CRITICAL',
          status: pick(['NEW', 'IN_PROGRESS', 'UNDER_REVIEW'] as const),
          responsibleId: pick(users).id,
          detectedAt,
          dueDate: new Date(detectedAt.getTime() + slaHours('CRITICAL') * 3_600_000),
          riskScore: calculateRisk({ severity: 'CRITICAL', probability: 4, impact: 5, hasMitigation: false }).score,
          probability: 4,
          impact: 5,
          hasMitigation: false,
        },
      });
      audits.push({ id: a.id, severity: 'CRITICAL', status: a.status });
      continue;
    }

    const a = await prisma.auditResult.create({
      data: {
        title,
        systemId: system.id,
        category,
        description: pick(DESCRIPTIONS),
        severity,
        status,
        responsibleId: rand() < 0.85 ? pick(users).id : null,
        detectedAt,
        dueDate,
        resolvedAt,
        riskScore: score,
        probability,
        impact,
        hasMitigation,
      },
    });
    audits.push({ id: a.id, severity, status });
  }

  console.log('→ comments');
  for (let i = 0; i < 30; i++) {
    const a = pick(audits);
    await prisma.comment.create({
      data: {
        auditId: a.id,
        authorId: pick(users).id,
        text: pick(COMMENT_TEXTS),
        createdAt: new Date(now.getTime() - pickInt(1, 120) * MS_DAY),
      },
    });
  }

  console.log('→ activity logs');
  const ACTIONS = ['status_changed', 'severity_changed', 'assigned', 'commented', 'created'];
  for (let i = 0; i < 40; i++) {
    const a = pick(audits);
    const action = pick(ACTIONS);
    await prisma.activityLog.create({
      data: {
        auditId: a.id,
        actorId: pick(users).id,
        action,
        field: action === 'status_changed' ? 'status' : action === 'severity_changed' ? 'severity' : null,
        oldValue: action === 'status_changed' ? 'NEW' : null,
        newValue: action === 'status_changed' ? 'IN_PROGRESS' : null,
        createdAt: new Date(now.getTime() - pickInt(1, 150) * MS_DAY),
      },
    });
  }

  console.log('✓ seed done');
}

function weightedSeverity(): Severity {
  const r = rand();
  if (r < 0.4) return 'MEDIUM';
  if (r < 0.7) return 'LOW';
  if (r < 0.9) return 'HIGH';
  return 'CRITICAL';
}

function slaHours(s: Severity): number {
  return { CRITICAL: 7 * 24, HIGH: 30 * 24, MEDIUM: 60 * 24, LOW: 90 * 24 }[s];
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
