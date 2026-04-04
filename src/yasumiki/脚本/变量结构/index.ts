import { registerMvuSchema } from 'https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/dist/util/mvu_zod.js';
import { Schema } from '../../schema';

type JsonPatchOperation = {
  op: 'replace' | 'delta' | 'insert' | 'remove' | 'move';
  path?: string;
  value?: any;
  from?: string;
  to?: string;
};

let isRepairingLatest = false;
const debugStateKey = '__yasumikiVariableStructureDebug';
const debugPrefix = '[yasumiki.变量结构]';

function updateDebugState(partial: Record<string, any>) {
  const target = window.parent ?? window;
  const current = (_.get(target, debugStateKey, {}) ?? {}) as Record<string, any>;
  _.set(target, debugStateKey, {
    ...current,
    ...partial,
    updatedAt: new Date().toISOString(),
  });
}

function logDebug(stage: string, extra: Record<string, any> = {}) {
  console.info(`${debugPrefix} ${stage}`, extra);
  updateDebugState({ stage, ...extra });
}

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

function getLatestAssistantMessageContent() {
  const messages = getChatMessages('0-{{lastMessageId}}', { role: 'assistant', include_swipes: true });
  const latest = messages[messages.length - 1] as Record<string, any> | undefined;
  if (!latest) return '';

  const swipeId = _.get(latest, 'swipe_id');
  const swipes = _.get(latest, 'swipes');
  if (Array.isArray(swipes) && typeof swipeId === 'number' && typeof swipes[swipeId] === 'string') {
    return swipes[swipeId] as string;
  }

  return (_.get(latest, 'message', '') as string) || '';
}

function extractMentionedCharacters(message: string, allCharacterNames: string[]) {
  const plainText = message.replace(/<UpdateVariable>[\s\S]*?<\/UpdateVariable>/gi, ' ').replace(/<[^>]+>/g, ' ');

  return new Set(allCharacterNames.filter(name => plainText.includes(name)));
}

function applySelectedPatch(variables: Record<string, any>, operations: JsonPatchOperation[]) {
  const root = (_.get(variables, 'stat_data', {}) ?? {}) as Record<string, any>;

  operations.forEach(operation => {
    if (operation.op === 'replace' && operation.path) {
      _.set(root, decodeJsonPointer(operation.path), operation.value);
      return;
    }

    if (operation.op === 'delta' && operation.path) {
      const path = decodeJsonPointer(operation.path);
      const current = Number(_.get(root, path, 0));
      _.set(root, path, current + Number(operation.value ?? 0));
      return;
    }

    if (operation.op === 'insert' && operation.path) {
      insertByPointer(root, operation.path, operation.value);
      return;
    }

    if (operation.op === 'remove' && operation.path) {
      removeByPointer(root, operation.path);
      return;
    }

    if (operation.op === 'move' && operation.from && operation.to) {
      moveByPointer(root, operation.from, operation.to);
    }
  });
}

function getNarrativeMessageContent(message: string) {
  const withoutUpdateBlock = message.replace(/<UpdateVariable>[\s\S]*?<\/UpdateVariable>/gi, ' ');
  const cleaned = withoutUpdateBlock.replace(/<[^>]+>/g, ' ');
  const anchorList = ['好了，开始敲键盘了！', '开始正文：', '正文：'];

  for (const anchor of anchorList) {
    const index = cleaned.lastIndexOf(anchor);
    if (index >= 0) {
      return cleaned.slice(index + anchor.length);
    }
  }

  return cleaned;
}

function buildFallbackThought(name: string, detail: Record<string, any>) {
  const specificThoughtMap: Record<string, string> = {
    咩子: '这个人身上的味道，好奇怪……',
    山胁多惠: '这外来人果然不祥，雾又不肯散，得防着。',
    美佐峰美辻: '真有意思，局面终于开始晃动了。',
    室匠: '这种时候闯进来的外人，多半会坏事。',
    卷岛宽造: '休水的规矩不能破，外来人必须盯紧。',
    狼爷爷: '嘿嘿，味道对了，今夜又有好戏看。',
    桥本雄大: '先观察吧，这村子的反应比他本人更值得看。',
  };

  if (specificThoughtMap[name]) {
    return specificThoughtMap[name];
  }

  const attitudeText = `${_.get(detail, '对user态度', '')} ${_.get(detail, '当前立场', '')}`.trim();
  if (attitudeText.includes('敌')) return '外来人只会添乱，得盯紧。';
  if (attitudeText.includes('警惕')) return '这种时候多出一个外人，绝不是什么好兆头。';
  if (attitudeText.includes('观察')) return '先看着吧，现在还不能贸然下判断。';
  if (attitudeText.includes('不耐烦')) return '吵死了，别把这种麻烦算到我头上。';
  if (attitudeText.includes('好奇')) return '先看看吧，这个外来人说不定会把局面搅活。';

  return '先看着吧，局面还没到能下结论的时候。';
}

