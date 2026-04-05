import { registerMvuSchema } from 'https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/dist/util/mvu_zod.js';
import { Schema } from '../../schema';
import initvarText from '../../世界书/变量/initvar.yaml?raw';

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
const loopResetNarration = '……眼前猛地一晃。等你回过神时，你已经又站回了刚才的场面里。';
const loopResetSkipPatchStorageKey = '__yasumikiSkipPatchUntilAssistantMessageId';
const pendingLoopPromptStorageKey = '__yasumikiPendingLoopPrompt';
const pendingLoopPromptDeliveredStorageKey = '__yasumikiPendingLoopPromptDelivered';
const 初始轮回变量 = Schema.parse(YAML.parse(initvarText));


function 获取调试目标窗口() {
  return window.parent ?? window;
}

function 暴露轮回重置接口() {
  const target = 获取调试目标窗口() as Window & {
    __yasumikiLoopReset?: () => Promise<void>;
  };
  target.__yasumikiLoopReset = () => 执行轮回重置('status_bar_button');
}

function 清除待触发轮回提示(reason = 'manual_clear') {
  window.localStorage.removeItem(pendingLoopPromptStorageKey);
  window.localStorage.removeItem(pendingLoopPromptDeliveredStorageKey);
  uninjectPrompts(['yasumiki.loop-reset-persist']);
  logDebug('已清除轮回提示注入', { reason });
}

function 轮回提示是否已送达() {
  return window.localStorage.getItem(pendingLoopPromptDeliveredStorageKey) === 'true';
}

function 标记轮回提示已送达(reason = 'message_received') {
  if (!window.localStorage.getItem(pendingLoopPromptStorageKey)) return;
  window.localStorage.setItem(pendingLoopPromptDeliveredStorageKey, 'true');
  logDebug('已标记轮回提示送达', { reason });
}

function 注册待触发轮回提示() {
  const pendingPrompt = window.localStorage.getItem(pendingLoopPromptStorageKey);
  if (!pendingPrompt) return;

  uninjectPrompts(['yasumiki.loop-reset-persist']);
  injectPrompts([
    {
      id: 'yasumiki.loop-reset-persist',
      role: 'system',
      content: pendingPrompt,
      position: 'in_chat',
      depth: 0,
      should_scan: true,
      filter: () => Boolean(window.localStorage.getItem(pendingLoopPromptStorageKey)),
    },
  ]);
  logDebug('已注册可跨重新生成的轮回提示注入');
}

function 构建轮回后场面提示(nextData: Record<string, any>) {
  const stateSnapshot = {
    世界: {
      当前轮回编号: _.get(nextData, '世界.当前轮回编号', 1),
      当前路线: _.get(nextData, '世界.当前路线', '未定'),
      当前章节: _.get(nextData, '世界.当前章节', '序章'),
      当前日期: _.get(nextData, '世界.当前日期', '5月11日'),
      当前时刻: _.get(nextData, '世界.当前时刻', '09:00'),
      当前时间段: _.get(nextData, '世界.当前时间段', '清晨'),
      是否起雾: _.get(nextData, '世界.是否起雾', false),
      是否处于宴会阶段: _.get(nextData, '世界.是否处于宴会阶段', false),
    },
    场景: {
      当前地点: _.get(nextData, '场景.当前地点', '学生公寓'),
      在场角色列表: _.get(nextData, '场景.在场角色列表', []),
      当前宴会参与角色列表: _.get(nextData, '场景.当前宴会参与角色列表', []),
    },
    主角: {
      当前所在地点: _.get(nextData, '主角.当前所在地点', '学生公寓'),
      当前在场状态: _.get(nextData, '主角.当前在场状态', '在场'),
      本轮功能身份: _.get(nextData, '主角.本轮功能身份', '未分配'),
      当前阵营: _.get(nextData, '主角.当前阵营', '未知'),
      当前状态: _.get(nextData, '主角.当前状态', '清醒'),
    },
  };

  return [
    '刚刚发生了一次轮回错位。下一次回复中，必须直接以“当前变量里的现状”继续正文，不要回到开局，不要沿用旧楼层中的旧场景，也不要假装看不到当前变量。',
    '可以让主角短暂感到似曾相识、恍惚、时间错位，但不要直说“轮回”。',
    '以下是轮回后的当前状态快照，你必须以它为准：',
    '<yasumiki_loop_state>',
    YAML.stringify(stateSnapshot).trim(),
    '</yasumiki_loop_state>',
  ].join('\n');
}

