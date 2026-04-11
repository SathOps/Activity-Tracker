import { parseTimestamp } from '../timestamps';

export type StandupSlotId = 'S1' | 'S2' | 'S3' | 'S4';
export type StandupSlotStatus = 'GOOD' | 'DELAYED' | 'MISSING';

export interface StandupSlotDefinition {
  slotId: StandupSlotId;
  label: string;
  windowLabel: string;
  startMinutes: number;
  endMinutes: number;
  lateCutoffMinutes: number;
}

export interface StandupSlotResult {
  slotId: StandupSlotId;
  label: string;
  windowLabel: string;
  status: StandupSlotStatus;
  uploadedAt?: string;
  audioId?: string;
}

interface SlotParts {
  dateKey: string;
  totalMinutes: number;
  totalSeconds: number;
}

const DEFAULT_TIME_ZONE = 'Asia/Kolkata';

export const STANDUP_SLOT_DEFINITIONS: StandupSlotDefinition[] = [
  {
    slotId: 'S1',
    label: 'Standup 1',
    windowLabel: '09:00-09:30',
    startMinutes: 9 * 60,
    endMinutes: 9 * 60 + 30,
    lateCutoffMinutes: 12 * 60,
  },
  {
    slotId: 'S2',
    label: 'Standup 2',
    windowLabel: '12:00-12:30',
    startMinutes: 12 * 60,
    endMinutes: 12 * 60 + 30,
    lateCutoffMinutes: 14 * 60,
  },
  {
    slotId: 'S3',
    label: 'Standup 3',
    windowLabel: '14:00-14:30',
    startMinutes: 14 * 60,
    endMinutes: 14 * 60 + 30,
    lateCutoffMinutes: 16 * 60 + 30,
  },
  {
    slotId: 'S4',
    label: 'Standup 4',
    windowLabel: '16:30-17:00',
    startMinutes: 16 * 60 + 30,
    endMinutes: 17 * 60,
    lateCutoffMinutes: 23 * 60 + 59,
  },
];

export function buildStandupSlotResults(
  audios: Array<Pick<{ id: string; uploadedAt?: string }, 'id' | 'uploadedAt'>>,
  targetDateKey: string,
  timeZone: string = DEFAULT_TIME_ZONE
): StandupSlotResult[] {
  const results = new Map<StandupSlotId, StandupSlotResult>(
    STANDUP_SLOT_DEFINITIONS.map((slot) => [
      slot.slotId,
      {
        slotId: slot.slotId,
        label: slot.label,
        windowLabel: slot.windowLabel,
        status: 'MISSING' as const,
      },
    ])
  );

  const sortedAudios = audios
    .map((audio) => ({
      audio,
      sortKey: resolveSortableUploadTime(audio.uploadedAt),
    }))
    .sort((left, right) => left.sortKey - right.sortKey)
    .map((entry) => entry.audio);

  for (const audio of sortedAudios) {
    const slotMatch = resolveSlotForTimestamp(
      audio.uploadedAt,
      targetDateKey,
      timeZone,
      new Set(
        Array.from(results.entries())
          .filter(([, result]) => result.status !== 'MISSING')
          .map(([slotId]) => slotId)
      )
    );

    if (!slotMatch) {
      continue;
    }

    results.set(slotMatch.slot.slotId, {
      slotId: slotMatch.slot.slotId,
      label: slotMatch.slot.label,
      windowLabel: slotMatch.slot.windowLabel,
      status: slotMatch.status,
      uploadedAt: audio.uploadedAt,
      audioId: audio.id,
    });
  }

  return STANDUP_SLOT_DEFINITIONS.map((slot) => results.get(slot.slotId)!);
}

export function resolveSlotForTimestamp(
  uploadedAt: string | undefined,
  targetDateKey: string,
  timeZone: string = DEFAULT_TIME_ZONE,
  filledSlotIds: Set<StandupSlotId> = new Set()
):
  | {
      slot: StandupSlotDefinition;
      status: Exclude<StandupSlotStatus, 'MISSING'>;
    }
  | undefined {
  if (!uploadedAt) {
    return undefined;
  }

  const parsedDate = parseTimestamp(uploadedAt);

  if (!parsedDate) {
    return undefined;
  }

  const parts = getZonedDateParts(parsedDate, timeZone);

  if (!parts || parts.dateKey !== targetDateKey) {
    return undefined;
  }

  const slot = resolveStandupSlot(parts.totalSeconds, filledSlotIds);

  if (!slot) {
    return undefined;
  }

  return {
    slot,
    status: getSlotStatusForTimestamp(parts.totalSeconds, slot),
  };
}

export function resolveStandupSlot(
  totalSeconds: number,
  filledSlotIds: Set<StandupSlotId> = new Set()
): StandupSlotDefinition | undefined {
  const currentSlot = resolveCurrentStandupSlot(totalSeconds);

  if (!currentSlot) {
    return undefined;
  }

  if (totalSeconds >= currentSlot.lateCutoffMinutes * 60) {
    return undefined;
  }

  if (!filledSlotIds.has(currentSlot.slotId)) {
    return currentSlot;
  }

  for (
    let slotIndex = STANDUP_SLOT_DEFINITIONS.indexOf(currentSlot) - 1;
    slotIndex >= 0;
    slotIndex -= 1
  ) {
    const slot = STANDUP_SLOT_DEFINITIONS[slotIndex];

    if (!filledSlotIds.has(slot.slotId)) {
      return slot;
    }
  }

  return undefined;
}

export function countCompletedStandupSlots(
  slotStatuses: StandupSlotResult[]
): number {
  return slotStatuses.filter((slot) => slot.status !== 'MISSING').length;
}

function resolveCurrentStandupSlot(
  totalSeconds: number
): StandupSlotDefinition | undefined {
  let currentSlot: StandupSlotDefinition | undefined;

  for (const slot of STANDUP_SLOT_DEFINITIONS) {
    if (totalSeconds >= slot.startMinutes * 60) {
      currentSlot = slot;
      continue;
    }

    break;
  }

  return currentSlot;
}

function getSlotStatusForTimestamp(
  totalSeconds: number,
  slot: StandupSlotDefinition
): Exclude<StandupSlotStatus, 'MISSING'> {
  return totalSeconds < slot.endMinutes * 60 ? 'GOOD' : 'DELAYED';
}
function getZonedDateParts(
  date: Date,
  timeZone: string
): SlotParts | undefined {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(date);

  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;
  const hour = parts.find((part) => part.type === 'hour')?.value;
  const minute = parts.find((part) => part.type === 'minute')?.value;
  const second = parts.find((part) => part.type === 'second')?.value ?? '00';

  if (!year || !month || !day || !hour || !minute) {
    return undefined;
  }

  return {
    dateKey: `${year}-${month}-${day}`,
    totalMinutes: Number(hour) * 60 + Number(minute),
    totalSeconds: Number(hour) * 3600 + Number(minute) * 60 + Number(second),
  };
}

export function getDefaultStandupTimeZone(): string {
  return DEFAULT_TIME_ZONE;
}

export function getDateKeyInTimeZone(
  value: Date | string,
  timeZone: string = DEFAULT_TIME_ZONE
): string | undefined {
  const date = parseTimestamp(value);

  if (!date) {
    return undefined;
  }

  return getZonedDateParts(date, timeZone)?.dateKey;
}

function resolveSortableUploadTime(uploadedAt: string | undefined): number {
  const parsedTimestamp = parseTimestamp(uploadedAt)?.getTime();

  return parsedTimestamp === undefined
    ? Number.MAX_SAFE_INTEGER
    : parsedTimestamp;
}