function fillMissingThoughts(variables: Record<string, any>, latestMessageContent = '') {
  const female = _.get(variables, 'stat_data.角色.女性角色', {}) as Record<string, Record<string, any>>;
  const male = _.get(variables, 'stat_data.角色.男性角色', {}) as Record<string, Record<string, any>>;
  const allCharacterNames = [...Object.keys(female), ...Object.keys(male)];
  const mentionedSet = extractMentionedCharacters(latestMessageContent, allCharacterNames);

  [...Object.entries(female), ...Object.entries(male)].forEach(([name, detail]) => {
    if (!_.isObject(detail)) return;
    if (!mentionedSet.has(name)) return;

    const currentStatus = String(_.get(detail, '当前在场状态', '') ?? '').trim();
    if (!['在场', '独处中'].includes(currentStatus)) return;

    const currentThought = String(_.get(detail, '当前心里话', '') ?? '').trim();
    if (currentThought) return;

    _.set(detail, '当前心里话', buildFallbackThought(name, detail));
  });
}

function dedupeStringArray(items: unknown[]) {
  return _.uniq(
    items
      .map(item => String(item ?? '').trim())
      .filter(Boolean),
  );
}

function sanitizeMemoryProgress(variables: Record<string, any>) {
  const cluePath = 'stat_data.线索与真相.已解锁线索列表';
  const truthPath = 'stat_data.线索与真相.已解锁真相列表';
  const recallPath = 'stat_data.线索与真相.已触发线索回收节点列表';
  const truthKeyPath = 'stat_data.永久Key.已获得真相Key列表';
  const roleKeyPath = 'stat_data.永久Key.已获得角色核心Key列表';
  const routeKeyPath = 'stat_data.永久Key.已获得路线Key列表';
  const deepRoutePath = 'stat_data.永久Key.已解锁角色深层路线';

  _.set(variables, cluePath, dedupeStringArray(_.get(variables, cluePath, [])));
  _.set(variables, truthPath, dedupeStringArray(_.get(variables, truthPath, [])));
  _.set(variables, recallPath, dedupeStringArray(_.get(variables, recallPath, [])));
  _.set(variables, truthKeyPath, dedupeStringArray(_.get(variables, truthKeyPath, [])));
  _.set(variables, roleKeyPath, dedupeStringArray(_.get(variables, roleKeyPath, [])));
  _.set(variables, routeKeyPath, dedupeStringArray(_.get(variables, routeKeyPath, [])));
  _.set(variables, deepRoutePath, dedupeStringArray(_.get(variables, deepRoutePath, [])));
}

function reconcilePresence(variables: Record<string, any>, latestMessageContent = '') {
  const sceneLocation = (_.get(variables, 'stat_data.场景.当前地点', '') as string).trim();
  const rawPresentList = _.uniq((_.get(variables, 'stat_data.场景.在场角色列表', []) as string[]).filter(Boolean));

  const female = _.get(variables, 'stat_data.角色.女性角色', {}) as Record<string, Record<string, any>>;
  const male = _.get(variables, 'stat_data.角色.男性角色', {}) as Record<string, Record<string, any>>;
  const allCharacterNames = [...Object.keys(female), ...Object.keys(male)];
  const mentionedSet = extractMentionedCharacters(getNarrativeMessageContent(latestMessageContent), allCharacterNames);

  const presentList = rawPresentList.filter(name => {
    if (name === 'user') return true;

    const detail = female[name] ?? male[name];
    if (!_.isObject(detail)) return false;

    const thought = String(_.get(detail, '当前心里话', '') ?? '').trim();
    const currentStatus = String(_.get(detail, '当前在场状态', '') ?? '').trim();
    const hasSpecialHiddenStatus = ['不可见', '神隐中', '被隔离', '被关押'].includes(currentStatus);

    if (mentionedSet.has(name)) return true;
    if (thought) return true;
    if (hasSpecialHiddenStatus) return false;
    return false;
  });

  const presentSet = new Set(presentList);

  _.set(variables, 'stat_data.场景.在场角色列表', presentList);
  _.set(
    variables,
    'stat_data.场景.缺席角色列表',
    allCharacterNames.filter(name => !presentSet.has(name)),
  );

  [...Object.entries(female), ...Object.entries(male)].forEach(([name, detail]) => {
    if (!_.isObject(detail)) return;

    const currentStatus = (_.get(detail, '当前在场状态', '离场') as string) || '离场';
    const hasSpecialHiddenStatus = ['不可见', '神隐中', '被隔离', '被关押'].includes(currentStatus);

    if (presentSet.has(name)) {
      if (!hasSpecialHiddenStatus) {
        _.set(detail, '当前在场状态', '在场');
        if (sceneLocation) {
          _.set(detail, '当前所在地点', sceneLocation);
        }
      }
      return;
    }

    if (currentStatus === '在场' || currentStatus === '独处中') {
      _.set(detail, '当前在场状态', '离场');
    }
  });
}

