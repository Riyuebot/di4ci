import { SchemaObject } from '@/yasumiki/schema';
import { defineMvuDataStore } from '@util/mvu';
import { defineStore } from 'pinia';
import { computed } from 'vue';

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

function applyDisplayPatch(data: Record<string, any>, operations: JsonPatchOperation[]) {
  const result = _.cloneDeep(data) as Record<string, any>;

  operations.forEach(operation => {
    if (operation.op === 'replace' && operation.path) {
      _.set(result, decodeJsonPointer(operation.path), operation.value);
      return;
    }

    if (operation.op === 'delta' && operation.path) {
      const path = decodeJsonPointer(operation.path);
      const current = Number(_.get(result, path, 0));
      _.set(result, path, current + Number(operation.value ?? 0));
      return;
    }

    if (operation.op === 'insert' && operation.path) {
      insertByPointer(result, operation.path, operation.value);
      return;
    }

    if (operation.op === 'remove' && operation.path) {
      removeByPointer(result, operation.path);
      return;
    }

    if (operation.op === 'move' && operation.from && operation.to) {
      moveByPointer(result, operation.from, operation.to);
    }
  });

  return result;
}

function reconcileScenePresence(data: Record<string, any>) {
  const result = _.cloneDeep(data) as Record<string, any>;
  const sceneLocation = (_.get(result, '场景.当前地点', '') as string).trim();
  const presentList = (_.get(result, '场景.在场角色列表', []) as string[]).filter(Boolean);
  const absentList = (_.get(result, '场景.缺席角色列表', []) as string[]).filter(Boolean);
  const presentSet = new Set(presentList);

  _.set(
    result,
    '场景.缺席角色列表',
    absentList.filter(name => !presentSet.has(name)),
  );

  const female = _.get(result, '角色.女性角色', {}) as Record<string, Record<string, any>>;
  const male = _.get(result, '角色.男性角色', {}) as Record<string, Record<string, any>>;

  [...Object.entries(female), ...Object.entries(male)].forEach(([name, detail]) => {
    if (!presentSet.has(name) || !_.isObject(detail)) return;

    detail.当前在场状态 = '在场';
    if (sceneLocation) {
      detail.当前所在地点 = sceneLocation;
    }
  });

  return result;
}

const useMvuStore = defineMvuDataStore(SchemaObject, { type: 'message', message_id: 'latest' });

export const useDataStore = defineStore('yasumiki-status-bar', () => {
  const mvuStore = useMvuStore();
  const rawStatData = computed(() => mvuStore.data);
  const latestAssistantMessage = computed(() => {
    const messages = getChatMessages('0-{{lastMessageId}}', { role: 'assistant', include_swipes: true });
    return (messages[messages.length - 1] ?? null) as Record<string, any> | null;
  });
  const latestAssistantMessageMeta = computed(() => {
    const message = latestAssistantMessage.value;
    if (!message) {
      return { content: '', messageId: null as number | null };
    }

    const swipeId = _.get(message, 'swipe_id');
    const swipes = _.get(message, 'swipes');
    if (Array.isArray(swipes) && typeof swipeId === 'number' && typeof swipes[swipeId] === 'string') {
      return {
        content: swipes[swipeId] as string,
        messageId: Number(_.get(message, 'message_id', _.get(message, 'mesid', null))),
      };
    }

    return {
      content: (_.get(message, 'message', '') as string) || '',
      messageId: Number(_.get(message, 'message_id', _.get(message, 'mesid', null))),
    };
  });
  const latestAssistantMessageContent = computed(() => latestAssistantMessageMeta.value.content);
  const latestJsonPatch = computed(() =>
    是否跳过Latest补丁(latestAssistantMessageMeta.value.messageId)
      ? []
      : parseLatestJsonPatch(latestAssistantMessageContent.value),
  );
  const statData = computed(() => {
    const patched = applyDisplayPatch(rawStatData.value, latestJsonPatch.value);
    const reconciled = reconcileScenePresence(patched);
    const parsed = SchemaObject.safeParse(reconciled);
    return parsed.success ? parsed.data : reconciled;
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
    latestJsonPatch,
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