function updateDebugState(partial: Record<string, any>) {
  const target = 获取调试目标窗口();
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

function 读取跳过补丁阈值() {
  const raw = window.localStorage.getItem(loopResetSkipPatchStorageKey);
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function 设置跳过补丁阈值(messageId: number | null | undefined) {
  if (typeof messageId !== 'number' || Number.isNaN(messageId)) return;
  window.localStorage.setItem(loopResetSkipPatchStorageKey, String(messageId));
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

function getLatestAssistantMessageMeta() {
  const messages = getChatMessages('0-{{lastMessageId}}', { role: 'assistant', include_swipes: true });
  const latest = messages[messages.length - 1] as Record<string, any> | undefined;
  if (!latest) {
    return { content: '', messageId: null as number | null };
  }

  const swipeId = _.get(latest, 'swipe_id');
  const swipes = _.get(latest, 'swipes');
  if (Array.isArray(swipes) && typeof swipeId === 'number' && typeof swipes[swipeId] === 'string') {
    return {
      content: swipes[swipeId] as string,
      messageId: Number(_.get(latest, 'message_id', _.get(latest, 'mesid', null))),
    };
  }

  return {
    content: (_.get(latest, 'message', '') as string) || '',
    messageId: Number(_.get(latest, 'message_id', _.get(latest, 'mesid', null))),
  };
}

function getLatestAssistantMessageContent() {
  return getLatestAssistantMessageMeta().content;
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
  return _.uniq(items.map(item => String(item ?? '').trim()).filter(Boolean));
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

function 计算残留关系(currentData: Record<string, any>, nextData: Record<string, any>) {
  const 映射 = [
    ['芹泽千枝实', '信任', '跨轮残留.角色残留关系.千枝实残留关系'],
    ['回末李花子', '信赖', '跨轮残留.角色残留关系.李花子残留关系'],
    ['马宫久子', '合作度', '跨轮残留.角色残留关系.久子残留关系'],
    ['织部香织', '顺从度', '跨轮残留.角色残留关系.香织残留关系'],
    ['卷岛春', '依赖', '跨轮残留.角色残留关系.春残留关系'],
    ['咩子', '依赖', '跨轮残留.角色残留关系.咩子残留关系'],
  ] as const;

  映射.forEach(([角色名, 字段名, 残留路径]) => {
    const 当前值 = Number(_.get(currentData, `角色.女性角色.${角色名}.${字段名}`, 0));
    const 初始值 = Number(_.get(初始轮回变量, `角色.女性角色.${角色名}.${字段名}`, 0));
    const 有效增量 = Math.max(0, 当前值 - 初始值);
    const 旧残留 = Number(_.get(currentData, 残留路径, 0));
    const 新残留 = _.clamp(Math.max(旧残留, Math.floor(有效增量 * 0.35)), 0, 100);
    _.set(nextData, 残留路径, 新残留);
  });

  const 当前认知 = Number(_.get(currentData, '跨轮残留.轮回认知.user轮回认知层级', 0));
  _.set(nextData, '跨轮残留.轮回认知.user轮回认知层级', _.clamp(当前认知 + 1, 0, 10));

  const 千枝实记忆 = Number(_.get(currentData, '跨轮残留.轮回认知.千枝实轮回记忆清晰度', 0));
  _.set(nextData, '跨轮残留.轮回认知.千枝实轮回记忆清晰度', _.clamp(Math.max(千枝实记忆, 15), 0, 100));

  const 旧梦境稳定度 = Number(_.get(currentData, '跨轮残留.神异连续.梦境稳定度', 100));
  _.set(nextData, '跨轮残留.神异连续.梦境稳定度', _.clamp(旧梦境稳定度 - 5, 0, 100));
}

function 应用可继承线索(currentData: Record<string, any>, nextData: Record<string, any>) {
  _.set(nextData, '线索与真相.已解锁线索列表', []);
  _.set(nextData, '线索与真相.已解锁真相列表', _.cloneDeep(_.get(currentData, '线索与真相.已解锁真相列表', [])));
  _.set(
    nextData,
    '线索与真相.已触发线索回收节点列表',
    _.cloneDeep(_.get(currentData, '线索与真相.已触发线索回收节点列表', [])),
  );
}

function 应用角色轮回残响(nextData: Record<string, any>) {
  const 残响规则 = [
    [
      '跨轮残留.角色残留关系.千枝实残留关系',
      '角色.女性角色.芹泽千枝实.当前心里话',
      15,
      '……为什么总觉得，好像已经见过你。',
    ],
    ['跨轮残留.角色残留关系.春残留关系', '角色.女性角色.卷岛春.当前心里话', 10, '又是这种感觉……你不准突然不见。'],
    ['跨轮残留.角色残留关系.李花子残留关系', '角色.女性角色.回末李花子.当前心里话', 20, '梦里见过的气息，又回来了。'],
    ['跨轮残留.角色残留关系.咩子残留关系', '角色.女性角色.咩子.当前心里话', 10, '……认得你。味道没有变。'],
  ] as const;

  残响规则.forEach(([残留路径, 心里话路径, 阈值, 文本]) => {
    const 残留值 = Number(_.get(nextData, 残留路径, 0));
    if (残留值 >= 阈值) {
      _.set(nextData, 心里话路径, 文本);
    }
  });
}

function 同步当前角色场面锚点(currentData: Record<string, any>, nextData: Record<string, any>) {
  (['女性角色', '男性角色'] as const).forEach(分组名 => {
    const currentGroup = _.get(currentData, `角色.${分组名}`, {}) as Record<string, Record<string, any>>;

    Object.entries(currentGroup).forEach(([角色名, detail]) => {
      if (!_.isObject(detail)) return;
      const basePath = `角色.${分组名}.${角色名}`;
      _.set(
        nextData,
        `${basePath}.当前所在地点`,
        _.get(detail, '当前所在地点', _.get(nextData, `${basePath}.当前所在地点`)),
      );
      _.set(
        nextData,
        `${basePath}.当前在场状态`,
        _.get(detail, '当前在场状态', _.get(nextData, `${basePath}.当前在场状态`, '离场')),
      );
      _.set(nextData, `${basePath}.当前心里话`, '');

      if (_.has(detail, '本轮功能身份')) {
        _.set(
          nextData,
          `${basePath}.本轮功能身份`,
          _.get(detail, '本轮功能身份', _.get(nextData, `${basePath}.本轮功能身份`, '未分配')),
        );
      }
      if (_.has(detail, '当前立场')) {
        _.set(nextData, `${basePath}.当前立场`, _.get(detail, '当前立场', _.get(nextData, `${basePath}.当前立场`)));
      }
      if (_.has(detail, '对user态度')) {
        _.set(
          nextData,
          `${basePath}.对user态度`,
          _.get(detail, '对user态度', _.get(nextData, `${basePath}.对user态度`)),
        );
      }
      if (_.has(detail, '当前是否现身')) {
        _.set(
          nextData,
          `${basePath}.当前是否现身`,
          _.get(detail, '当前是否现身', _.get(nextData, `${basePath}.当前是否现身`)),
        );
      }
      if (_.has(detail, '当前干涉状态')) {
        _.set(
          nextData,
          `${basePath}.当前干涉状态`,
          _.get(detail, '当前干涉状态', _.get(nextData, `${basePath}.当前干涉状态`)),
        );
      }
      if (_.has(detail, '是否已介入本轮')) {
        _.set(
          nextData,
          `${basePath}.是否已介入本轮`,
          _.get(detail, '是否已介入本轮', _.get(nextData, `${basePath}.是否已介入本轮`)),
        );
      }
    });
  });
}

function 应用当前场面锚点(currentData: Record<string, any>, nextData: Record<string, any>) {
  ['当前路线', '当前章节', '当前日期', '当前时刻', '当前时间段', '是否起雾', '是否处于宴会阶段', '主线层级'].forEach(
    字段名 => {
      _.set(nextData, `世界.${字段名}`, _.get(currentData, `世界.${字段名}`, _.get(nextData, `世界.${字段名}`)));
    },
  );

  _.set(nextData, '场景', _.cloneDeep(_.get(currentData, '场景', _.get(nextData, '场景', {}))));
  _.set(nextData, '宴会', _.cloneDeep(_.get(currentData, '宴会', _.get(nextData, '宴会', {}))));
  _.set(nextData, '主角.当前所在地点', _.get(currentData, '主角.当前所在地点', _.get(nextData, '主角.当前所在地点')));
  _.set(nextData, '主角.当前在场状态', _.get(currentData, '主角.当前在场状态', _.get(nextData, '主角.当前在场状态')));
  _.set(nextData, '主角.本轮功能身份', _.get(currentData, '主角.本轮功能身份', _.get(nextData, '主角.本轮功能身份')));
  _.set(nextData, '主角.当前阵营', _.get(currentData, '主角.当前阵营', _.get(nextData, '主角.当前阵营')));
  _.set(nextData, '主角.当前状态', _.get(currentData, '主角.当前状态', _.get(nextData, '主角.当前状态')));
  _.set(
    nextData,
    '主角.是否完成宴前准备',
    _.get(currentData, '主角.是否完成宴前准备', _.get(nextData, '主角.是否完成宴前准备')),
  );
  _.set(
    nextData,
    '主角.是否已知晓身份',
    _.get(currentData, '主角.是否已知晓身份', _.get(nextData, '主角.是否已知晓身份')),
  );

  同步当前角色场面锚点(currentData, nextData);
}

function 构建轮回重置变量(currentVariables: Record<string, any>) {
  const currentData = Schema.parse(_.get(currentVariables, 'stat_data', {}));
  const nextData = _.cloneDeep(初始轮回变量);

  _.set(nextData, '永久Key', _.cloneDeep(_.get(currentData, '永久Key', {})));
  _.set(nextData, '跨轮残留', _.cloneDeep(_.get(currentData, '跨轮残留', {})));
  应用可继承线索(currentData, nextData);
  _.set(nextData, '世界.当前轮回编号', Number(_.get(currentData, '世界.当前轮回编号', 1)) + 1);
  应用当前场面锚点(currentData, nextData);

  计算残留关系(currentData, nextData);
  应用角色轮回残响(nextData);
  return Schema.parse(nextData);
}

async function 执行轮回重置(trigger = 'manual_button') {
  if (typeof Mvu === 'undefined' || !Mvu?.getMvuData || !Mvu?.replaceMvuData) {
    toastr.error('Mvu 尚未初始化，无法执行轮回重置');
    return;
  }

  try {
    toastr.info(loopResetNarration, '轮回开始');
    await new Promise(resolve => setTimeout(resolve, 900));

    const { messageId } = getLatestAssistantMessageMeta();
    设置跳过补丁阈值(messageId);

    const latest = Mvu.getMvuData({ type: 'message', message_id: 'latest' });
    const nextData = 构建轮回重置变量(latest);
    window.localStorage.setItem(pendingLoopPromptStorageKey, 构建轮回后场面提示(nextData));
    window.localStorage.setItem(pendingLoopPromptDeliveredStorageKey, 'false');
    _.set(latest, 'stat_data', nextData);
    await Mvu.replaceMvuData(latest, { type: 'message', message_id: 'latest' });
    toastr.success('已执行轮回重置，跨轮变量已保留');
    logDebug('轮回重置已执行', { trigger, loop: _.get(nextData, '世界.当前轮回编号') });
    window.location.reload();
  } catch (error) {
    console.error(`${debugPrefix} 轮回重置失败`, error);
    toastr.error(`轮回重置失败: ${String(error)}`);
    updateDebugState({ stage: '轮回重置失败', trigger, error: String(error) });
  }
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

  const latestMessage = getLatestAssistantMessageMeta();
  const latestMessageContent = latestMessage.content;
  const operations = 是否跳过Latest补丁(latestMessage.messageId) ? [] : parseLatestJsonPatch(latestMessageContent);

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

  暴露轮回重置接口();
  注册待触发轮回提示();
  eventOn(tavern_events.MESSAGE_SENT, () => {
    if (window.localStorage.getItem(pendingLoopPromptStorageKey) && 轮回提示是否已送达()) {
      清除待触发轮回提示('MESSAGE_SENT_AFTER_LOOP_SCENE');
    }
  });
  eventOn(tavern_events.CHAT_CHANGED, () => {
    清除待触发轮回提示('CHAT_CHANGED');
  });

  await repairLatestMessageVariables('init');

  eventOn(Mvu.events.VARIABLE_INITIALIZED, (variables, swipeId) => {
    reconcilePresence(variables, getLatestAssistantMessageContent());
    logDebug('VARIABLE_INITIALIZED', { swipeId });
    scheduleRepairLatest('VARIABLE_INITIALIZED');
  });

  eventOn(Mvu.events.BEFORE_MESSAGE_UPDATE, context => {
    const latestMessage = getLatestAssistantMessageMeta();
    const latestMessageContent = latestMessage.content || context.message_content;
    const operations = 是否跳过Latest补丁(latestMessage.messageId) ? [] : parseLatestJsonPatch(latestMessageContent);
    if (operations.length) {
      applySelectedPatch(context.variables, operations);
    }
    reconcilePresence(context.variables, latestMessageContent);
    fillMissingThoughts(context.variables, getNarrativeMessageContent(latestMessageContent));
    sanitizeMemoryProgress(context.variables);
    logDebug('BEFORE_MESSAGE_UPDATE', { operationCount: operations.length });
  });

  eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, variables => {
    const latestMessage = getLatestAssistantMessageMeta();
    const latestMessageContent = latestMessage.content;
    const operations = 是否跳过Latest补丁(latestMessage.messageId) ? [] : parseLatestJsonPatch(latestMessageContent);
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
    标记轮回提示已送达('MESSAGE_RECEIVED');
    logDebug('MESSAGE_RECEIVED');
    scheduleRepairLatest('MESSAGE_RECEIVED');
  });
  eventOn(tavern_events.MESSAGE_UPDATED, () => {
    标记轮回提示已送达('MESSAGE_UPDATED');
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
