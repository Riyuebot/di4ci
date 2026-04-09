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
const loopResetSkipPatchChatIdStorageKey = '__yasumikiSkipPatchChatId';
const pendingLoopPromptStorageKey = '__yasumikiPendingLoopPrompt';
const pendingLoopPromptDeliveredStorageKey = '__yasumikiPendingLoopPromptDelivered';
const 初始轮回变量 = Schema.parse(YAML.parse(initvarText));
const 固定女性角色名列表 = Object.keys(
  _.get(初始轮回变量, '角色.女性角色', {}) as Record<string, any>,
)
  .map(name => String(name ?? '').trim())
  .filter(Boolean);
const 固定男性角色名列表 = Object.keys(
  _.get(初始轮回变量, '角色.男性角色', {}) as Record<string, any>,
)
  .map(name => String(name ?? '').trim())
  .filter(Boolean);
const 固定角色名列表 = _.uniq([...固定女性角色名列表, ...固定男性角色名列表]);
const 固定角色名集合 = new Set(固定角色名列表);
const 固定角色名单提示文本 = 固定角色名列表.join('、');

function 获取调试目标窗口() {
  return window.parent ?? window;
}

function 获取主角别名列表() {
  return _.uniq(['user', '主角', '你', 获取当前用户名称()].map(name => String(name ?? '').trim()).filter(Boolean));
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
    宴会: {
      当前宴会轮次: _.get(nextData, '宴会.当前宴会轮次', 0),
      今日是否已召开宴会: _.get(nextData, '宴会.今日是否已召开宴会', false),
      本轮身份分配表: _.get(nextData, '宴会.本轮身份分配表', {}),
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
    '这是新的一轮。若快照里已经存在本轮身份、阵营、印记或宴会分配表，它们都属于这一轮的新结果，不得沿用上一轮的旧身份。',
    `如果需要提到昨夜出事者、宴会参与者或被怀疑者，只能使用这 16 个固定角色：${固定角色名单提示文本}。不要临时新增陌生村民、某户、老宅或其他外来名字。`,
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

function encodeJsonPointer(segments: string[]) {
  return `/${segments.map(segment => segment.replaceAll('~', '~0').replaceAll('/', '~1')).join('/')}`;
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

function getCurrentChatIdSafe() {
  try {
    return String(SillyTavern.getCurrentChatId?.() ?? '');
  } catch {
    return '';
  }
}

function 清除跳过补丁阈值() {
  window.localStorage.removeItem(loopResetSkipPatchStorageKey);
  window.localStorage.removeItem(loopResetSkipPatchChatIdStorageKey);
}

const 核心漂移补丁前缀 = [
  '/世界/当前轮回编号',
  '/世界/当前日期',
  '/世界/当前时刻',
  '/世界/当前时间段',
  '/世界/是否起雾',
  '/世界/是否处于宴会阶段',
  '/场景/当前地点',
  '/场景/在场角色列表',
  '/场景/缺席角色列表',
  '/场景/当前宴会参与角色列表',
  '/宴会/本轮身份分配表',
  '/主角/当前所在地点',
  '/主角/当前在场状态',
  '/主角/当前状态',
  '/主角/本轮功能身份',
  '/主角/当前阵营',
  '/主角/是否已知晓身份',
  '/主角/是否完成宴前准备',
] as const;

function 归一化核心漂移补丁路径(pointer: string) {
  const path = String(pointer ?? '').trim();
  if (!path) return '';

  const matchedPrefix = 核心漂移补丁前缀.find(prefix => path === prefix || path.startsWith(`${prefix}/`));
  if (matchedPrefix) return matchedPrefix;

  if (/^\/角色\/(女性角色|男性角色)\/[^/]+\/(当前所在地点|当前在场状态|本轮功能身份)$/.test(path)) {
    return '/角色/当前场面锚点';
  }

  return '';
}

function 提取核心漂移补丁路径(operations: JsonPatchOperation[]) {
  return _.uniq(
    operations.flatMap(operation =>
      [operation.path, operation.from, operation.to]
        .filter((pointer): pointer is string => typeof pointer === 'string' && pointer.length > 0)
        .map(归一化核心漂移补丁路径)
        .filter(Boolean),
    ),
  );
}

function 读取跳过补丁阈值() {
  const raw = window.localStorage.getItem(loopResetSkipPatchStorageKey);
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function 设置跳过补丁阈值(messageId: number | null | undefined) {
  if (typeof messageId !== 'number' || Number.isNaN(messageId)) return;
  window.localStorage.setItem(loopResetSkipPatchStorageKey, String(messageId));
  const chatId = getCurrentChatIdSafe();
  if (chatId) {
    window.localStorage.setItem(loopResetSkipPatchChatIdStorageKey, chatId);
  }
}

function 是否跳过Latest补丁(messageId: number | null | undefined) {
  const threshold = 读取跳过补丁阈值();
  if (threshold === null) return false;
  const storedChatId = window.localStorage.getItem(loopResetSkipPatchChatIdStorageKey);
  const currentChatId = getCurrentChatIdSafe();
  if (!storedChatId || (currentChatId && storedChatId !== currentChatId)) {
    清除跳过补丁阈值();
    return false;
  }
  if (typeof messageId === 'number' && messageId > threshold) {
    清除跳过补丁阈值();
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

function getPreviousAssistantMessageId() {
  const messages = getChatMessages('0-{{lastMessageId}}', { role: 'assistant', include_swipes: true }) as Record<
    string,
    any
  >[];
  const previous = messages[messages.length - 2];
  if (!previous) return null;
  const messageId = Number(_.get(previous, 'message_id', _.get(previous, 'mesid', null)));
  return Number.isFinite(messageId) ? messageId : null;
}

function 提取用户原始输入(message: string) {
  const content = String(message ?? '');
  const anchor = '以上是用户的本轮输入';
  const index = content.indexOf(anchor);
  return (index >= 0 ? content.slice(0, index) : content).trim();
}

function getLatestUserMessageMeta() {
  const messages = getChatMessages('0-{{lastMessageId}}', { role: 'user' });
  const latest = messages[messages.length - 1] as Record<string, any> | undefined;
  if (!latest) {
    return { content: '', messageId: null as number | null };
  }

  return {
    content: 提取用户原始输入((_.get(latest, 'message', '') as string) || ''),
    messageId: Number(_.get(latest, 'message_id', _.get(latest, 'mesid', null))),
  };
}

function getLatestUserMessageContent() {
  return getLatestUserMessageMeta().content;
}

function 获取前一助手楼层变量() {
  const previousAssistantMessageId = getPreviousAssistantMessageId();
  if (previousAssistantMessageId === null) return null;
  if (typeof Mvu === 'undefined' || !Mvu?.getMvuData) return null;

  try {
    return _.get(Mvu.getMvuData({ type: 'message', message_id: previousAssistantMessageId }), 'stat_data', null) as
      | Record<string, any>
      | null;
  } catch {
    return null;
  }
}

const 远距观察句关键词 = [
  '窗外',
  '窗边',
  '窗帘缝',
  '顺着窗帘缝隙',
  '隔着窗',
  '透过窗',
  '从这个位置',
  '从你们这个位置',
  '往外看',
  '朝外看',
  '远远看',
  '远远听见',
  '离得远',
  '立岩周围',
  '围了一圈村民',
  '村子中心',
  '楼下',
  '外面',
  '外头',
] as const;
const 远距观察句模式 = new RegExp(远距观察句关键词.map(keyword => _.escapeRegExp(keyword)).join('|'), 'u');
const 远距观察地点映射 = [
  { pattern: /立岩|村子中心/u, location: '村中' },
  { pattern: /集会堂/u, location: '集会堂' },
  { pattern: /食堂/u, location: '村中食堂' },
] as const;

function 拆分叙事句子(message: string) {
  return getNarrativeMessageContent(message)
    .replace(/\r/g, '\n')
    .split(/(?<=[。！？!?])|\n+/u)
    .map(sentence => sentence.trim())
    .filter(Boolean);
}

function 提取消息角色提及(message: string, allCharacterNames: string[]) {
  const local = new Set<string>();
  const remote = new Set<string>();
  let remoteScope = 0;

  拆分叙事句子(message).forEach(sentence => {
    const normalizedSentence = sentence.replace(/\s+/g, '');
    const isRemoteSentence = 远距观察句模式.test(normalizedSentence);
    if (isRemoteSentence) {
      remoteScope = Math.max(remoteScope, 3);
    }

    const mentionedCharacters = allCharacterNames.filter(name => normalizedSentence.includes(name));
    if (mentionedCharacters.length > 0) {
      const target = isRemoteSentence || remoteScope > 0 ? remote : local;
      mentionedCharacters.forEach(name => target.add(name));
    }

    if (remoteScope > 0) {
      remoteScope -= 1;
    }
  });

  return {
    local,
    remote,
    all: new Set([...local, ...remote]),
  };
}

function 推断远距观察地点(message: string) {
  const normalizedText = getNarrativeMessageContent(message).replace(/\s+/g, '');
  const matched = 远距观察地点映射.find(rule => rule.pattern.test(normalizedText));
  return matched?.location ?? '';
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

function 获取补丁比较指针(operation: JsonPatchOperation) {
  const toPointers = (pointer?: string | null) => {
    if (!pointer) return [] as string[];
    const segments = decodeJsonPointer(pointer);
    if (segments.length === 0) return [pointer];
    const last = segments[segments.length - 1];
    if (last === '-' || /^\d+$/.test(last)) {
      return [encodeJsonPointer(segments.slice(0, -1))];
    }
    return [pointer];
  };

  if (operation.op === 'move') {
    return _.uniq([...toPointers(operation.from), ...toPointers(operation.to)]);
  }

  return _.uniq(toPointers(operation.path));
}

function 回填缺失的Latest补丁(variables: Record<string, any>, operations: JsonPatchOperation[]) {
  if (operations.length === 0) return false;

  const previousAssistantMessageId = getPreviousAssistantMessageId();
  if (previousAssistantMessageId === null) return false;

  let previousAssistantVariables: Record<string, any>;
  try {
    previousAssistantVariables = Mvu.getMvuData({ type: 'message', message_id: previousAssistantMessageId });
  } catch {
    return false;
  }

  const expected = {
    stat_data: _.cloneDeep(Schema.parse(_.get(previousAssistantVariables, 'stat_data', {}))),
  } as Record<string, any>;
  applySelectedPatch(expected, operations);

  const expectedStat = Schema.parse(_.get(expected, 'stat_data', {}));
  const currentStat = Schema.parse(_.get(variables, 'stat_data', {}));
  const comparePointers = _.uniq(operations.flatMap(获取补丁比较指针));
  const hasDivergence = comparePointers.some(pointer =>
    !_.isEqual(_.get(currentStat, decodeJsonPointer(pointer)), _.get(expectedStat, decodeJsonPointer(pointer))),
  );

  if (!hasDivergence) return false;

  _.set(variables, 'stat_data', expectedStat);
  return true;
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

  const attitudeText = String(_.get(detail, '对user态度', '') ?? '').trim();
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
  const { local: mentionedSet } = 提取消息角色提及(latestMessageContent, allCharacterNames);

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

const 雾夜具象污染线索关键词 = [
  /抓挠|抓门|抓墙|挠门|挠墙|抓挠声/u,
  /拖着沉重的东西|拖行|沙拉……沙拉|沙拉/u,
  /巡屋|绕屋|巡行|门外.*东西|外面那些东西|非人且带有敌意|非人实体|不明存在绕屋/u,
  /走廊.*脚步|脚步声.*门外|门外.*脚步声|脚后跟拖在木地板/u,
  /民谣.*靠近|哼着.*民谣|怪异的民谣.*耳边绕|民谣哼唱声|走调的哼唱声|门缝.*哼唱|哼唱声.*门缝/u,
] as const;
const 死亡具象污染线索关键词 = [
  /尸体|遗体|尸首|尸块|尸检|验尸/u,
  /死者|首夜死者|死亡确认|当场毙命/u,
  /死于|遇害|身亡|毙命|被杀/u,
] as const;

function 是否雾夜具象污染线索(value: unknown) {
  const text = String(value ?? '').trim();
  if (!text) return false;
  return 雾夜具象污染线索关键词.some(pattern => pattern.test(text));
}

function 是否死亡具象污染线索(value: unknown) {
  const text = String(value ?? '').trim();
  if (!text) return false;
  return 死亡具象污染线索关键词.some(pattern => pattern.test(text));
}

function 获取既有角色名集合(variables: Record<string, any>) {
  const female = Object.keys(_.get(variables, 'stat_data.角色.女性角色', {}) as Record<string, any>);
  const male = Object.keys(_.get(variables, 'stat_data.角色.男性角色', {}) as Record<string, any>);
  const currentNames = new Set(
    [...female, ...male]
      .map(name => String(name ?? '').trim())
      .filter(name => Boolean(name) && 固定角色名集合.has(name)),
  );
  const castNames = currentNames.size > 0 ? 固定角色名列表.filter(name => currentNames.has(name)) : 固定角色名列表;
  return new Set(
    _.uniq([...castNames, ...获取主角别名列表()])
      .map(name => String(name ?? '').trim())
      .filter(Boolean),
  );
}

function 提取线索中的未知出事者名(text: string, validNames: Set<string>) {
  const normalized = String(text ?? '').trim();
  if (!normalized) return '';
  const matched = normalized.match(
    /^([^：:\s]{1,12}?)(?:先生|女士|阿姨|叔|大叔|爷爷|奶奶)?(?:失踪|死亡|遇害|身亡|失联|被带走|被拖走|被拖离|神隐|倒下|昏迷|被隔离|被关押|出事)[:：，, ]/u,
  );
  if (!matched) return '';
  const victimName = String(matched[1] ?? '').trim();
  if (!victimName || validNames.has(victimName)) return '';
  return victimName;
}

function 获取可指名出事角色名(validNames: Set<string>) {
  return 固定角色名列表
    .filter(name => validNames.has(name))
    .sort((left, right) => left.localeCompare(right, 'zh-Hans-CN'));
}

function 从现有角色中选择出事者名(validNames: Set<string>, seedText = '') {
  const candidates = 获取可指名出事角色名(validNames);
  if (candidates.length === 0) return '';
  const seed = seedText || candidates.join('|');
  return candidates[计算稳定文本哈希(seed) % candidates.length] ?? '';
}

function 替换未知死者名引用(text: string, invalidVictimNames: string[]) {
  let nextText = String(text ?? '');
  invalidVictimNames.forEach(name => {
    const pattern = new RegExp(`${_.escapeRegExp(name)}(?:先生|女士|阿姨|叔|大叔|爷爷|奶奶)?`, 'gu');
    nextText = nextText.replace(pattern, '那个人');
  });
  return nextText;
}

function 归一化非死亡措辞(text: string) {
  return String(text ?? '')
    .replace(/首夜受害者/gu, '首夜出事者')
    .replace(/首夜死者/gu, '首夜出事者')
    .replace(/死者/gu, '出事者')
    .replace(/尸体|遗体|尸首/gu, '人')
    .replace(/死于/gu, '倒在')
    .replace(/遇害|身亡|毙命|被杀/gu, '出事')
    .replace(/死亡确认|确认死亡/gu, '确认出事')
    .replace(/尸检|验尸/gu, '查看情况');
}

function 归一化陌生出事者文本(text: string, validNames: Set<string>) {
  const normalized = 归一化非死亡措辞(text);
  const invalidName = 提取线索中的未知出事者名(normalized, validNames);
  const genericIncident =
    /(有人|某人|某户|某家|老宅|旧宅|村头那边|那边)/u.test(normalized) &&
    /(出事|失踪|失联|消失|被带走|被拖走|被拖离|神隐|倒下|昏迷|被隔离|被关押)/u.test(normalized);
  if (!invalidName && !genericIncident) return normalized;

  const targetName = 从现有角色中选择出事者名(validNames, normalized);
  if (!targetName) return normalized;

  if (/失踪|失联|消失|被带走|被拖走|被拖离|神隐/u.test(normalized)) {
    return `${targetName}在昨夜失踪，至今下落不明。`;
  }
  if (/倒下|昏迷|失去意识|隔离|看管|照看|关押|拘束|出事/u.test(normalized)) {
    return `${targetName}在昨夜出事后被带去隔离看管。`;
  }
  return `${targetName}在昨夜出了事，至今情况不明。`;
}

function sanitizeMemoryProgress(variables: Record<string, any>) {
  const cluePath = 'stat_data.线索与真相.已解锁线索列表';
  const truthPath = 'stat_data.线索与真相.已解锁真相列表';
  const recallPath = 'stat_data.线索与真相.已触发线索回收节点列表';
  const abnormalEventPath = 'stat_data.宴会.今日异常事件列表';
  const suspicionPath = 'stat_data.宴会.当前怀疑焦点';
  const truthKeyPath = 'stat_data.永久Key.已获得真相Key列表';
  const roleKeyPath = 'stat_data.永久Key.已获得角色核心Key列表';
  const routeKeyPath = 'stat_data.永久Key.已获得路线Key列表';
  const deepRoutePath = 'stat_data.永久Key.已解锁角色深层路线';
  const validNames = 获取既有角色名集合(variables);
  const rawClues = dedupeStringArray(_.get(variables, cluePath, [])).map(归一化非死亡措辞);
  const rawTruths = dedupeStringArray(_.get(variables, truthPath, [])).map(归一化非死亡措辞);
  const rawAbnormalEvents = dedupeStringArray(_.get(variables, abnormalEventPath, [])).map(归一化非死亡措辞);
  const invalidVictimNames = _.uniq(
    [
      ...rawClues,
      ...rawTruths,
      ...rawAbnormalEvents,
    ]
      .map(item => 提取线索中的未知出事者名(item, validNames))
      .filter(Boolean),
  );
  const shouldKeepMemoryEntry = (item: string) =>
    !是否雾夜具象污染线索(item) &&
    !是否死亡具象污染线索(item) &&
    !提取线索中的未知出事者名(item, validNames);

  _.set(
    variables,
    cluePath,
    dedupeStringArray(rawClues.map(item => 归一化陌生出事者文本(item, validNames))).filter(shouldKeepMemoryEntry),
  );
  _.set(
    variables,
    truthPath,
    dedupeStringArray(rawTruths.map(item => 归一化陌生出事者文本(item, validNames))).filter(shouldKeepMemoryEntry),
  );
  _.set(
    variables,
    abnormalEventPath,
    dedupeStringArray(rawAbnormalEvents.map(item => 归一化陌生出事者文本(item, validNames))).filter(shouldKeepMemoryEntry),
  );
  _.set(
    variables,
    suspicionPath,
    dedupeStringArray(_.get(variables, suspicionPath, [])).filter(name => validNames.has(String(name ?? '').trim())),
  );
  _.set(variables, recallPath, dedupeStringArray(_.get(variables, recallPath, [])));
  _.set(variables, truthKeyPath, dedupeStringArray(_.get(variables, truthKeyPath, [])));
  _.set(variables, roleKeyPath, dedupeStringArray(_.get(variables, roleKeyPath, [])));
  _.set(variables, routeKeyPath, dedupeStringArray(_.get(variables, routeKeyPath, [])));
  _.set(variables, deepRoutePath, dedupeStringArray(_.get(variables, deepRoutePath, [])));

  if (invalidVictimNames.length === 0) return;

  (['女性角色', '男性角色'] as const).forEach(groupName => {
    const group = _.get(variables, `stat_data.角色.${groupName}`, {}) as Record<string, Record<string, any>>;
    Object.values(group).forEach(detail => {
      if (!_.isObject(detail)) return;
      const currentThought = String(_.get(detail, '当前心里话', '') ?? '').trim();
      if (!currentThought) return;
      _.set(
        detail,
        '当前心里话',
        归一化非死亡措辞(替换未知死者名引用(currentThought, invalidVictimNames)),
      );
    });
  });
}

const 夜间出事判定关键词 = /(昨夜|夜里|夜间|雾夜|首夜|天亮后|次日清晨|今早|出事|失踪|失联|神隐|消失|被带走|被拖走|被拖离|拖离|拖走|倒下|昏迷|失去意识|隔离|看管|照看|拘束|关押|污染|标记|失控)/u;
const 历史回顾排除关键词 = /(八年前|十五年前|很久以前|以前|曾经|上次宴会|上一轮|往年|传说里|旧事)/u;
const 平安排除关键词 = /(平安|安然|无事|没事|还活着|还在场|没有出事|没有失踪)/u;

function 获取角色详情(stat: Record<string, any>, name: string) {
  const female = _.get(stat, '角色.女性角色', {}) as Record<string, Record<string, any>>;
  const male = _.get(stat, '角色.男性角色', {}) as Record<string, Record<string, any>>;
  if (_.isObject(female[name])) {
    return { groupName: '女性角色' as const, detail: female[name] };
  }
  if (_.isObject(male[name])) {
    return { groupName: '男性角色' as const, detail: male[name] };
  }
  return { groupName: null, detail: null } as const;
}

function 提取夜间出事文本集合(stat: Record<string, any>, latestMessageContent = '') {
  const abnormalEvents = dedupeStringArray(_.get(stat, '宴会.今日异常事件列表', []));
  const clues = dedupeStringArray(_.get(stat, '线索与真相.已解锁线索列表', [])).slice(-6);
  const latestNarrative = 拆分叙事句子(latestMessageContent);

  return _.uniq(
    [...abnormalEvents, ...clues, ...latestNarrative]
      .map(text => String(text ?? '').trim())
      .filter(Boolean)
      .filter(text => 夜间出事判定关键词.test(text))
      .filter(text => !历史回顾排除关键词.test(text)),
  );
}

function 推断角色夜间处理状态(groupName: '女性角色' | '男性角色', text: string) {
  const normalized = String(text ?? '').trim();
  if (!normalized || 平安排除关键词.test(normalized)) return null;

  if (groupName === '女性角色') {
    if (/神隐/u.test(normalized)) return '神隐中';
    if (/失踪|失联|消失|被带走|被拖走|被拖离/u.test(normalized)) return '不可见';
    if (/隔离|看管|照看|污染|标记|失控|倒下|昏迷|失去意识|出事/u.test(normalized)) return '被隔离';
    return null;
  }

  if (/关押|拘束|绑住|扣住|压住|看管/u.test(normalized)) return '被关押';
  if (/神隐|失踪|失联|消失|被带走|被拖走|被拖离/u.test(normalized)) return '神隐中';
  if (/倒下|昏迷|失去意识|出事/u.test(normalized)) return '被关押';
  return null;
}

function 获取首夜兜底异常事件候选角色(stat: Record<string, any>) {
  const female = _.get(stat, '角色.女性角色', {}) as Record<string, Record<string, any>>;
  const male = _.get(stat, '角色.男性角色', {}) as Record<string, Record<string, any>>;
  const excluded = new Set<string>(['user', '主角', '你', 获取当前用户名称(), ...身份分配排除角色列表]);
  const hiddenStates = new Set(['不可见', '神隐中', '被隔离', '被关押']);
  const candidateOrder = 获取默认宴会参与角色列表(stat).filter(name => name !== 'user');

  const filterCandidates = (group: Record<string, Record<string, any>>) =>
    candidateOrder.filter(name => {
      if (excluded.has(name)) return false;
      const detail = group[name];
      if (!_.isObject(detail)) return false;
      const status = String(_.get(detail, '当前在场状态', '离场') ?? '离场').trim();
      return !hiddenStates.has(status);
    });

  const maleCandidates = filterCandidates(male);
  if (maleCandidates.length > 0) {
    return maleCandidates;
  }

  return filterCandidates(female);
}

function 获取首夜兜底保底角色列表(stat: Record<string, any>) {
  const female = new Set(
    Object.keys(_.get(stat, '角色.女性角色', {}) as Record<string, Record<string, any>>)
      .map(name => String(name ?? '').trim())
      .filter(name => Boolean(name) && 固定角色名集合.has(name)),
  );
  const male = new Set(
    Object.keys(_.get(stat, '角色.男性角色', {}) as Record<string, Record<string, any>>)
      .map(name => String(name ?? '').trim())
      .filter(name => Boolean(name) && 固定角色名集合.has(name)),
  );
  const excluded = new Set<string>([...获取主角别名列表(), ...身份分配排除角色列表]);
  return 固定角色名列表.filter(name => (female.has(name) || male.has(name)) && !excluded.has(name));
}

function 生成首夜兜底异常事件(stat: Record<string, any>) {
  if (!是否已进入雾后次晨阶段(stat)) return '';

  const abnormalEvents = dedupeStringArray(_.get(stat, '宴会.今日异常事件列表', []));
  if (abnormalEvents.length > 0) return '';

  const candidates = 获取首夜兜底异常事件候选角色(stat);
  const fallbackCandidates = 获取首夜兜底保底角色列表(stat);
  const finalCandidates = candidates.length > 0 ? candidates : fallbackCandidates;
  if (finalCandidates.length === 0) return '';

  const loopNumber = Number(_.get(stat, '世界.当前轮回编号', 1)) || 1;
  const currentDate = String(_.get(stat, '世界.当前日期', '') ?? '').trim();
  const seed = `${loopNumber}|${currentDate}|${finalCandidates.join('|')}`;
  const victimName = finalCandidates[计算稳定文本哈希(seed) % finalCandidates.length];
  const isMale = _.has(_.get(stat, '角色.男性角色', {}), victimName);

  return isMale
    ? `${victimName}在昨夜起雾后失踪，直到天亮也没有回来。`
    : `${victimName}在昨夜起雾后倒下，被人带去隔离看管。`;
}

function 修正夜间处理状态(variables: Record<string, any>, latestMessageContent = '') {
  const stat = _.get(variables, 'stat_data', {}) as Record<string, any>;
  const sceneLocation = String(_.get(stat, '场景.当前地点', '未知') ?? '未知').trim();
  const abnormalEvents = dedupeStringArray(_.get(stat, '宴会.今日异常事件列表', []));
  let eventTexts = 提取夜间出事文本集合(stat, latestMessageContent);
  if (eventTexts.length === 0) {
    const fallbackEvent = 生成首夜兜底异常事件(stat);
    if (fallbackEvent) {
      _.set(stat, '宴会.今日异常事件列表', _.uniq([...abnormalEvents, fallbackEvent]));
      eventTexts = [fallbackEvent];
    }
  }
  if (eventTexts.length === 0) return;

  const presentList = dedupeStringArray(_.get(stat, '场景.在场角色列表', []));
  const banquetList = dedupeStringArray(_.get(stat, '场景.当前宴会参与角色列表', []));
  const absentList = dedupeStringArray(_.get(stat, '场景.缺席角色列表', []));
  const touchedNames = new Set<string>();

  获取既有角色名集合(variables).forEach(name => {
    if (['user', '主角', '你', 获取当前用户名称()].includes(name)) return;
    const { groupName, detail } = 获取角色详情(stat, name);
    if (!groupName || !_.isObject(detail)) return;

    const matchedText = eventTexts.find(text => text.includes(name) && !平安排除关键词.test(text));
    if (!matchedText) return;

    const nextStatus = 推断角色夜间处理状态(groupName, matchedText);
    if (!nextStatus) return;

    _.set(detail, '当前在场状态', nextStatus);
    _.set(detail, '当前心里话', '');

    const currentLocation = String(_.get(detail, '当前所在地点', '') ?? '').trim();
    if (nextStatus === '被隔离' || nextStatus === '被关押') {
      _.set(detail, '当前所在地点', sceneLocation || currentLocation || '村中');
    } else if (!currentLocation) {
      _.set(detail, '当前所在地点', '村中');
    }

    touchedNames.add(name);
  });

  if (touchedNames.size === 0) return;

  _.set(
    stat,
    '场景.在场角色列表',
    presentList.filter(name => !touchedNames.has(name)),
  );
  _.set(
    stat,
    '场景.当前宴会参与角色列表',
    banquetList.filter(name => !touchedNames.has(name)),
  );
  _.set(
    stat,
    '场景.缺席角色列表',
    _.uniq([...absentList, ...Array.from(touchedNames)]),
  );
}

function 是否说明体回复(message: string) {
  const text = `${message}\n${getNarrativeMessageContent(message)}`;
  return [
    'step.1',
    'step.2',
    '剧情流淌',
    'DM提示',
    '角色联动：',
    'last step:',
    '首先，理清当前的状况',
    '用户输入的是',
    '<yasumiki_loop_state>',
  ].some(keyword => text.includes(keyword));
}

function 是否元叙事污染回复(message: string) {
  const text = `${message}\n${getNarrativeMessageContent(message)}`;
  return [
    '首先，理清当前的状况',
    '用户输入的是',
    '场外质问',
    '<yasumiki_loop_state>',
    '根据最新的 `<yasumiki_loop_state>` 快照',
    '停一下停一下，我知道你现在一脑门子问号',
    '如果你真的这么想，那只能说你对休水这座村子的残酷程度还缺乏最基本的认知',
  ].some(keyword => text.includes(keyword));
}

function 读取助手消息内容(message: Record<string, any>) {
  const swipeId = _.get(message, 'swipe_id');
  const swipes = _.get(message, 'swipes');
  if (Array.isArray(swipes) && typeof swipeId === 'number' && typeof swipes[swipeId] === 'string') {
    return swipes[swipeId] as string;
  }
  return String(_.get(message, 'message', '') || '');
}

function 获取最近有效场面锚点(maxTrustedLoop = Infinity, excludeMessageId: number | null = null) {
  if (typeof Mvu === 'undefined' || !Mvu?.getMvuData) return null;

  const messages = getChatMessages('0-{{lastMessageId}}', { role: 'assistant', include_swipes: true });
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index] as Record<string, any>;
    const messageId = Number(_.get(message, 'message_id', _.get(message, 'mesid', null)));
    if (!Number.isFinite(messageId)) continue;
    if (typeof excludeMessageId === 'number' && messageId === excludeMessageId) continue;

    const content = 读取助手消息内容(message);
    if (是否说明体回复(content)) continue;

    try {
      const stat = _.get(Mvu.getMvuData({ type: 'message', message_id: messageId }), 'stat_data', {}) as Record<
        string,
        any
      >;
      const loop = Number(_.get(stat, '世界.当前轮回编号', NaN));
      if (Number.isFinite(maxTrustedLoop) && Number.isFinite(loop) && loop > maxTrustedLoop) continue;
      if (!_.isEmpty(stat)) {
        return stat;
      }
    } catch {
      continue;
    }
  }

  return null;
}

function 获取最近楼层变量锚点(maxTrustedLoop = Infinity) {
  if (typeof Mvu === 'undefined' || !Mvu?.getMvuData) return null;

  for (let offset = 2; offset <= 20; offset += 1) {
    try {
      const stat = _.get(Mvu.getMvuData({ type: 'message', message_id: -offset }), 'stat_data', {}) as Record<
        string,
        any
      >;
      const loop = Number(_.get(stat, '世界.当前轮回编号', NaN));
      const location = String(_.get(stat, '场景.当前地点', '') ?? '').trim();
      const date = String(_.get(stat, '世界.当前日期', '') ?? '').trim();
      const time = String(_.get(stat, '世界.当前时刻', '') ?? '').trim();
      const present = _.get(stat, '场景.在场角色列表', []);
      if (Number.isFinite(maxTrustedLoop) && Number.isFinite(loop) && loop > maxTrustedLoop) continue;
      if (!location || !date || !time) continue;
      if (Array.isArray(present) && present.length === 0) continue;
      return stat;
    } catch {
      continue;
    }
  }

  return null;
}

function 预拦截说明体核心字段漂移(
  variables: Record<string, any>,
  latestMessageContent = '',
  latestMessageId: number | null = null,
) {
  if (!是否元叙事污染回复(latestMessageContent)) return;

  const blockedPaths = 提取核心漂移补丁路径(parseLatestJsonPatch(latestMessageContent));
  if (blockedPaths.length === 0) return;

  const nextStat = _.get(variables, 'stat_data', {}) as Record<string, any>;
  const trustedLoop = 计算可信轮回编号(nextStat);
  const anchorStat = 获取最近有效场面锚点(trustedLoop, latestMessageId) ?? 获取最近楼层变量锚点(trustedLoop) ?? null;
  const historyIdentityAnchor = 获取最近主角轮回锚点(trustedLoop);
  if (!anchorStat && !historyIdentityAnchor) return;

  const blockedSet = new Set<string>(blockedPaths);
  const restoreFromAnchor = (targetPath: string, anchorPath = targetPath) => {
    const pointer = `/${targetPath.replaceAll('.', '/')}`;
    if (!anchorStat || !blockedSet.has(pointer)) return;
    _.set(nextStat, targetPath, _.cloneDeep(_.get(anchorStat, anchorPath, _.get(nextStat, targetPath))));
  };

  if (blockedSet.has('/世界/当前轮回编号')) {
    _.set(nextStat, '世界.当前轮回编号', trustedLoop);
  }

  restoreFromAnchor('世界.当前日期');
  restoreFromAnchor('世界.当前时刻');
  restoreFromAnchor('世界.当前时间段');
  restoreFromAnchor('世界.是否起雾');
  restoreFromAnchor('世界.是否处于宴会阶段');
  restoreFromAnchor('场景.当前地点');
  restoreFromAnchor('场景.在场角色列表');
  restoreFromAnchor('场景.缺席角色列表');
  restoreFromAnchor('场景.当前宴会参与角色列表');
  restoreFromAnchor('主角.当前所在地点');
  restoreFromAnchor('主角.当前在场状态');
  restoreFromAnchor('主角.当前状态');
  restoreFromAnchor('主角.本轮功能身份');
  restoreFromAnchor('主角.当前阵营');
  restoreFromAnchor('主角.是否已知晓身份');
  restoreFromAnchor('主角.是否完成宴前准备');

  if (blockedSet.has('/宴会/本轮身份分配表') && anchorStat) {
    _.set(
      nextStat,
      '宴会.本轮身份分配表',
      _.cloneDeep(_.get(anchorStat, '宴会.本轮身份分配表', _.get(nextStat, '宴会.本轮身份分配表', {}))),
    );
  }

  if (blockedSet.has('/角色/当前场面锚点') && anchorStat) {
    同步当前角色场面锚点(anchorStat, nextStat);
  }

  if (historyIdentityAnchor) {
    if (blockedSet.has('/主角/本轮功能身份') && historyIdentityAnchor.identity !== '未分配') {
      _.set(nextStat, '主角.本轮功能身份', historyIdentityAnchor.identity);
    }
    if (blockedSet.has('/主角/当前阵营') && historyIdentityAnchor.camp !== '未知') {
      _.set(nextStat, '主角.当前阵营', historyIdentityAnchor.camp);
    }
    if (blockedSet.has('/主角/是否已知晓身份')) {
      _.set(nextStat, '主角.是否已知晓身份', historyIdentityAnchor.known);
    }
    if (blockedSet.has('/主角/是否完成宴前准备')) {
      _.set(nextStat, '主角.是否完成宴前准备', historyIdentityAnchor.prepared);
    }
  }

  logDebug('已预拦截说明体核心字段漂移', {
    blockedPaths,
    trustedLoop,
    anchorLoop: _.get(anchorStat, '世界.当前轮回编号'),
    anchorLocation: _.get(anchorStat, '场景.当前地点'),
  });
}

function 回滚元叙事状态漂移(
  variables: Record<string, any>,
  variablesBeforeUpdate: Record<string, any>,
  latestMessageContent = '',
) {
  if (!是否元叙事污染回复(latestMessageContent)) return;

  const beforeStat = _.get(variablesBeforeUpdate, 'stat_data', {}) as Record<string, any>;
  const trustedLoop = 计算可信轮回编号(beforeStat);
  const hasUsableBeforeAnchor =
    String(_.get(beforeStat, '场景.当前地点', '') ?? '').trim() !== '' &&
    String(_.get(beforeStat, '世界.当前日期', '') ?? '').trim() !== '' &&
    String(_.get(beforeStat, '世界.当前时刻', '') ?? '').trim() !== '';
  const anchorStat = hasUsableBeforeAnchor
    ? beforeStat
    : (获取最近楼层变量锚点(trustedLoop) ?? 获取最近有效场面锚点(trustedLoop) ?? beforeStat);
  const nextStat = _.get(variables, 'stat_data', {}) as Record<string, any>;
  const preservedCurrentState = _.get(nextStat, '主角.当前状态', _.get(beforeStat, '主角.当前状态', '清醒'));
  const preservedPresenceState = _.get(nextStat, '主角.当前在场状态', _.get(beforeStat, '主角.当前在场状态', '在场'));
  const preservedLocation = _.get(
    nextStat,
    '主角.当前所在地点',
    _.get(beforeStat, '主角.当前所在地点', _.get(anchorStat, '场景.当前地点', '未知')),
  );

  应用当前场面锚点(anchorStat, nextStat);
  _.set(nextStat, '主角.当前状态', preservedCurrentState);
  _.set(nextStat, '主角.当前在场状态', preservedPresenceState);
  _.set(nextStat, '主角.当前所在地点', preservedLocation);
  _.set(nextStat, '世界.当前轮回编号', trustedLoop);
  logDebug('已回滚元叙事回复造成的场面漂移', {
    loop: _.get(nextStat, '世界.当前轮回编号'),
    trusted_loop: trustedLoop,
    location: _.get(nextStat, '场景.当前地点'),
    protagonist_state: _.get(nextStat, '主角.当前状态'),
    anchor_loop: _.get(anchorStat, '世界.当前轮回编号'),
    anchor_location: _.get(anchorStat, '场景.当前地点'),
  });
}

function reconcilePresence(
  variables: Record<string, any>,
  latestMessageContent = '',
  variablesBeforeUpdate?: Record<string, any>,
) {
  const stat = _.get(variables, 'stat_data', {}) as Record<string, any>;
  const sceneLocation = String(_.get(stat, '场景.当前地点', '') ?? '').trim();
  const protagonistPresence = String(_.get(stat, '主角.当前在场状态', '在场') ?? '在场').trim();
  const female = _.get(stat, '角色.女性角色', {}) as Record<string, Record<string, any>>;
  const male = _.get(stat, '角色.男性角色', {}) as Record<string, Record<string, any>>;
  const allCharacterNames = [...Object.keys(female), ...Object.keys(male)];
  const validSceneNames = new Set(['user', ...allCharacterNames]);
  const rawPresentList = _.uniq(
    ((_.get(stat, '场景.在场角色列表', []) as string[]) ?? []).map(name => String(name ?? '').trim()).filter(name => validSceneNames.has(name)),
  );
  const rawBanquetParticipantList = _.uniq(
    ((_.get(stat, '场景.当前宴会参与角色列表', []) as string[]) ?? [])
      .map(name => String(name ?? '').trim())
      .filter(name => validSceneNames.has(name)),
  );
  const isBanquetActive = Boolean(_.get(stat, '世界.是否处于宴会阶段', false));
  const previousStat = variablesBeforeUpdate ? 提取statData(variablesBeforeUpdate) : 获取前一助手楼层变量();
  const previousSceneLocation = String(_.get(previousStat, '场景.当前地点', '') ?? '').trim();
  const previousPresentSet = new Set(
    (_.get(previousStat, '场景.在场角色列表', []) as unknown[])
      .map(item => String(item ?? '').trim())
      .filter(Boolean),
  );
  const { local: localMentionedSet, remote: remoteMentionedSet } = 提取消息角色提及(latestMessageContent, allCharacterNames);
  const inferredRemoteLocation = 推断远距观察地点(latestMessageContent);
  const 可视在场状态列表 = ['在场', '独处中', '宴会中'];
  const 显式离场状态列表 = ['离场', '被隔离', '被关押', '不可见', '神隐中'];
  const shouldKeepUserPresent = !['离场', '被隔离', '被关押'].includes(protagonistPresence);
  const shouldTrustMentionDrivenSupplement =
    localMentionedSet.size > 0 && rawPresentList.filter(name => name !== 'user').length <= 1;
  const filteredBanquetParticipantList = rawBanquetParticipantList.filter(name => {
    if (name === 'user') return shouldKeepUserPresent;
    const detail = female[name] ?? male[name];
    if (!_.isObject(detail)) return false;
    const currentStatus = String(_.get(detail, '当前在场状态', '') ?? '').trim();
    return !显式离场状态列表.includes(currentStatus);
  });
  const banquetParticipantSet = new Set(filteredBanquetParticipantList);

  const filteredPresentList = rawPresentList.filter(name => {
    if (name === 'user') return shouldKeepUserPresent;

    const detail = female[name] ?? male[name];
    if (!_.isObject(detail)) return false;

    const currentStatus = String(_.get(detail, '当前在场状态', '') ?? '').trim();
    const currentLocation = String(_.get(detail, '当前所在地点', '') ?? '').trim();
    const hasSpecialHiddenStatus = ['不可见', '神隐中', '被隔离', '被关押'].includes(currentStatus);

    if (hasSpecialHiddenStatus) return false;
    if (currentStatus === '离场' && currentLocation && sceneLocation && currentLocation !== sceneLocation) return false;
    if (isBanquetActive && banquetParticipantSet.has(name)) return true;
    if (localMentionedSet.has(name)) return true;
    if (remoteMentionedSet.has(name)) return false;

    const wasPresentBefore = previousPresentSet.has(name);
    const sameSceneContinued = wasPresentBefore && previousSceneLocation && sceneLocation && previousSceneLocation === sceneLocation;
    if (sameSceneContinued) return true;

    return 可视在场状态列表.includes(currentStatus) && currentLocation === sceneLocation;
  });
  const supplementedPresentList = allCharacterNames.filter(name => {
    if (!(localMentionedSet.has(name) || (isBanquetActive && banquetParticipantSet.has(name)))) return false;
    const detail = female[name] ?? male[name];
    if (!_.isObject(detail)) return false;
    const currentStatus = String(_.get(detail, '当前在场状态', '') ?? '').trim();
    const currentLocation = String(_.get(detail, '当前所在地点', '') ?? '').trim();
    if (显式离场状态列表.includes(currentStatus)) return false;
    if (localMentionedSet.has(name)) {
      if (!currentLocation || !sceneLocation || currentLocation === sceneLocation) return true;
      return shouldTrustMentionDrivenSupplement;
    }
    if (currentLocation && sceneLocation && currentLocation !== sceneLocation) return false;
    return !['不可见', '神隐中', '被隔离', '被关押'].includes(currentStatus);
  });
  const presentList = _.uniq([
    ...(shouldKeepUserPresent ? ['user'] : []),
    ...filteredPresentList,
    ...supplementedPresentList,
    ...(isBanquetActive ? filteredBanquetParticipantList : []),
  ]);

  const presentSet = new Set(presentList);

  _.set(stat, '场景.在场角色列表', presentList);
  _.set(
    stat,
    '场景.缺席角色列表',
    allCharacterNames.filter(name => !presentSet.has(name)),
  );
  _.set(stat, '场景.当前宴会参与角色列表', isBanquetActive ? filteredBanquetParticipantList : []);

  [...Object.entries(female), ...Object.entries(male)].forEach(([name, detail]) => {
    if (!_.isObject(detail)) return;

    const currentStatus = (_.get(detail, '当前在场状态', '离场') as string) || '离场';
    const currentLocation = String(_.get(detail, '当前所在地点', '') ?? '').trim();
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

    if (isBanquetActive && banquetParticipantSet.has(name)) {
      _.set(detail, '当前在场状态', '在场');
      if (sceneLocation) {
        _.set(detail, '当前所在地点', sceneLocation);
      }
      return;
    }

    if (remoteMentionedSet.has(name) && !localMentionedSet.has(name)) {
      _.set(detail, '当前心里话', '');
      if (可视在场状态列表.includes(currentStatus)) {
        _.set(detail, '当前在场状态', '离场');
      }
      if (inferredRemoteLocation && (!currentLocation || currentLocation === sceneLocation)) {
        _.set(detail, '当前所在地点', inferredRemoteLocation);
      }
      return;
    }

    if (可视在场状态列表.includes(currentStatus)) {
      _.set(detail, '当前在场状态', '离场');
    }
  });
}

function 计算残留关系(currentData: Record<string, any>, nextData: Record<string, any>) {
  const 映射 = [
    ['芹泽千枝实', '信任', '跨轮残留.角色残留关系.千枝实残留关系'],
    ['回末李花子', '信任', '跨轮残留.角色残留关系.李花子残留关系'],
    ['马宫久子', '信任', '跨轮残留.角色残留关系.久子残留关系'],
    ['织部香织', '信任', '跨轮残留.角色残留关系.香织残留关系'],
    ['卷岛春', '信任', '跨轮残留.角色残留关系.春残留关系'],
    ['咩子', '信任', '跨轮残留.角色残留关系.咩子残留关系'],
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
      if (_.has(detail, '对user态度')) {
        _.set(
          nextData,
          `${basePath}.对user态度`,
          _.get(detail, '对user态度', _.get(nextData, `${basePath}.对user态度`)),
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

function 清空新轮回身份信息(nextData: Record<string, any>) {
  _.set(nextData, '主角.本轮功能身份', '未分配');
  _.set(nextData, '主角.当前阵营', '未知');
  _.set(nextData, '主角.是否完成宴前准备', false);
  _.set(nextData, '主角.是否已知晓身份', false);
  _.set(nextData, '主角.当前状态', '清醒');
  _.set(nextData, '宴会.本轮身份分配表', {});

  (['女性角色', '男性角色'] as const).forEach(分组名 => {
    const group = _.get(nextData, `角色.${分组名}`, {}) as Record<string, Record<string, any>>;
    Object.entries(group).forEach(([角色名, detail]) => {
      if (!_.isObject(detail) || !_.has(detail, '本轮功能身份')) return;
      _.set(nextData, `角色.${分组名}.${角色名}.本轮功能身份`, '未分配');
    });
  });
}

function 重置宴会即时状态(nextData: Record<string, any>) {
  _.set(nextData, '世界.是否处于宴会阶段', false);
  _.set(nextData, '宴会.当前宴会轮次', 0);
  _.set(nextData, '宴会.今日是否已召开宴会', false);
  _.set(nextData, '宴会.当前怀疑焦点', []);
  _.set(nextData, '宴会.今日异常事件列表', []);
  _.set(nextData, '场景.当前宴会参与角色列表', []);
}

function 设置轮回检查点在场角色(nextData: Record<string, any>, presentNames: string[], sceneLocation: string) {
  const female = _.get(nextData, '角色.女性角色', {}) as Record<string, Record<string, any>>;
  const male = _.get(nextData, '角色.男性角色', {}) as Record<string, Record<string, any>>;
  const presentSet = new Set(presentNames.filter(name => name !== 'user'));
  const hiddenStates = new Set(['不可见', '神隐中', '被隔离', '被关押']);

  _.set(nextData, '场景.在场角色列表', _.uniq(presentNames));
  _.set(
    nextData,
    '场景.缺席角色列表',
    [...Object.keys(female), ...Object.keys(male)].filter(name => !presentSet.has(name)),
  );

  [...Object.entries(female), ...Object.entries(male)].forEach(([name, detail]) => {
    if (!_.isObject(detail)) return;
    _.set(detail, '当前心里话', '');

    if (presentSet.has(name)) {
      _.set(detail, '当前在场状态', '在场');
      _.set(detail, '当前所在地点', sceneLocation);
      return;
    }

    const currentStatus = String(_.get(detail, '当前在场状态', '离场') ?? '离场').trim();
    if (!hiddenStates.has(currentStatus)) {
      _.set(detail, '当前在场状态', '离场');
    }
  });
}

function 应用轮回主线锚点(currentData: Record<string, any>, nextData: Record<string, any>) {
  ['当前路线', '当前章节', '主线层级'].forEach(fieldName => {
    _.set(nextData, `世界.${fieldName}`, _.get(currentData, `世界.${fieldName}`, _.get(nextData, `世界.${fieldName}`)));
  });
}

function 应用雾后次晨轮回检查点(currentData: Record<string, any>, nextData: Record<string, any>) {
  应用轮回主线锚点(currentData, nextData);

  const currentDateText = String(_.get(currentData, '世界.当前日期', _.get(nextData, '世界.当前日期', '5月13日')) ?? '5月13日').trim();
  const currentDate = 解析日期序号(currentDateText);
  const checkpointDate =
    currentDate && currentDate.serial <= 512 && Boolean(_.get(currentData, '世界.是否起雾', false))
      ? 日期顺延一天(currentDateText)
      : currentDateText || '5月13日';

  _.set(nextData, '世界.当前日期', checkpointDate);
  _.set(nextData, '世界.当前时刻', '07:30');
  _.set(nextData, '世界.当前时间段', '清晨');
  _.set(nextData, '世界.是否起雾', true);
  _.set(nextData, '场景.当前地点', '学生公寓');
  _.set(nextData, '主角.当前所在地点', '学生公寓');
  _.set(nextData, '主角.当前在场状态', '在场');
  _.set(nextData, '主角.当前状态', '清醒');
  _.set(nextData, '主角.是否完成宴前准备', true);
  重置宴会即时状态(nextData);
  设置轮回检查点在场角色(nextData, ['user', '芹泽千枝实'], '学生公寓');
}

function 应用轮回检查点(currentData: Record<string, any>, nextData: Record<string, any>) {
  if (是否已进入雾后次晨阶段(currentData)) {
    应用雾后次晨轮回检查点(currentData, nextData);
    return;
  }

  应用当前场面锚点(currentData, nextData);
  应用轮回主线锚点(currentData, nextData);
}

function 是否显式轮回请求(message: string) {
  const text = `${message}\n${getNarrativeMessageContent(message)}`;
  return /(再次轮回|轮回到|又死了|我他妈又死了|时间回溯|黄泉的倒带|倒带|重置到|重新开局)/.test(text);
}

function 统计聊天中的显式轮回次数(excludeLatestUserMessage = false) {
  try {
    const messages = getChatMessages('0-{{lastMessageId}}', { role: 'user' });
    const normalizedMessages = excludeLatestUserMessage ? messages.slice(0, -1) : messages;
    return normalizedMessages.reduce((count, message) => {
      const content = 提取用户原始输入((_.get(message, 'message', '') as string) || '');
      return 是否显式轮回请求(content) ? count + 1 : count;
    }, 0);
  } catch {
    return 0;
  }
}

function 归一化主角在场状态(stat: Record<string, any>) {
  const presentList = _.uniq(
    (_.get(stat, '场景.在场角色列表', []) as unknown[])
      .map((item: unknown) => String(item ?? '').trim())
      .filter(Boolean),
  );
  const absentList = _.uniq(
    (_.get(stat, '场景.缺席角色列表', []) as unknown[])
      .map((item: unknown) => String(item ?? '').trim())
      .filter(Boolean),
  );
  const protagonistState = String(_.get(stat, '主角.当前在场状态', '在场') || '在场').trim();
  const protagonistLocation = String(
    _.get(stat, '主角.当前所在地点', _.get(stat, '场景.当前地点', '未知')) || _.get(stat, '场景.当前地点', '未知'),
  ).trim();
  const sceneLocation = String(_.get(stat, '场景.当前地点', protagonistLocation) || protagonistLocation).trim();

  const nextPresent = presentList.filter(name => name !== 'user');
  if (!['离场', '被关押', '被隔离'].includes(protagonistState)) {
    nextPresent.unshift('user');
  }

  _.set(stat, '场景.在场角色列表', _.uniq(nextPresent));
  _.set(
    stat,
    '场景.缺席角色列表',
    _.uniq(absentList.filter(name => name !== 'user')),
  );

  if (_.get(stat, '主角.当前在场状态') === '在场' && sceneLocation) {
    _.set(stat, '主角.当前所在地点', sceneLocation);
    return;
  }

  if (presentList.includes('user') || protagonistState === '在场') {
    _.set(stat, '主角.当前在场状态', '在场');
    _.set(stat, '主角.当前所在地点', sceneLocation || protagonistLocation || '未知');
    if (!(_.get(stat, '场景.在场角色列表', []) as string[]).includes('user')) {
      _.set(stat, '场景.在场角色列表', ['user', ...(_.get(stat, '场景.在场角色列表', []) as string[])]);
    }
  }
}

function 获取最近主角轮回锚点(targetLoop: number) {
  if (typeof Mvu === 'undefined' || !Mvu?.getMvuData) return null;

  for (let offset = 2; offset <= 60; offset += 1) {
    try {
      const stat = _.get(Mvu.getMvuData({ type: 'message', message_id: -offset }), 'stat_data', {});
      const loop = Number(_.get(stat, '世界.当前轮回编号', 1));
      if (!Number.isFinite(loop) || loop !== targetLoop) continue;

      const identity = String(_.get(stat, '主角.本轮功能身份', '未分配'));
      const camp = String(_.get(stat, '主角.当前阵营', '未知'));
      const known = Boolean(_.get(stat, '主角.是否已知晓身份', false));
      const prepared = Boolean(_.get(stat, '主角.是否完成宴前准备', false));

      if (identity !== '未分配' || camp !== '未知' || known || prepared) {
        return { identity, camp, known, prepared };
      }
    } catch {
      continue;
    }
  }

  return null;
}

const 主角合法功能身份列表 = ['未分配', '蛇', '猿', '乌鸦', '蜘蛛', '狼', '貉'] as const;
const 主角人类功能身份列表 = ['蛇', '猿', '乌鸦', '蜘蛛'] as const;
const 主角狼侧功能身份列表 = ['狼', '貉'] as const;
const 主角功能身份回退映射: Record<string, (typeof 主角合法功能身份列表)[number]> = {
  未知: '未分配',
  未确认: '未分配',
  未公开: '未分配',
  平民: '未分配',
  普通人: '未分配',
  普通平民: '未分配',
  '普通平民（人类）': '未分配',
  '平民（人类）': '未分配',
  '普通人（人类）': '未分配',
  普通村民: '未分配',
  村民: '未分配',
  人类: '未分配',
  火柴人: '未分配',
};
const 主角合法阵营列表 = ['未知', '人类', '狼侧'] as const;
const 主角合法当前状态列表 = ['清醒', '睡梦中', '在场', '离场', '被关押', '被压制'] as const;
const 主角伪普通人身份关键词 = ['平民', '普通人', '普通平民', '普通村民', '村民', '人类', '火柴人'] as const;
const 主角身份确认关键词 = /(托梦|梦里|梦中|梦境|印记|印痕|纹印|烙印|标记|记号)/;
const 主角身份确认场景关键词 =
  /(你(?:醒来|睡醒|睁开眼|梦里|梦中|梦见|低头|抬手)|主角(?:醒来|睡醒|梦里|梦中)|手背|掌心|手腕|胸口|额头|后颈|天亮|次日清晨|次日一早|清晨)/;

function 归一化主角功能身份(value: unknown) {
  const text = String(value ?? '').trim();
  if (!text) return '未分配';
  if (主角伪普通人身份关键词.some(keyword => text.includes(keyword))) return '未分配';
  const normalized = 主角功能身份回退映射[text] ?? text;
  return 主角合法功能身份列表.includes(normalized as (typeof 主角合法功能身份列表)[number])
    ? (normalized as (typeof 主角合法功能身份列表)[number])
    : '未分配';
}

function 归一化主角阵营(value: unknown) {
  const text = String(value ?? '').trim();
  return 主角合法阵营列表.includes(text as (typeof 主角合法阵营列表)[number])
    ? (text as (typeof 主角合法阵营列表)[number])
    : '未知';
}

function 是否主角应从睡梦中醒来(stat: Record<string, any>, presenceState: unknown) {
  const presence = String(presenceState ?? '').trim();
  if (presence === '离场') return false;
  if (_.get(stat, '世界.是否处于宴会阶段', false)) return true;
  if (_.get(stat, '宴会.今日是否已召开宴会', false)) return true;

  const currentSegment = String(_.get(stat, '世界.当前时间段', '') ?? '').trim();
  if (currentSegment === '清晨' || currentSegment === '白天' || currentSegment === '傍晚') return true;

  const currentMinute = 解析时刻分钟(_.get(stat, '世界.当前时刻', ''));
  return currentMinute !== null && currentMinute >= 300 && currentSegment !== '雾夜';
}

function 归一化主角当前状态(value: unknown, presenceState: unknown, stat?: Record<string, any>) {
  const text = String(value ?? '').trim();
  const presence = String(presenceState ?? '').trim();
  if (!text) return '清醒';
  if (!主角合法当前状态列表.includes(text as (typeof 主角合法当前状态列表)[number])) return '清醒';
  if (text === '在场') return '清醒';
  if (text === '睡梦中' && stat && 是否主角应从睡梦中醒来(stat, presence)) return '清醒';
  if (text === '离场') {
    return presence === '离场' ? '离场' : '清醒';
  }
  return text as (typeof 主角合法当前状态列表)[number];
}

function 根据主角功能身份推断阵营(identity: string) {
  if (主角人类功能身份列表.includes(identity as (typeof 主角人类功能身份列表)[number])) {
    return '人类';
  }
  if (主角狼侧功能身份列表.includes(identity as (typeof 主角狼侧功能身份列表)[number])) {
    return '狼侧';
  }
  return '未知';
}

const 宴会基础功能身份模板 = ['蛇', '猿', '猿', '乌鸦', '蜘蛛', '狼', '狼'] as const;
const 身份分配排除角色列表 = [] as const;

function 解析日期序号(value: unknown) {
  const matched = String(value ?? '').trim().match(/^(\d{1,2})月(\d{1,2})日$/);
  if (!matched) return null;
  const month = Number(matched[1]);
  const day = Number(matched[2]);
  if (!Number.isFinite(month) || !Number.isFinite(day)) return null;
  return {
    month,
    day,
    serial: month * 100 + day,
  };
}

function 日期顺延一天(value: unknown) {
  const parsed = 解析日期序号(value);
  if (!parsed) return '5月13日';
  return `${parsed.month}月${_.clamp(parsed.day + 1, 1, 31)}日`;
}

function 解析时刻分钟(value: unknown) {
  const matched = String(value ?? '').trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!matched) return null;
  const hour = Number(matched[1]);
  const minute = Number(matched[2]);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  return hour * 60 + minute;
}

function 是否已进入雾后次晨阶段(stat: Record<string, any>) {
  if (_.get(stat, '世界.是否处于宴会阶段', false)) return true;
  if (Number(_.get(stat, '宴会.当前宴会轮次', 0)) > 0) return true;

  const currentSegment = String(_.get(stat, '世界.当前时间段', '') ?? '').trim();
  const currentDate = 解析日期序号(_.get(stat, '世界.当前日期', ''));
  const currentMinute = 解析时刻分钟(_.get(stat, '世界.当前时刻', ''));
  const prepared = Boolean(_.get(stat, '主角.是否完成宴前准备', false));

  if (prepared && currentSegment !== '雾夜') return true;
  if (currentDate && currentDate.serial > 512) return true;
  if (Boolean(_.get(stat, '世界.是否起雾', false)) && (currentSegment === '清晨' || currentSegment === '白天')) return true;
  if (currentMinute !== null && currentMinute >= 360 && currentSegment !== '雾夜' && Boolean(_.get(stat, '世界.是否起雾', false))) {
    return true;
  }

  return false;
}

function 是否应补全本轮身份(stat: Record<string, any>) {
  if (是否已进入雾后次晨阶段(stat)) return true;
  const currentDate = 解析日期序号(_.get(stat, '世界.当前日期', ''));
  if (currentDate && currentDate.serial > 512) return true;
  return false;
}

function 获取可分配身份角色名(stat: Record<string, any>) {
  const female = _.get(stat, '角色.女性角色', {}) as Record<string, Record<string, any>>;
  const male = _.get(stat, '角色.男性角色', {}) as Record<string, Record<string, any>>;
  const excluded = new Set<string>(身份分配排除角色列表);

  return 固定角色名列表.filter(name => {
    if (excluded.has(name)) return false;
    const detail = female[name] ?? male[name];
    return _.isObject(detail) && _.has(detail, '本轮功能身份');
  });
}

function 获取默认宴会参与角色列表(stat: Record<string, any>) {
  const hiddenStates = new Set(['不可见', '神隐中', '被隔离', '被关押']);
  const female = _.get(stat, '角色.女性角色', {}) as Record<string, Record<string, any>>;
  const male = _.get(stat, '角色.男性角色', {}) as Record<string, Record<string, any>>;

  const participants = 获取可分配身份角色名(stat).filter(name => {
    const detail = female[name] ?? male[name];
    if (!_.isObject(detail)) return false;
    const status = String(_.get(detail, '当前在场状态', '离场') ?? '离场').trim();
    return !hiddenStates.has(status);
  });

  return _.uniq(['user', ...participants]);
}

function 获取本轮身份参与者(stat: Record<string, any>) {
  const validNames = new Set(['user', ...获取可分配身份角色名(stat)]);
  const currentParticipants = dedupeStringArray(_.get(stat, '场景.当前宴会参与角色列表', [])).filter(name => validNames.has(name));
  if (currentParticipants.length >= 4) {
    return _.uniq(['user', ...currentParticipants]);
  }
  return 获取默认宴会参与角色列表(stat);
}

function 计算稳定文本哈希(text: string) {
  let hash = 2166136261;
  for (const char of text) {
    hash ^= char.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function 获取角色当前地点(stat: Record<string, any>, name: string) {
  if (name === 'user') {
    return String(_.get(stat, '主角.当前所在地点', _.get(stat, '场景.当前地点', '学生公寓')) ?? '学生公寓').trim();
  }

  const female = _.get(stat, '角色.女性角色', {}) as Record<string, Record<string, any>>;
  const male = _.get(stat, '角色.男性角色', {}) as Record<string, Record<string, any>>;
  return String(_.get(female[name] ?? male[name], '当前所在地点', _.get(stat, '场景.当前地点', '村中')) ?? '村中').trim();
}

function 选择主角本轮功能身份(stat: Record<string, any>, participantCount: number, loopNumber: number) {
  const rolePool =
    participantCount >= 8 && loopNumber % 2 === 0
      ? (['蛇', '猿', '乌鸦', '蜘蛛', '狼', '貉'] as const)
      : (['蛇', '猿', '乌鸦', '蜘蛛', '狼'] as const);
  const seed = [
    loopNumber,
    _.get(stat, '世界.当前日期', ''),
    _.get(stat, '世界.当前时刻', ''),
    _.get(stat, '场景.当前地点', ''),
    _.get(stat, '主角.当前所在地点', ''),
    获取当前用户名称(),
  ].join('|');
  const index = 计算稳定文本哈希(seed) % rolePool.length;
  return rolePool[index];
}

function 构建待分配功能身份序列(protagonistIdentity: string, participantCount: number, loopNumber: number) {
  const template: Array<Exclude<(typeof 主角合法功能身份列表)[number], '未分配'>> = [...宴会基础功能身份模板];
  if (participantCount >= 8 && loopNumber % 2 === 0) {
    template.push('貉');
  }

  const normalizedIdentity = 归一化主角功能身份(protagonistIdentity);
  const hitIndex = normalizedIdentity === '未分配' ? -1 : template.indexOf(normalizedIdentity);
  if (hitIndex >= 0) {
    template.splice(hitIndex, 1);
  }

  return template;
}

function 按身份分配顺序排序候选角色(stat: Record<string, any>, candidates: string[], identity: string, loopNumber: number) {
  return [...candidates].sort((left, right) => {
    const leftLocation = 获取角色当前地点(stat, left);
    const rightLocation = 获取角色当前地点(stat, right);
    const leftHash = 计算稳定文本哈希(`${loopNumber}|${identity}|${left}|${leftLocation}`);
    const rightHash = 计算稳定文本哈希(`${loopNumber}|${identity}|${right}|${rightLocation}`);
    if (leftHash !== rightHash) return leftHash - rightHash;

    return left.localeCompare(right, 'zh-Hans-CN');
  });
}

const 主角身份分配表标准键 = '主角' as const;

function 写入主角身份分配表条目(assignmentTable: Record<string, string>, identity: string) {
  assignmentTable[主角身份分配表标准键] = identity;
}

function 构建标准化身份分配表(stat: Record<string, any>, participantNames: string[]) {
  const currentTable = _.get(stat, '宴会.本轮身份分配表', {}) as Record<string, any>;
  const nextTable: Record<string, string> = {};
  const protagonistIdentity = 从身份分配表读取主角功能身份(stat);
  if (protagonistIdentity !== '未分配') {
    写入主角身份分配表条目(nextTable, protagonistIdentity);
  }

  participantNames
    .filter(name => name !== 'user')
    .forEach(name => {
      nextTable[name] = 归一化主角功能身份(_.get(currentTable, name, '未分配'));
    });

  return nextTable;
}

function 是否本轮身份分配表完整(stat: Record<string, any>, participantNames: string[]) {
  const normalizedTable = 构建标准化身份分配表(stat, participantNames);
  if (归一化主角功能身份(normalizedTable[主角身份分配表标准键]) === '未分配') return false;

  return participantNames
    .filter(name => name !== 'user')
    .every(name => _.has(normalizedTable, name));
}

function 构建本轮身份分配表(stat: Record<string, any>) {
  const participantNames = 获取本轮身份参与者(stat);
  if (participantNames.length === 0) return {} as Record<string, string>;

  const loopNumber = Number(_.get(stat, '世界.当前轮回编号', 1)) || 1;
  const protagonistIdentity = 选择主角本轮功能身份(stat, participantNames.length, loopNumber);
  const assignmentTable: Record<string, string> = {};
  写入主角身份分配表条目(assignmentTable, protagonistIdentity);

  const remainingNames = participantNames.filter(name => name !== 'user');
  构建待分配功能身份序列(protagonistIdentity, participantNames.length, loopNumber).forEach(identity => {
    const candidate = 按身份分配顺序排序候选角色(stat, remainingNames, identity, loopNumber)[0];
    if (!candidate) return;
    assignmentTable[candidate] = identity;
    _.pull(remainingNames, candidate);
  });

  remainingNames.forEach(name => {
    assignmentTable[name] = '未分配';
  });

  return assignmentTable;
}

function 同步身份分配表到角色(stat: Record<string, any>, assignmentTable: Record<string, string>) {
  const female = _.get(stat, '角色.女性角色', {}) as Record<string, Record<string, any>>;
  const male = _.get(stat, '角色.男性角色', {}) as Record<string, Record<string, any>>;
  获取可分配身份角色名(stat).forEach(name => {
    const detail = female[name] ?? male[name];
    if (!_.isObject(detail)) return;
    _.set(detail, '本轮功能身份', 归一化主角功能身份(_.get(assignmentTable, name, '未分配')));
  });
}

function 补全本轮身份分配(variables: Record<string, any>) {
  const stat = _.get(variables, 'stat_data', {}) as Record<string, any>;
  if (!是否应补全本轮身份(stat)) return;

  if (_.get(stat, '世界.是否处于宴会阶段', false)) {
    _.set(stat, '宴会.今日是否已召开宴会', true);
    _.set(stat, '宴会.当前宴会轮次', Math.max(1, Number(_.get(stat, '宴会.当前宴会轮次', 0)) || 0));
    _.set(stat, '场景.当前宴会参与角色列表', 获取默认宴会参与角色列表(stat));
  }

  const participantNames = 获取本轮身份参与者(stat);
  if (participantNames.length === 0) return;

  const assignmentTable = 是否本轮身份分配表完整(stat, participantNames)
    ? 构建标准化身份分配表(stat, participantNames)
    : 构建本轮身份分配表(stat);
  _.set(stat, '宴会.本轮身份分配表', assignmentTable);
  同步身份分配表到角色(stat, assignmentTable);

  const protagonistIdentity = 从身份分配表读取主角功能身份(stat);
  if (protagonistIdentity === '未分配') return;

  _.set(stat, '主角.本轮功能身份', protagonistIdentity);
  _.set(stat, '主角.当前阵营', 根据主角功能身份推断阵营(protagonistIdentity));
  _.set(stat, '主角.是否完成宴前准备', true);

  if (是否已进入雾后次晨阶段(stat)) {
    _.set(stat, '主角.是否已知晓身份', true);
  }
}

function 获取当前用户名称() {
  try {
    const messages = getChatMessages('0-{{lastMessageId}}', { role: 'user' });
    const latest = messages[messages.length - 1];
    return String(_.get(latest, 'name', 'user') ?? 'user').trim() || 'user';
  } catch {
    return 'user';
  }
}

function 获取主角身份分配表键列表() {
  return [主角身份分配表标准键];
}

function 读取主角身份分配表条目(stat: Record<string, any>) {
  const assignmentTable = _.get(stat, '宴会.本轮身份分配表', {});
  const protagonistKeys = 获取主角身份分配表键列表();
  if (!_.isPlainObject(assignmentTable)) {
    return {
      assignmentTable: null as Record<string, any> | null,
      protagonistKey: protagonistKeys[0] ?? 'user',
      rawIdentity: undefined as unknown,
      identity: '未分配' as (typeof 主角合法功能身份列表)[number],
      hasEntry: false,
    };
  }

  for (const protagonistKey of protagonistKeys) {
    if (!_.has(assignmentTable, protagonistKey)) continue;
    const rawIdentity = _.get(assignmentTable, protagonistKey);
    return {
      assignmentTable,
      protagonistKey,
      rawIdentity,
      identity: 归一化主角功能身份(rawIdentity),
      hasEntry: true,
    };
  }

  return {
    assignmentTable,
    protagonistKey: protagonistKeys[0] ?? 'user',
    rawIdentity: undefined as unknown,
    identity: '未分配' as (typeof 主角合法功能身份列表)[number],
    hasEntry: false,
  };
}

function 回写主角身份分配表条目(stat: Record<string, any>, identity: string) {
  const { assignmentTable, protagonistKey } = 读取主角身份分配表条目(stat);
  if (!assignmentTable || !protagonistKey) return;
  if (_.get(assignmentTable, protagonistKey) === identity) return;
  _.set(assignmentTable, protagonistKey, identity);
  _.set(stat, '宴会.本轮身份分配表', assignmentTable);
}

function 归一化主角身份分配表条目(stat: Record<string, any>) {
  const { assignmentTable, protagonistKey, rawIdentity, identity, hasEntry } = 读取主角身份分配表条目(stat);
  if (!assignmentTable || !hasEntry || !protagonistKey) return;

  const rawText = String(rawIdentity ?? '').trim();
  if (!rawText) return;
  if (identity !== '未分配' || rawText === '未分配') return;

  _.set(assignmentTable, protagonistKey, '未分配');
  _.set(stat, '宴会.本轮身份分配表', assignmentTable);
}

function 从身份分配表读取主角功能身份(stat: Record<string, any>) {
  return 读取主角身份分配表条目(stat).identity;
}

function 是否出现主角身份确认描写(message: string) {
  const text = getNarrativeMessageContent(message).replace(/\s+/g, '');
  return Boolean(text) && 主角身份确认关键词.test(text) && 主角身份确认场景关键词.test(text);
}

function 提取statData(source: Record<string, any>) {
  return (_.has(source, 'stat_data') ? _.get(source, 'stat_data', {}) : source) as Record<string, any>;
}

function 推算手动轮回次数(source: Record<string, any>) {
  const stat = 提取statData(source);
  const dream = Number(_.get(stat, '跨轮残留.神异连续.梦境稳定度', 100));
  if (!Number.isFinite(dream)) return 0;
  return Math.max(0, Math.round((100 - dream) / 5));
}

function 计算可信轮回编号(source: Record<string, any>, options: { excludeLatestUserMessage?: boolean } = {}) {
  const stat = 提取statData(source);
  const chatLoop = Math.max(1, 1 + 统计聊天中的显式轮回次数(options.excludeLatestUserMessage === true));
  const manualLoopCount = 推算手动轮回次数(stat);
  return Math.max(1, chatLoop + manualLoopCount);
}

function 修正轮回编号(
  variables: Record<string, any>,
  variablesBeforeUpdate: Record<string, any>,
  latestMessageContent = '',
) {
  const explicitLoop = 是否显式轮回请求(latestMessageContent);
  const oldLoop = 计算可信轮回编号(variablesBeforeUpdate, {
    excludeLatestUserMessage: explicitLoop,
  });

  if (explicitLoop) {
    _.set(variables, 'stat_data.世界.当前轮回编号', oldLoop + 1);
    return;
  }

  _.set(variables, 'stat_data.世界.当前轮回编号', oldLoop);
}

function 修正主角身份阵营(
  variables: Record<string, any>,
  variablesBeforeUpdate: Record<string, any>,
  latestMessageContent = '',
  latestAssistantMessageContent = '',
) {
  const stat = _.get(variables, 'stat_data', {}) as Record<string, any>;
  const explicitLoop = 是否显式轮回请求(latestMessageContent);
  if (explicitLoop) {
    _.set(stat, '主角.本轮功能身份', '未分配');
    _.set(stat, '主角.当前阵营', '未知');
    _.set(stat, '主角.是否已知晓身份', false);
    _.set(stat, '主角.是否完成宴前准备', false);
    _.set(stat, '主角.当前状态', '清醒');
    _.set(stat, '主角.当前在场状态', '在场');
    归一化主角在场状态(stat);
    return;
  }

  const oldLoop = Number(_.get(variablesBeforeUpdate, 'stat_data.世界.当前轮回编号', 1));
  const currentLoop = Number(_.get(variables, 'stat_data.世界.当前轮回编号', oldLoop));
  const sameLoop = Number.isFinite(oldLoop) && Number.isFinite(currentLoop) && oldLoop === currentLoop;
  const historyAnchor = 获取最近主角轮回锚点(currentLoop);
  const oldKnown = Boolean(_.get(variablesBeforeUpdate, 'stat_data.主角.是否已知晓身份', false));
  const oldPrepared = Boolean(_.get(variablesBeforeUpdate, 'stat_data.主角.是否完成宴前准备', false));
  const newKnown = Boolean(_.get(stat, '主角.是否已知晓身份', false));
  const newPrepared = Boolean(_.get(stat, '主角.是否完成宴前准备', false));
  const lockedKnown = (sameLoop && oldKnown) || Boolean(historyAnchor?.known);
  const lockedPrepared = (sameLoop && oldPrepared) || Boolean(historyAnchor?.prepared);
  const nextPrepared = newPrepared || lockedPrepared;

  if (nextPrepared !== _.get(stat, '主角.是否完成宴前准备', false)) {
    _.set(stat, '主角.是否完成宴前准备', nextPrepared);
  }

  const oldIdentity = 归一化主角功能身份(_.get(variablesBeforeUpdate, 'stat_data.主角.本轮功能身份', '未分配'));
  const newIdentity = 归一化主角功能身份(_.get(stat, '主角.本轮功能身份', '未分配'));
  const historyIdentity = 归一化主角功能身份(historyAnchor?.identity);
  const tableIdentity = 从身份分配表读取主角功能身份(stat);
  const lockedIdentity =
    sameLoop && oldKnown && oldIdentity !== '未分配'
      ? oldIdentity
      : historyAnchor?.known && historyIdentity !== '未分配'
        ? historyIdentity
        : '';
  const candidateIdentity = tableIdentity !== '未分配' ? tableIdentity : newIdentity;
  const hasIdentityReveal =
    nextPrepared && candidateIdentity !== '未分配' && 是否出现主角身份确认描写(latestAssistantMessageContent);
  const nextKnown = lockedKnown || hasIdentityReveal;
  const nextIdentity = lockedIdentity || (nextKnown ? candidateIdentity : '未分配');
  if (nextIdentity !== _.get(stat, '主角.本轮功能身份', '未分配')) {
    _.set(stat, '主角.本轮功能身份', nextIdentity);
  }

  const oldCamp = 归一化主角阵营(_.get(variablesBeforeUpdate, 'stat_data.主角.当前阵营', '未知'));
  const newCamp = 归一化主角阵营(_.get(stat, '主角.当前阵营', '未知'));
  const historyCamp = 归一化主角阵营(historyAnchor?.camp);
  const lockedCamp =
    lockedIdentity && sameLoop && oldKnown && oldCamp !== '未知'
      ? oldCamp
      : lockedIdentity && historyAnchor?.known && historyCamp !== '未知'
        ? historyCamp
        : '';
  let nextCamp = nextKnown && nextIdentity !== '未分配' ? lockedCamp || newCamp : '未知';
  const derivedCamp = 根据主角功能身份推断阵营(nextIdentity);
  if (nextKnown && derivedCamp !== '未知') {
    nextCamp = derivedCamp;
  }
  if (!nextKnown || nextIdentity === '未分配') {
    nextCamp = '未知';
  }
  if (nextCamp !== _.get(stat, '主角.当前阵营', '未知')) {
    _.set(stat, '主角.当前阵营', nextCamp);
  }

  const oldPresence = String(_.get(variablesBeforeUpdate, 'stat_data.主角.当前在场状态', '在场'));
  const currentPresence = String(_.get(stat, '主角.当前在场状态', oldPresence || '在场'));
  const oldState = 归一化主角当前状态(
    _.get(variablesBeforeUpdate, 'stat_data.主角.当前状态', '清醒'),
    oldPresence,
    _.get(variablesBeforeUpdate, 'stat_data', {}),
  );
  const newState = 归一化主角当前状态(_.get(stat, '主角.当前状态', oldState), currentPresence, stat);
  if (newState !== _.get(stat, '主角.当前状态', oldState)) {
    _.set(stat, '主角.当前状态', newState);
  }
  const shouldLockState = oldState !== '清醒' && oldState !== '睡梦中';
  const lockedState =
    sameLoop && shouldLockState ? oldState : historyAnchor?.known || historyAnchor?.prepared ? (shouldLockState ? oldState : '') : '';
  if (lockedState && newState !== lockedState) {
    _.set(stat, '主角.当前状态', lockedState);
  }

  if (nextKnown && nextIdentity !== '未分配') {
    回写主角身份分配表条目(stat, nextIdentity);
  } else {
    归一化主角身份分配表条目(stat);
  }
  if (nextKnown !== newKnown) {
    _.set(stat, '主角.是否已知晓身份', nextKnown);
  }

  归一化主角在场状态(stat);
  _.set(
    stat,
    '主角.当前状态',
    归一化主角当前状态(_.get(stat, '主角.当前状态', '清醒'), _.get(stat, '主角.当前在场状态', '在场'), stat),
  );
}

function 构建轮回重置变量(currentVariables: Record<string, any>) {
  const currentData = Schema.parse(_.get(currentVariables, 'stat_data', {}));
  const nextData = _.cloneDeep(初始轮回变量);

  _.set(nextData, '永久Key', _.cloneDeep(_.get(currentData, '永久Key', {})));
  _.set(nextData, '跨轮残留', _.cloneDeep(_.get(currentData, '跨轮残留', {})));
  应用可继承线索(currentData, nextData);
  _.set(nextData, '世界.当前轮回编号', 计算可信轮回编号(currentData) + 1);
  应用轮回检查点(currentData, nextData);
  清空新轮回身份信息(nextData);
  补全本轮身份分配({ stat_data: nextData });

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
  const latestUserMessageContent = getLatestUserMessageContent();
  const operations = 是否跳过Latest补丁(latestMessage.messageId) ? [] : parseLatestJsonPatch(latestMessageContent);

  isRepairingLatest = true;
  try {
    const latest = Mvu.getMvuData({ type: 'message', message_id: 'latest' });
    const beforeData = _.cloneDeep(latest);
    const before = JSON.stringify(_.get(latest, 'stat_data', {}));
    const patchApplied = 回填缺失的Latest补丁(latest, operations);

    预拦截说明体核心字段漂移(latest, latestMessageContent, latestMessage.messageId);
    修正夜间处理状态(latest, latestMessageContent);
    reconcilePresence(latest, latestMessageContent);
    fillMissingThoughts(latest, getNarrativeMessageContent(latestMessageContent));
    sanitizeMemoryProgress(latest);
    回滚元叙事状态漂移(latest, beforeData, latestMessageContent);
    修正轮回编号(latest, beforeData, latestUserMessageContent);
    补全本轮身份分配(latest);
    修正主角身份阵营(latest, beforeData, latestUserMessageContent, latestMessageContent);

    const after = JSON.stringify(_.get(latest, 'stat_data', {}));
    if (before === after) {
      logDebug('latest 修正后无变化', {
        trigger,
        operationCount: operations.length,
        patchApplied,
      });
      return;
    }

    await Mvu.replaceMvuData(latest, { type: 'message', message_id: 'latest' });
    logDebug('latest 修正已写回', { trigger, operationCount: operations.length, patchApplied });
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
    清除跳过补丁阈值();
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
    预拦截说明体核心字段漂移(context.variables, latestMessageContent, latestMessage.messageId);
    修正夜间处理状态(context.variables, latestMessageContent);
    reconcilePresence(context.variables, latestMessageContent);
    fillMissingThoughts(context.variables, getNarrativeMessageContent(latestMessageContent));
    sanitizeMemoryProgress(context.variables);
    补全本轮身份分配(context.variables);
    logDebug('BEFORE_MESSAGE_UPDATE', { operationCount: operations.length });
  });

  eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, (variables, variablesBeforeUpdate) => {
    const latestMessage = getLatestAssistantMessageMeta();
    const latestMessageContent = latestMessage.content;
    const latestUserMessageContent = getLatestUserMessageContent();
    const operations = 是否跳过Latest补丁(latestMessage.messageId) ? [] : parseLatestJsonPatch(latestMessageContent);
    预拦截说明体核心字段漂移(variables, latestMessageContent, latestMessage.messageId);
    修正夜间处理状态(variables, latestMessageContent);
    reconcilePresence(variables, latestMessageContent, variablesBeforeUpdate);
    fillMissingThoughts(variables, getNarrativeMessageContent(latestMessageContent));
    sanitizeMemoryProgress(variables);
    回滚元叙事状态漂移(variables, variablesBeforeUpdate, latestMessageContent);
    修正轮回编号(variables, variablesBeforeUpdate, latestUserMessageContent);
    补全本轮身份分配(variables);
    修正主角身份阵营(variables, variablesBeforeUpdate, latestUserMessageContent, latestMessageContent);
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