async function repairLatestMessageVariables(trigger = 'manual') {
  if (isRepairingLatest) {
    logDebug('跳过重复 latest 修正', { trigger });
    return;
  }

  if (typeof Mvu === 'undefined' || !Mvu?.getMvuData || !Mvu?.replaceMvuData) {
    logDebug('Mvu 尚未就绪，跳过 latest 修正', { trigger });
    return;
  }

  const latestMessageContent = getLatestAssistantMessageContent();
  const operations = parseLatestJsonPatch(latestMessageContent);

  isRepairingLatest = true;
  try {
    const latest = Mvu.getMvuData({ type: 'message', message_id: 'latest' });
    const before = JSON.stringify(_.get(latest, 'stat_data', {}));

    if (operations.length) {
      applySelectedPatch(latest, operations);
    }
    reconcilePresence(latest, latestMessageContent);
    fillMissingThoughts(latest, getNarrativeMessageContent(latestMessageContent));
    sanitizeMemoryProgress(latest);

    const after = JSON.stringify(_.get(latest, 'stat_data', {}));
    if (before === after) {
      logDebug('latest 修正后无变化', { trigger, operationCount: operations.length });
      return;
    }

    await Mvu.replaceMvuData(latest, { type: 'message', message_id: 'latest' });
    logDebug('latest 修正已写回', { trigger, operationCount: operations.length });
  } catch (error) {
    console.error(`${debugPrefix} latest 修正失败`, error);
    updateDebugState({
      stage: 'latest 修正失败',
      trigger,
      error: String(error),
    });
  } finally {
    isRepairingLatest = false;
  }
}

function scheduleRepairLatest(trigger = 'scheduled') {
  [0, 120, 500, 1500, 3000, 5000].forEach(delay => {
    _.delay(() => {
      void repairLatestMessageVariables(`${trigger}:${delay}ms`);
    }, delay);
  });
}

async function init() {
  logDebug('初始化开始');
  registerMvuSchema(Schema);
  logDebug('Schema 已注册，等待 Mvu 初始化');
  await waitGlobalInitialized('Mvu');
  logDebug('Mvu 初始化完成');

  await repairLatestMessageVariables('init');

  eventOn(Mvu.events.VARIABLE_INITIALIZED, (variables, swipeId) => {
    reconcilePresence(variables, getLatestAssistantMessageContent());
    logDebug('VARIABLE_INITIALIZED', { swipeId });
    scheduleRepairLatest('VARIABLE_INITIALIZED');
  });

  eventOn(Mvu.events.BEFORE_MESSAGE_UPDATE, context => {
    const latestMessageContent = getLatestAssistantMessageContent() || context.message_content;
    const operations = parseLatestJsonPatch(latestMessageContent);
    if (operations.length) {
      applySelectedPatch(context.variables, operations);
    }
    reconcilePresence(context.variables, latestMessageContent);
    fillMissingThoughts(context.variables, getNarrativeMessageContent(latestMessageContent));
    sanitizeMemoryProgress(context.variables);
    logDebug('BEFORE_MESSAGE_UPDATE', { operationCount: operations.length });
  });

  eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, variables => {
    const latestMessageContent = getLatestAssistantMessageContent();
    const operations = parseLatestJsonPatch(latestMessageContent);
    if (operations.length) {
      applySelectedPatch(variables, operations);
    }
    reconcilePresence(variables, latestMessageContent);
    fillMissingThoughts(variables, getNarrativeMessageContent(latestMessageContent));
    sanitizeMemoryProgress(variables);
    logDebug('VARIABLE_UPDATE_ENDED', { operationCount: operations.length });
    scheduleRepairLatest('VARIABLE_UPDATE_ENDED');
  });
  eventOn(tavern_events.MESSAGE_RECEIVED, () => {
    logDebug('MESSAGE_RECEIVED');
    scheduleRepairLatest('MESSAGE_RECEIVED');
  });
  eventOn(tavern_events.MESSAGE_UPDATED, () => {
    logDebug('MESSAGE_UPDATED');
    scheduleRepairLatest('MESSAGE_UPDATED');
  });
  eventOn(tavern_events.MESSAGE_SWIPED, () => {
    logDebug('MESSAGE_SWIPED');
    scheduleRepairLatest('MESSAGE_SWIPED');
  });

  logDebug('变量结构注册成功，并已启用 latest patch 持久修正');
}

$(() => {
  errorCatched(init)();
});
