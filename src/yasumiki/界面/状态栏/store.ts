import { SchemaObject } from '@/yasumiki/schema';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

type CharacterRecord = {
  name: string;
  type: 'female' | 'male';
  detail: Record<string, any>;
};

type JsonPatchOperation = {
  op: 'replace' | 'delta' | 'insert' | 'remove' | 'move';
  path?: string;
  value?: any;
  from?: string;
  to?: string;
};

const loopResetSkipPatchStorageKey = '__yasumikiSkipPatchUntilAssistantMessageId';

function decodeJsonPointer(path: string) {
  return path
    .split('/')
    .slice(1)
    .map(segment => segment.replaceAll('~1', '/').replaceAll('~0', '~'));
}

function removeByPointer(target: Record<string, any>, path: string) {
  const segments = decodeJsonPointer(path);
  const last = segments.pop();
  if (last === undefined) return;

  const parent = segments.length ? _.get(target, segments) : target;
  if (Array.isArray(parent)) {
    const index = Number(last);
    if (!Number.isNaN(index)) parent.splice(index, 1);
    return;
  }

  if (_.isObject(parent)) {
    delete (parent as Record<string, any>)[last];
  }
}

function insertByPointer(target: Record<string, any>, path: string, value: any) {
  const segments = decodeJsonPointer(path);
  const last = segments.pop();
  if (last === undefined) return;

  const parent = segments.length ? _.get(target, segments) : target;
  if (Array.isArray(parent)) {
    if (last === '-') {
      parent.push(value);
      return;
    }

    const index = Number(last);
    if (!Number.isNaN(index)) {
      parent.splice(index, 0, value);
    }
    return;
  }

  _.set(target, [...segments, last], value);
}

function moveByPointer(target: Record<string, any>, from: string, to: string) {
  const value = _.get(target, decodeJsonPointer(from));
  removeByPointer(target, from);
  insertByPointer(target, to, value);
}

function parseLatestJsonPatch(message: string) {
  const matched = message.match(/<JSONPatch>\s*([\s\S]*?)\s*<\/JSONPatch>/i);
  if (!matched) return [] as JsonPatchOperation[];

  try {
    const parsed = JSON.parse(matched[1]);
    return Array.isArray(parsed) ? (parsed as JsonPatchOperation[]) : [];
  } catch {
    return [] as JsonPatchOperation[];
  }
}

function 读取跳过补丁阈值() {
  const raw = window.localStorage.getItem(loopResetSkipPatchStorageKey);
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function 是否跳过Latest补丁(messageId: number | null | undefined) {
  const threshold = 读取跳过补丁阈值();
  if (threshold === null) return false;
  if (typeof messageId === 'number' && messageId > threshold) {
    window.localStorage.removeItem(loopResetSkipPatchStorageKey);
    return false;
  }
  return true;
}

function 读取当前楼层变量选项(): VariableOption {
  return {
    type: 'message',
    message_id: getCurrentMessageId(),
  };
}

export const useDataStore = defineStore('yasumiki-status-bar', () => {
  const rawStatData = ref<Record<string, any>>(_.get(getVariables(读取当前楼层变量选项()), 'stat_data', {}));

  function 同步当前楼层变量(nextRawStatData?: Record<string, any>) {
    const variableOption = 读取当前楼层变量选项();
    const currentRawStatData = nextRawStatData ?? _.get(getVariables(variableOption), 'stat_data', {});
    const parsed = SchemaObject.safeParse(currentRawStatData);
    const normalizedStatData = parsed.success ? parsed.data : currentRawStatData;

    if (!_.isEqual(rawStatData.value, normalizedStatData)) {
      rawStatData.value = normalizedStatData;
    }

    if (parsed.success && !_.isEqual(currentRawStatData, parsed.data)) {
      updateVariablesWith(variables => _.set(variables, 'stat_data', parsed.data), variableOption);
    }
  }

  同步当前楼层变量();

  eventOn(Mvu.events.VARIABLE_INITIALIZED, variables => {
    同步当前楼层变量(_.get(variables, 'stat_data', {}));
  });

  eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, variables => {
    同步当前楼层变量(_.get(variables, 'stat_data', {}));
  });

  eventOn(tavern_events.MESSAGE_UPDATED, () => {
    同步当前楼层变量();
  });

  eventOn(tavern_events.MESSAGE_SWIPED, () => {
    同步当前楼层变量();
  });

  useIntervalFn(() => {
    同步当前楼层变量();
  }, 10000);

  const statData = computed(() => {
    const parsed = SchemaObject.safeParse(rawStatData.value);
    return parsed.success ? parsed.data : rawStatData.value;
  });

  const world = computed(() => statData.value.世界 ?? {});
  const scene = computed(() => statData.value.场景 ?? {});
  const banquet = computed(() => statData.value.宴会 ?? {});
  const protagonist = computed(() => statData.value.主角 ?? {});
  const clues = computed(() => statData.value.线索与真相 ?? {});
  const permanentKeys = computed(() => statData.value.永久Key ?? {});
  const crossLoop = computed(() => statData.value.跨轮残留 ?? {});
  const femaleCharacters = computed(() => statData.value.角色?.女性角色 ?? {});
  const maleCharacters = computed(() => statData.value.角色?.男性角色 ?? {});

  const allCharacters = computed<CharacterRecord[]>(() => {
    const female = Object.entries(femaleCharacters.value).map(([name, detail]) => ({
      name,
      type: 'female' as const,
      detail: (detail ?? {}) as Record<string, any>,
    }));
    const male = Object.entries(maleCharacters.value).map(([name, detail]) => ({
      name,
      type: 'male' as const,
      detail: (detail ?? {}) as Record<string, any>,
    }));
    return [...female, ...male];
  });

  const presentNames = computed(() => new Set<string>((scene.value.在场角色列表 ?? []) as string[]));

  const mergedCharacters = computed(() =>
    allCharacters.value.map(char => ({
      ...char,
      isPresent: presentNames.value.has(char.name),
    })),
  );

  return {
    data: statData,
    statData,
    rawStatData,
    world,
    scene,
    banquet,
    protagonist,
    clues,
    permanentKeys,
    crossLoop,
    mergedCharacters,
  };
});
