import {
  decodeJsonPointer,
  insertByPointer,
  normalizeAssistantMessageForMvuParsing,
  parseLatestJsonPatch,
  removeByPointer,
  type JsonPatchOperation,
} from '@util/common';
import {
  createBanquetIdentityApi,
  日期顺延一天,
  主角合法功能身份列表,
  主角身份分配表标准键,
  解析日期序号,
  解析时刻分钟,
} from './banquetIdentity';
import { createNightActionApi } from './nightAction';
import { createLoopStateApi } from './loopState';
import { Schema } from '../../schema';
import initvarText from '../../世界书/变量/initvar.yaml?raw';

const debugStateKey = '__yasumikiVariableStructureDebug';
const debugPrefix = '[yasumiki.变量结构]';
const loopResetNarration = '……眼前猛地一晃。等你回过神时，你已经又站回了刚才的场面里。';
const loopResetSkipPatchStorageKey = '__yasumikiSkipPatchUntilAssistantMessageId';
const loopResetSkipPatchChatIdStorageKey = '__yasumikiSkipPatchChatId';
const pendingLoopPromptStorageKey = '__yasumikiPendingLoopPrompt';
const pendingLoopPromptDeliveredStorageKey = '__yasumikiPendingLoopPromptDelivered';
const pendingBanquetVotePromptStorageKey = '__yasumikiPendingBanquetVotePrompt';
const pendingThoughtPromptStorageKey = '__yasumikiPendingThoughtPrompt';
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
const 核心女性角色名列表 = ['芹泽千枝实', '回末李花子', '马宫久子', '织部香织', '卷岛春', '咩子', '美佐峰美辻'] as const;
const 核心女性角色名集合 = new Set<string>(核心女性角色名列表);
const 核心女性角色宴会排除状态集合 = new Set(['不可见', '神隐中', '被关押']);
const 固定角色名列表 = _.uniq([...固定女性角色名列表, ...固定男性角色名列表]);
const 固定角色名集合 = new Set(固定角色名列表);
const 固定角色名单提示文本 = 固定角色名列表.join('、');
const 固定路线名列表 = ['黄泉线', '机知线', '暗黑线', '神明线'] as const;
type SillyTavernNameContext = {
  name1?: string;
};
type SillyTavernNameBridge = Window & {
  SillyTavern?: {
    getContext?: () => SillyTavernNameContext | null | undefined;
  };
};

type SillyTavernChatMessage = Record<string, any>;

function 获取当前聊天消息列表() {
  try {
    const contextChat = (window as SillyTavernNameBridge).SillyTavern?.getContext?.()?.chat;
    if (Array.isArray(contextChat)) {
      return contextChat as SillyTavernChatMessage[];
    }
  } catch {
    // ignore context lookup failures and fall back to legacy helpers
  }

  try {
    if (typeof getChatMessages === 'function') {
      return getChatMessages('0-{{lastMessageId}}', { include_swipes: true }) as SillyTavernChatMessage[];
    }
  } catch {
    // ignore legacy helper lookup failures
  }

  return [] as SillyTavernChatMessage[];
}

function 获取聊天消息文本(message: SillyTavernChatMessage | undefined) {
  if (!message) return '';

  const swipeId = _.get(message, 'swipe_id');
  const swipes = _.get(message, 'swipes');
  if (Array.isArray(swipes) && typeof swipeId === 'number' && typeof swipes[swipeId] === 'string') {
    return swipes[swipeId] as string;
  }

  return String(_.get(message, 'message', _.get(message, 'mes', '')) ?? '');
}

function 获取聊天消息编号(message: SillyTavernChatMessage | undefined) {
  if (!message) return null;
  const messageId = Number(_.get(message, 'message_id', _.get(message, 'mesid', null)));
  return Number.isFinite(messageId) ? messageId : null;
}

function 获取指定角色最新聊天消息(role: 'assistant' | 'user') {
  const messages = 获取当前聊天消息列表();
  const filtered = messages.filter(message => {
    const isUser = Boolean(_.get(message, 'is_user', false));
    return role === 'user' ? isUser : !isUser;
  });
  return filtered[filtered.length - 1] as SillyTavernChatMessage | undefined;
}

function 获取指定角色倒数第二条聊天消息(role: 'assistant' | 'user') {
  const messages = 获取当前聊天消息列表();
  const filtered = messages.filter(message => {
    const isUser = Boolean(_.get(message, 'is_user', false));
    return role === 'user' ? isUser : !isUser;
  });
  return filtered[filtered.length - 2] as SillyTavernChatMessage | undefined;
}

function 读取永久记忆(source: Record<string, any>) {
  const stat = _.has(source, 'stat_data') ? (_.get(source, 'stat_data', {}) as Record<string, any>) : source;
  const modern = _.get(stat, '永久记忆', {}) as Record<string, any>;
  const legacy = _.get(stat, '永久Key', {}) as Record<string, any>;
  return {
    已确认世界核心记忆点列表: dedupeStringArray([
      ...(_.get(legacy, '已获得角色核心Key列表', []) as string[]),
      ...(_.get(legacy, '已获得真相Key列表', []) as string[]),
      ...(_.get(modern, '已确认世界核心记忆点列表', []) as string[]),
    ]),
    已确认路线列表: dedupeStringArray([
      ...(_.get(legacy, '已获得路线Key列表', []) as string[]),
      ...(_.get(modern, '已确认路线列表', []) as string[]),
    ]).filter(route => 固定路线名列表.includes(route as (typeof 固定路线名列表)[number])),
    已解锁主线层级: Math.max(
      1,
      Number(_.get(legacy, '已解锁主线层级', 1)) || 1,
      Number(_.get(modern, '已解锁主线层级', 1)) || 1,
    ),
  };
}

function 写入永久记忆(target: Record<string, any>, memory?: Record<string, any>) {
  const stat = _.has(target, 'stat_data') ? (_.get(target, 'stat_data', {}) as Record<string, any>) : target;
  const nextMemory = memory ?? 读取永久记忆(stat);
  _.set(stat, '永久记忆', {
    已确认世界核心记忆点列表: dedupeStringArray(_.get(nextMemory, '已确认世界核心记忆点列表', [])),
    已确认路线列表: dedupeStringArray(_.get(nextMemory, '已确认路线列表', [])).filter(route =>
      固定路线名列表.includes(route as (typeof 固定路线名列表)[number]),
    ),
    已解锁主线层级: Math.max(1, Number(_.get(nextMemory, '已解锁主线层级', 1)) || 1),
  });
  _.unset(stat, '永久Key');
}

function 获取调试目标窗口() {
  return window.parent ?? window;
}

function 获取主角别名列表() {
  return _.uniq(['user', '主角', '你', 获取当前用户名称()].map(name => String(name ?? '').trim()).filter(Boolean));
}

function 归一化场景名单(rawList: unknown) {
  const flatList = _.flattenDeep(Array.isArray(rawList) ? rawList : [rawList]);
  const protagonistAliases = new Set(获取主角别名列表());
  return _.uniq(
    flatList
      .map(item => String(item ?? '').trim())
      .filter(Boolean)
      .map(name => (protagonistAliases.has(name) ? 'user' : name)),
  );
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

function 清除待触发票决提示(reason = 'manual_clear') {
  window.localStorage.removeItem(pendingBanquetVotePromptStorageKey);
  uninjectPrompts(['yasumiki.banquet-vote-persist']);
  logDebug('已清除宴会票决提示注入', { reason });
}

function 清除待触发心里话提示(reason = 'manual_clear') {
  window.localStorage.removeItem(pendingThoughtPromptStorageKey);
  uninjectPrompts(['yasumiki.present-thought-persist']);
  logDebug('已清除在场心里话提示注入', { reason });
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

function 注册待触发票决提示() {
  const pendingPrompt = window.localStorage.getItem(pendingBanquetVotePromptStorageKey);
  if (!pendingPrompt) return;

  uninjectPrompts(['yasumiki.banquet-vote-persist']);
  injectPrompts([
    {
      id: 'yasumiki.banquet-vote-persist',
      role: 'system',
      content: pendingPrompt,
      position: 'in_chat',
      depth: 0,
      should_scan: true,
      filter: () => Boolean(window.localStorage.getItem(pendingBanquetVotePromptStorageKey)),
    },
  ]);
  logDebug('已注册可跨重新生成的宴会票决提示注入');
}

function 注册待触发心里话提示() {
  const pendingPrompt = window.localStorage.getItem(pendingThoughtPromptStorageKey);
  if (!pendingPrompt) return;

  uninjectPrompts(['yasumiki.present-thought-persist']);
  injectPrompts([
    {
      id: 'yasumiki.present-thought-persist',
      role: 'system',
      content: pendingPrompt,
      position: 'in_chat',
      depth: 0,
      should_scan: true,
      filter: () => Boolean(window.localStorage.getItem(pendingThoughtPromptStorageKey)),
    },
  ]);
  logDebug('已注册可跨重新生成的在场心里话提示注入');
}

function 构建宴会票决收口提示(stat: Record<string, any>) {
  const candidates = 获取正式宴会票决候选角色列表(stat);
  const suspicion = dedupeStringArray(_.get(stat, '宴会.当前怀疑焦点', []))
    .filter(name => candidates.includes(name))
    .slice(0, 3);
  const voteCompleted = Boolean(_.get(stat, '宴会.票决结果.是否完成', false));
  const votedTarget = 归一化票决对象名称(String(_.get(stat, '宴会.票决结果.票出对象', '') ?? '').trim());
  const votedResult = String(_.get(stat, '宴会.票决结果.处置结果', '') ?? '').trim();

  return [
    voteCompleted
      ? `当前这层已经落下票决结果：${votedTarget || '（空）'}，处置结果：${votedResult || '（空）'}。如果这次是重 roll / 重写同一层，必须保持同一场宴会的收口逻辑，不要把票决结果重新写没。`
      : '当前已进入正式宴会，而且这场宴会还没有落下最终票决。',
    voteCompleted
      ? '如果这一层继续写票后余波，也仍然要保持这是同一场正式宴会的延续；不要突然改回“非宴会中”，也不要把现场人全写成已经离开。'
      : '下一次回复必须把这场正式宴会从“讨论”推进到“明确票出一个对象”。不能写成继续吵、流票、散会、明天再说。',
    `可被票出的对象只能从这份正式宴会名单里选：${candidates.join('、') || '（空）'}。`,
    suspicion.length > 0 ? `当前已经被重点怀疑的人有：${suspicion.join('、')}。若证据不足，也应在这些人和现场矛盾里勉强收束出一次票决。` : '当前还没有稳定票决对象，也必须在现场恐慌、站队、护短、妥协里勉强收束出一次票决。',
    '宴会正文里禁止新增匿名执行者、匿名壮汉、其他村民、旁边几个人之类的陪衬。不要写“几个高壮的男人”“几个村民把人拖走”这种句子。',
    '如果需要写被票对象被带走、被隔离、被押下去，就直接写“按规矩把她带走”或明确使用现有名单里的角色，不要临时发明新人。',
    '如果被票对象是男性，处置结果通常写“推下悬崖”；如果被票对象是女性，处置结果通常写“带去隔离看管”。',
    '这次回复里的 `<UpdateVariable>` 必须同步写出：`/宴会/当前阶段`、`/宴会/票决结果`，不要再留空。',
  ]
    .filter(Boolean)
    .join('\n');
}

function 获取缺少心里话的在场角色(stat: Record<string, any>) {
  const presentNames = 归一化场景名单(_.get(stat, '场景.在场角色列表', []))
    .filter(name => name !== 'user')
    .filter(name => 固定角色名集合.has(name));

  return presentNames.filter(name => {
    const { detail } = 获取角色详情(stat, name);
    if (!_.isObject(detail)) return false;

    const currentStatus = String(_.get(detail, '当前在场状态', '') ?? '').trim();
    if (['被隔离', '被关押', '不可见', '神隐中'].includes(currentStatus)) return false;

    return !String(_.get(detail, '当前心里话', '') ?? '').trim();
  });
}

function 构建在场心里话提示(stat: Record<string, any>) {
  const presentNames = 归一化场景名单(_.get(stat, '场景.在场角色列表', []))
    .filter(name => name !== 'user')
    .filter(name => 固定角色名集合.has(name));
  const missingThoughtNames = 获取缺少心里话的在场角色(stat);
  if (missingThoughtNames.length === 0) return '';

  return [
    `当前这层在场角色有：${presentNames.join('、') || '无'}。`,
    `以下在场角色现在缺少“当前心里话”：${missingThoughtNames.join('、')}。`,
    '下一次回复里的 `<UpdateVariable>` 必须为这些仍在场、且不是神隐/被隔离/被关押的人逐个补上 `当前心里话`。',
    '“当前心里话”只写 1~2 句短句，贴近刚发生的正文事件，不要写角色名字，不要写长分析，不要上帝视角。',
    '这条要求不只限于宴会；凡是 `/场景/在场角色列表` 里的人，只要正文实际出镜并且还能被读取心理，就尽量都要有 `当前心里话`。',
  ].join('\n');
}

function 同步在场心里话提示(stat: Record<string, any>) {
  const prompt = 构建在场心里话提示(stat);
  if (!prompt) {
    清除待触发心里话提示('all_present_characters_have_thoughts');
    return;
  }

  window.localStorage.setItem(pendingThoughtPromptStorageKey, prompt);
  注册待触发心里话提示();
}

function 同步宴会票决提示(stat: Record<string, any>) {
  const isBanquet = Boolean(_.get(stat, '世界.是否处于宴会阶段', false));
  const currentStage = String(_.get(stat, '宴会.当前阶段', '未开始') ?? '').trim();
  const voteCompleted = Boolean(_.get(stat, '宴会.票决结果.是否完成', false));
  const sceneLocation = 归一化场景地点文本(_.get(stat, '场景.当前地点', ''));
  const banquetList = 获取正式宴会票决候选角色列表(stat);
  const isVoteAftermath = voteCompleted && (sceneLocation === '集会堂' || banquetList.length > 0 || currentStage === '票决中');

  if ((!isBanquet && !isVoteAftermath) || currentStage === '已散场') {
    清除待触发票决提示('banquet_closed_or_finished');
    return;
  }

  const candidates = banquetList;
  if (candidates.length === 0) {
    清除待触发票决提示('banquet_no_candidates');
    return;
  }

  window.localStorage.setItem(pendingBanquetVotePromptStorageKey, 构建宴会票决收口提示(stat));
  注册待触发票决提示();
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
      当前胜负状态: _.get(nextData, '宴会.当前胜负状态', '未分出'),
      当前胜负说明: _.get(nextData, '宴会.当前胜负说明', ''),
      夜间行动记录: _.get(nextData, '宴会.夜间行动记录', {}),
    },
    主角: {
      当前所在地点: _.get(nextData, '主角.当前所在地点', '学生公寓'),
      当前在场状态: _.get(nextData, '主角.当前在场状态', '在场'),
      本轮功能身份: _.get(nextData, '主角.本轮功能身份', '村民'),
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
  '/宴会/当前阶段',
  '/宴会/票决结果',
  '/宴会/本轮身份分配表',
  '/宴会/当前胜负状态',
  '/宴会/当前胜负说明',
  '/宴会/夜间行动记录',
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

type 显式补丁特征 = {
  hasAny: boolean;
  has世界时空补丁: boolean;
  has场景补丁: boolean;
  has身份补丁: boolean;
  has夜间行动补丁: boolean;
  has心里话补丁: boolean;
  has态度补丁: boolean;
  has胜负补丁: boolean;
};

function 提取显式补丁特征(operations: JsonPatchOperation[]): 显式补丁特征 {
  const features: 显式补丁特征 = {
    hasAny: operations.length > 0,
    has世界时空补丁: false,
    has场景补丁: false,
    has身份补丁: false,
    has夜间行动补丁: false,
    has心里话补丁: false,
    has态度补丁: false,
    has胜负补丁: false,
  };

  operations.forEach(operation => {
    const path = String(operation.path ?? '').trim();
    if (!path) return;

    if (/^\/世界\/(当前日期|当前时刻|当前时间段|是否起雾|是否处于宴会阶段)$/.test(path)) {
      features.has世界时空补丁 = true;
    }

    if (
      /^\/场景\/(当前地点|在场角色列表|缺席角色列表|当前宴会参与角色列表)$/.test(path) ||
      /^\/主角\/(当前所在地点|当前在场状态)$/.test(path) ||
      /^\/角色\/(女性角色|男性角色)\/[^/]+\/(当前所在地点|当前在场状态)$/.test(path)
    ) {
      features.has场景补丁 = true;
    }

    if (
      /^\/宴会\/本轮身份分配表(?:\/|$)/.test(path) ||
      /^\/主角\/(本轮功能身份|当前阵营|是否已知晓身份|是否完成宴前准备)$/.test(path) ||
      /^\/角色\/(女性角色|男性角色)\/[^/]+\/本轮功能身份$/.test(path)
    ) {
      features.has身份补丁 = true;
    }

    if (/^\/宴会\/夜间行动记录(?:\/|$)/.test(path)) {
      features.has夜间行动补丁 = true;
    }

    if (/^\/角色\/(女性角色|男性角色)\/[^/]+\/当前心里话$/.test(path)) {
      features.has心里话补丁 = true;
    }

    if (/^\/角色\/(女性角色|男性角色)\/[^/]+\/对user态度$/.test(path)) {
      features.has态度补丁 = true;
    }

    if (/^\/宴会\/(当前胜负状态|当前胜负说明)$/.test(path)) {
      features.has胜负补丁 = true;
    }
  });

  return features;
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
  const latest = 获取指定角色最新聊天消息('assistant');
  if (!latest) {
    return { content: '', rawContent: '', messageId: null as number | null };
  }

  const rawContent = 获取聊天消息文本(latest);
  return {
    content: getNarrativeMessageContent(rawContent),
    rawContent,
    messageId: 获取聊天消息编号(latest),
  };
}

function getPreviousAssistantMessageId() {
  return 获取聊天消息编号(获取指定角色倒数第二条聊天消息('assistant'));
}

function 提取用户原始输入(message: string) {
  const content = String(message ?? '');
  const anchor = '以上是用户的本轮输入';
  const index = content.indexOf(anchor);
  return (index >= 0 ? content.slice(0, index) : content).trim();
}

function getLatestUserMessageMeta() {
  const latest = 获取指定角色最新聊天消息('user');
  if (!latest) {
    return { content: '', messageId: null as number | null };
  }

  return {
    content: 提取用户原始输入(获取聊天消息文本(latest)),
    messageId: 获取聊天消息编号(latest),
  };
}

function getLatestUserMessageContent() {
  return getLatestUserMessageMeta().content;
}

function 获取前一助手楼层变量() {
  const previousAssistantMessageId = getPreviousAssistantMessageId();
  if (previousAssistantMessageId === null) return {};
  if (typeof Mvu === 'undefined' || !Mvu?.getMvuData) return {};

  try {
    return _.get(Mvu.getMvuData({ type: 'message', message_id: previousAssistantMessageId }), 'stat_data', {}) as
      Record<string, any>;
  } catch {
    return {};
  }
}

function 应用显式场景补丁保护(variables: Record<string, any>, operations: JsonPatchOperation[]) {
  if (operations.length === 0) return;

  const stat = _.get(variables, 'stat_data', {}) as Record<string, any>;
  const female = _.get(stat, '角色.女性角色', {}) as Record<string, Record<string, any>>;
  const male = _.get(stat, '角色.男性角色', {}) as Record<string, Record<string, any>>;
  const allCharacterNames = [...Object.keys(female), ...Object.keys(male)];
  const validSceneNames = new Set(['user', ...allCharacterNames]);
  const allDetailEntries = [...Object.entries(female), ...Object.entries(male)];

  let explicitSceneLocation = '';
  let explicitProtagonistLocation = '';
  let explicitProtagonistPresence = '';
  let explicitProtagonistIdentity = '';
  let explicitProtagonistCamp = '';
  let explicitProtagonistKnownSet = false;
  let explicitProtagonistKnown = false;
  let explicitProtagonistPreparedSet = false;
  let explicitProtagonistPrepared = false;
  let explicitPresentList: string[] | null = null;
  let explicitAbsentList: string[] | null = null;
  let explicitBanquetList: string[] | null = null;
  const explicitLeavingCharacters = new Set<string>();
  const identityTableShadow = {
    宴会: {
      本轮身份分配表: _.cloneDeep(_.get(stat, '宴会.本轮身份分配表', {})),
    },
  };
  let touchedIdentityTable = false;
  const sceneListShadow = {
    场景: {
      在场角色列表: _.cloneDeep(_.get(stat, '场景.在场角色列表', [])),
      缺席角色列表: _.cloneDeep(_.get(stat, '场景.缺席角色列表', [])),
      当前宴会参与角色列表: _.cloneDeep(_.get(stat, '场景.当前宴会参与角色列表', [])),
    },
  };
  const touchedSceneLists = {
    在场角色列表: false,
    缺席角色列表: false,
    当前宴会参与角色列表: false,
  };
  const explicitCharacterPatchMap = new Map<
    string,
    {
      groupName: '女性角色' | '男性角色';
      location?: string;
      locationSet?: boolean;
      presence?: string;
      presenceSet?: boolean;
      identity?: string;
      identitySet?: boolean;
      thought?: string;
      thoughtSet?: boolean;
      attitude?: string;
      attitudeSet?: boolean;
    }
  >();

  operations.forEach(operation => {
    if (!operation.path) return;

    const pathSegments = decodeJsonPointer(operation.path);
    const path = pathSegments.join('.');
    if (pathSegments[0] === '宴会' && pathSegments[1] === '本轮身份分配表') {
      touchedIdentityTable = true;
      if (operation.op === 'replace') {
        _.set(identityTableShadow, pathSegments, _.cloneDeep(operation.value));
      } else if (operation.op === 'insert') {
        insertByPointer(identityTableShadow, operation.path, _.cloneDeep(operation.value));
      } else if (operation.op === 'remove') {
        removeByPointer(identityTableShadow, operation.path);
      }
    }
    if (pathSegments[0] === '场景' && ['在场角色列表', '缺席角色列表', '当前宴会参与角色列表'].includes(pathSegments[1] ?? '')) {
      const key = pathSegments[1] as keyof typeof touchedSceneLists;
      touchedSceneLists[key] = true;
      if (operation.op === 'replace') {
        _.set(sceneListShadow, pathSegments, _.cloneDeep(operation.value));
      } else if (operation.op === 'insert') {
        insertByPointer(sceneListShadow, operation.path, _.cloneDeep(operation.value));
      } else if (operation.op === 'remove') {
        removeByPointer(sceneListShadow, operation.path);
      }
    }

    if (operation.op !== 'replace') return;

    if (path === '场景.当前地点') {
      explicitSceneLocation = String(operation.value ?? '').trim();
      return;
    }
    if (path === '主角.当前所在地点') {
      explicitProtagonistLocation = String(operation.value ?? '').trim();
      return;
    }
    if (path === '主角.当前在场状态') {
      explicitProtagonistPresence = String(operation.value ?? '').trim();
      return;
    }
    if (path === '主角.本轮功能身份') {
      explicitProtagonistIdentity = String(operation.value ?? '').trim();
      return;
    }
    if (path === '主角.当前阵营') {
      explicitProtagonistCamp = String(operation.value ?? '').trim();
      return;
    }
    if (path === '主角.是否已知晓身份') {
      explicitProtagonistKnownSet = true;
      explicitProtagonistKnown = Boolean(operation.value);
      return;
    }
    if (path === '主角.是否完成宴前准备') {
      explicitProtagonistPreparedSet = true;
      explicitProtagonistPrepared = Boolean(operation.value);
      return;
    }

    const matched = path.match(
      /^角色\.(女性角色|男性角色)\.([^.]+)\.(当前所在地点|当前在场状态|本轮功能身份|当前心里话|对user态度)$/u,
    );
    if (!matched) return;

    const [, groupName, roleName, fieldName] = matched as [
      string,
      '女性角色' | '男性角色',
      string,
      '当前所在地点' | '当前在场状态' | '本轮功能身份' | '当前心里话' | '对user态度',
    ];
    const nextPatch = explicitCharacterPatchMap.get(roleName) ?? { groupName };
    if (fieldName === '当前所在地点') {
      nextPatch.location = String(operation.value ?? '').trim();
      nextPatch.locationSet = true;
    } else if (fieldName === '当前在场状态') {
      nextPatch.presence = String(operation.value ?? '').trim();
      nextPatch.presenceSet = true;
      if (nextPatch.presence === '离场') {
        explicitLeavingCharacters.add(roleName);
      } else if (nextPatch.presence) {
        explicitLeavingCharacters.delete(roleName);
      }
    } else if (fieldName === '本轮功能身份') {
      nextPatch.identity = String(operation.value ?? '').trim();
      nextPatch.identitySet = true;
    } else if (fieldName === '当前心里话') {
      nextPatch.thought = String(operation.value ?? '');
      nextPatch.thoughtSet = true;
    } else if (fieldName === '对user态度') {
      nextPatch.attitude = String(operation.value ?? '').trim();
      nextPatch.attitudeSet = true;
    }
    explicitCharacterPatchMap.set(roleName, nextPatch);
  });

  if (touchedSceneLists.在场角色列表) {
    explicitPresentList = 归一化场景名单(_.get(sceneListShadow, '场景.在场角色列表', [])).filter(name =>
      validSceneNames.has(name),
    );
  }
  if (touchedSceneLists.缺席角色列表) {
    explicitAbsentList = 归一化场景名单(_.get(sceneListShadow, '场景.缺席角色列表', [])).filter(name =>
      validSceneNames.has(name),
    );
  }
  if (touchedSceneLists.当前宴会参与角色列表) {
    explicitBanquetList = 归一化场景名单(_.get(sceneListShadow, '场景.当前宴会参与角色列表', [])).filter(name =>
      validSceneNames.has(name),
    );
  }

  const hasExplicitScenePatch =
    touchedIdentityTable ||
    Boolean(explicitSceneLocation) ||
    explicitPresentList !== null ||
    explicitAbsentList !== null ||
    explicitBanquetList !== null ||
    Boolean(explicitProtagonistLocation) ||
    Boolean(explicitProtagonistPresence) ||
    Boolean(explicitProtagonistIdentity) ||
    Boolean(explicitProtagonistCamp) ||
    explicitProtagonistKnownSet ||
    explicitProtagonistPreparedSet ||
    explicitCharacterPatchMap.size > 0;

  if (!hasExplicitScenePatch) return;

  if (explicitSceneLocation) {
    _.set(stat, '场景.当前地点', explicitSceneLocation);
  }
  if (explicitPresentList !== null) {
    _.set(stat, '场景.在场角色列表', explicitPresentList);
  }
  if (explicitAbsentList !== null) {
    _.set(stat, '场景.缺席角色列表', explicitAbsentList);
  }
  if (explicitBanquetList !== null) {
    _.set(stat, '场景.当前宴会参与角色列表', explicitBanquetList);
  }
  if (explicitProtagonistLocation) {
    _.set(stat, '主角.当前所在地点', explicitProtagonistLocation);
  } else if (explicitSceneLocation) {
    _.set(stat, '主角.当前所在地点', explicitSceneLocation);
  }
  if (explicitProtagonistPresence) {
    _.set(stat, '主角.当前在场状态', explicitProtagonistPresence);
  }
  if (explicitProtagonistIdentity) {
    _.set(stat, '主角.本轮功能身份', explicitProtagonistIdentity);
  }
  if (explicitProtagonistCamp) {
    _.set(stat, '主角.当前阵营', explicitProtagonistCamp);
  }
  if (explicitProtagonistKnownSet) {
    _.set(stat, '主角.是否已知晓身份', explicitProtagonistKnown);
  }
  if (explicitProtagonistPreparedSet) {
    _.set(stat, '主角.是否完成宴前准备', explicitProtagonistPrepared);
  }
  if (touchedIdentityTable) {
    _.set(stat, '宴会.本轮身份分配表', _.cloneDeep(_.get(identityTableShadow, '宴会.本轮身份分配表', {})));
  }

  if (explicitPresentList !== null && explicitLeavingCharacters.size > 0) {
    explicitPresentList = explicitPresentList.filter(name => !explicitLeavingCharacters.has(name));
  }
  const presentSet =
    explicitPresentList === null ? null : new Set(explicitPresentList.filter(name => name !== 'user'));
  const sceneLocation = String(_.get(stat, '场景.当前地点', '') ?? '').trim();
  const isBanquetScene = Boolean(_.get(stat, '世界.是否处于宴会阶段', false)) && sceneLocation === '集会堂';

  if (explicitPresentList !== null) {
    _.set(stat, '场景.在场角色列表', _.uniq(explicitPresentList));
  }
  if (explicitPresentList !== null) {
    _.set(
      stat,
      '场景.缺席角色列表',
      allCharacterNames.filter(name => !presentSet?.has(name)),
    );
  }
  if (explicitBanquetList !== null) {
    _.set(stat, '场景.当前宴会参与角色列表', _.uniq(explicitBanquetList));
  }

  allDetailEntries.forEach(([roleName, detail]) => {
    if (!_.isObject(detail)) return;

    const explicitCharacterPatch = explicitCharacterPatchMap.get(roleName);
    if (explicitCharacterPatch?.locationSet) {
      _.set(detail, '当前所在地点', explicitCharacterPatch.location);
    }
    if (explicitCharacterPatch?.presenceSet) {
      _.set(detail, '当前在场状态', explicitCharacterPatch.presence);
    }
    if (explicitCharacterPatch?.identitySet) {
      _.set(detail, '本轮功能身份', explicitCharacterPatch.identity);
    }
    if (explicitCharacterPatch?.thoughtSet) {
      _.set(detail, '当前心里话', explicitCharacterPatch.thought);
    }
    if (explicitCharacterPatch?.attitudeSet) {
      _.set(detail, '对user态度', explicitCharacterPatch.attitude);
    }

    if (!presentSet?.has(roleName)) return;

    const currentStatus = String(_.get(detail, '当前在场状态', '') ?? '').trim();
    if (!['被隔离', '被关押', '神隐中', '不可见'].includes(currentStatus)) {
      _.set(detail, '当前在场状态', explicitCharacterPatch?.presence || (isBanquetScene ? '宴会中' : '在场'));
    }
    if (sceneLocation && !explicitCharacterPatch?.location) {
      _.set(detail, '当前所在地点', sceneLocation);
    }
  });

  if (touchedIdentityTable) {
    const assignmentTable = _.get(stat, '宴会.本轮身份分配表', {}) as Record<string, string>;
    if (_.isPlainObject(assignmentTable) && !_.isEmpty(assignmentTable)) {
      同步身份分配表到角色(stat, assignmentTable);
      按身份表同步主角字段(stat, assignmentTable);
    }
  }

}

function 修正跨夜日期一致性(
  variables: Record<string, any>,
  variablesBeforeUpdate?: Record<string, any>,
) {
  if (!variablesBeforeUpdate) return;

  const nextStat = _.get(variables, 'stat_data', {}) as Record<string, any>;
  const beforeStat = _.get(variablesBeforeUpdate, 'stat_data', {}) as Record<string, any>;
  const beforeLoop = Number(_.get(beforeStat, '世界.当前轮回编号', NaN));
  const nextLoop = Number(_.get(nextStat, '世界.当前轮回编号', beforeLoop));
  if (!Number.isFinite(beforeLoop) || !Number.isFinite(nextLoop) || beforeLoop !== nextLoop) return;

  const beforeDateText = String(_.get(beforeStat, '世界.当前日期', '') ?? '').trim();
  const nextDateText = String(_.get(nextStat, '世界.当前日期', '') ?? '').trim();
  const beforeDate = 解析日期序号(beforeDateText);
  const nextDate = 解析日期序号(nextDateText);
  if (!beforeDate || !nextDate) return;

  const beforeMinute = 解析时刻分钟(_.get(beforeStat, '世界.当前时刻', ''));
  const nextMinute = 解析时刻分钟(_.get(nextStat, '世界.当前时刻', ''));
  if (beforeMinute === null || nextMinute === null) return;

  if (nextMinute >= beforeMinute) return;
  if (nextDate.serial > beforeDate.serial) return;

  const correctedDate = 日期顺延一天(beforeDateText);
  _.set(nextStat, '世界.当前日期', correctedDate);
  logDebug('已修正跨夜日期一致性', {
    beforeDate: beforeDateText,
    beforeTime: _.get(beforeStat, '世界.当前时刻'),
    nextDate: nextDateText,
    nextTime: _.get(nextStat, '世界.当前时刻'),
    correctedDate,
  });
}

function 格式化时刻分钟(totalMinutes: number) {
  const normalized = Math.max(0, Math.floor(totalMinutes));
  const hour = Math.floor(normalized / 60);
  const minute = normalized % 60;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function 根据时刻推断时间段(
  minute: number | null,
  options: {
    isFog?: boolean;
  } = {},
) {
  if (minute === null) return '';

  const { isFog = false } = options;
  if (minute < 5 * 60) return isFog ? '雾夜' : '夜间';
  if (minute < 9 * 60) return '清晨';
  if (minute < 18 * 60) return '白天';
  if (minute < 21 * 60) return '傍晚';
  return isFog ? '雾夜' : '夜间';
}

function 修正雾夜时刻一致性(
  variables: Record<string, any>,
  variablesBeforeUpdate?: Record<string, any>,
) {
  if (!variablesBeforeUpdate) return;

  const nextStat = _.get(variables, 'stat_data', {}) as Record<string, any>;
  const beforeStat = _.get(variablesBeforeUpdate, 'stat_data', {}) as Record<string, any>;
  const beforeLoop = Number(_.get(beforeStat, '世界.当前轮回编号', NaN));
  const nextLoop = Number(_.get(nextStat, '世界.当前轮回编号', beforeLoop));
  if (!Number.isFinite(beforeLoop) || !Number.isFinite(nextLoop) || beforeLoop !== nextLoop) return;

  const beforeDate = 解析日期序号(_.get(beforeStat, '世界.当前日期', ''));
  const nextDate = 解析日期序号(_.get(nextStat, '世界.当前日期', ''));
  if (!beforeDate || !nextDate || beforeDate.serial !== nextDate.serial) return;

  const beforeMinute = 解析时刻分钟(_.get(beforeStat, '世界.当前时刻', ''));
  const nextMinute = 解析时刻分钟(_.get(nextStat, '世界.当前时刻', ''));
  if (beforeMinute === null || nextMinute === null) return;

  const beforeSegment = String(_.get(beforeStat, '世界.当前时间段', '') ?? '').trim();
  const nextSegment = String(_.get(nextStat, '世界.当前时间段', '') ?? '').trim();
  const nocturnalSegments = new Set(['夜间', '雾夜', '深夜']);
  if (!nocturnalSegments.has(beforeSegment) || !nocturnalSegments.has(nextSegment)) return;
  if (beforeMinute >= 6 * 60 || nextMinute < 21 * 60) return;

  const correctedMinute = nextMinute - 21 * 60;
  if (correctedMinute < beforeMinute || correctedMinute >= 6 * 60) return;

  const correctedTime = 格式化时刻分钟(correctedMinute);
  _.set(nextStat, '世界.当前时刻', correctedTime);
  logDebug('已修正雾夜时刻一致性', {
    beforeDate: _.get(beforeStat, '世界.当前日期'),
    beforeTime: _.get(beforeStat, '世界.当前时刻'),
    nextTime: _.get(nextStat, '世界.当前时刻'),
    rawNextMinute: nextMinute,
    correctedTime,
  });
}

function 修正时间段一致性(variables: Record<string, any>) {
  const stat = _.get(variables, 'stat_data', {}) as Record<string, any>;
  const minute = 解析时刻分钟(_.get(stat, '世界.当前时刻', ''));
  const nextSegment = 根据时刻推断时间段(minute, {
    isFog: Boolean(_.get(stat, '世界.是否起雾', false)),
  });
  if (!nextSegment) return;

  const currentSegment = String(_.get(stat, '世界.当前时间段', '') ?? '').trim();
  if (currentSegment === nextSegment) return;

  _.set(stat, '世界.当前时间段', nextSegment);
  logDebug('已修正时间段一致性', {
    time: _.get(stat, '世界.当前时刻'),
    from: currentSegment,
    to: nextSegment,
  });
}

function getNarrativeMessageContent(message: string) {
  const normalizedMessage = normalizeAssistantMessageForMvuParsing(message);
  const withoutUpdateBlock = normalizedMessage.replace(/<UpdateVariable>[\s\S]*?<\/UpdateVariable>/gi, ' ');
  const withoutPlanningBlock = withoutUpdateBlock.replace(/<konatan_planning~?>[\s\S]*?<\/konatan_planning~?>/gi, ' ');
  const withoutTucaoBlock = withoutPlanningBlock.replace(/<tucao>[\s\S]*?<\/tucao>/gi, ' ');
  const cleaned = withoutTucaoBlock.replace(/<[^>]+>/g, ' ');
  const anchorList = ['好了，开始敲键盘了！', '开始正文：', '正文：'];

  for (const anchor of anchorList) {
    const index = cleaned.lastIndexOf(anchor);
    if (index >= 0) {
      return cleaned.slice(index + anchor.length);
    }
  }

  return cleaned;
}

function dedupeStringArray(items: unknown[]) {
  return _.uniq(_.flattenDeep(items).map(item => String(item ?? '').trim()).filter(Boolean));
}

function 拆分叙事句子(message: string) {
  return String(message ?? '')
    .split(/[\n。！？!?]+/u)
    .map(text => text.trim())
    .filter(Boolean);
}

function 归一化异常事件文本(text: string) {
  const normalized = 归一化非死亡措辞(String(text ?? '').trim());
  if (!normalized) return '';

  for (const name of 固定角色名列表) {
    if (!normalized.includes(name)) continue;
    if (/失踪|失联|消失|不见了|找不到了|没回来|人没了|神隐/u.test(normalized)) {
      return `${name}在昨夜失踪`;
    }
    if (/隔离|看管|照看/u.test(normalized)) {
      return `${name}在昨夜出事后被带去隔离看管`;
    }
    if (/关押|拘束|失去行动资格/u.test(normalized)) {
      return `${name}在昨夜出事后失去行动资格`;
    }
    if (/推下悬崖|处决|处刑|处死|已在昨日/u.test(normalized)) {
      return `${name}已在昨日被处决`;
    }
  }

  return normalized;
}

function 获取默认角色存活状态表() {
  return 固定角色名列表.reduce<Record<string, string>>((acc, name) => {
    acc[name] = '存活';
    return acc;
  }, {});
}

function 读取角色存活状态表(stat: Record<string, any>) {
  const currentTable = _.get(stat, '生存.角色存活状态', {}) as Record<string, any>;
  const defaultTable = 获取默认角色存活状态表();

  return Object.entries(defaultTable).reduce<Record<string, string>>((acc, [name, defaultStatus]) => {
    const nextStatus = String(_.get(currentTable, name, defaultStatus) ?? defaultStatus).trim();
    acc[name] = nextStatus || defaultStatus;
    return acc;
  }, {});
}

function 推断正式角色存活状态(
  groupName: '女性角色' | '男性角色' | null,
  currentStatus: string,
  abnormalText = '',
) {
  const normalizedStatus = String(currentStatus ?? '').trim();
  const normalizedText = String(abnormalText ?? '').trim();

  if (/已死亡|死亡|处决|处刑|处死|推下悬崖|坠崖|摔下悬崖/u.test(normalizedText)) return '已死亡';
  if (normalizedStatus === '神隐中' || /失踪|失联|消失|被带走|被拖走|被拖离|神隐/u.test(normalizedText)) {
    return '已失踪';
  }
  if (
    normalizedStatus === '被关押' ||
    /关押|拘束|绑住|扣住|压住|被控制|失去行动资格/u.test(normalizedText)
  ) {
    return groupName === '女性角色' ? '被隔离' : '被关押';
  }
  if (
    normalizedStatus === '被隔离' ||
    /隔离|看管|照看|污染|标记|失控|倒下|昏迷|失去意识/u.test(normalizedText)
  ) {
    return groupName === '女性角色' ? '被隔离' : '被关押';
  }
  return '存活';
}

function 从票决结果构建异常事件(stat: Record<string, any>) {
  const voteResult = _.get(stat, '宴会.票决结果', {}) as Record<string, any>;
  if (!_.get(voteResult, '是否完成', false)) return '';

  const target = String(_.get(voteResult, '票出对象', '') ?? '').trim();
  const result = String(_.get(voteResult, '处置结果', '') ?? '').trim();
  if (!target || !固定角色名集合.has(target)) return '';

  if (/推下悬崖|处决|处刑|处死|坠崖|摔下悬崖/u.test(result)) {
    return `${target}已在今日被处决`;
  }
  if (/隔离|看管/u.test(result)) {
    return `${target}在今日票决后被带去隔离看管`;
  }
  if (/失去行动资格|关押|拘束/u.test(result)) {
    return `${target}在今日票决后失去行动资格`;
  }

  return '';
}

function 从异常事件回填票决结果(stat: Record<string, any>) {
  const voteResult = _.get(stat, '宴会.票决结果', {}) as Record<string, any>;
  if (!_.isPlainObject(voteResult)) return;
  if (Boolean(_.get(voteResult, '是否完成', false))) return;

  const currentEvents = dedupeStringArray(_.get(stat, '宴会.今日异常事件列表', []));
  const matchedEvent = currentEvents.find(text => /今日票决后被带去隔离看管|今日票决后失去行动资格|已在今日被处决/u.test(text));
  if (!matchedEvent) return;

  const target = 固定角色名列表.find(name => matchedEvent.includes(name));
  if (!target) return;

  let result = '';
  if (/带去隔离看管/u.test(matchedEvent)) {
    result = '带去隔离看管';
  } else if (/失去行动资格/u.test(matchedEvent)) {
    result = '失去行动资格';
  } else if (/已在今日被处决/u.test(matchedEvent)) {
    result = '推下悬崖';
  }
  if (!result) return;

  _.set(voteResult, '是否完成', true);
  _.set(voteResult, '票出对象', target);
  _.set(voteResult, '处置结果', result);
  if (!String(_.get(voteResult, '结果说明', '') ?? '').trim()) {
    _.set(voteResult, '结果说明', '在恐慌与站队压力下，被多数人推为可疑对象并按规矩处理。');
  }

  const currentStage = String(_.get(stat, '宴会.当前阶段', '未开始') ?? '').trim();
  if (currentStage === '讨论中' || currentStage === '未开始') {
    _.set(stat, '宴会.当前阶段', '票决中');
  }

  logDebug('已从异常事件回填票决结果', {
    target,
    result,
    matchedEvent,
  });
}

function 归一化票决对象名称(value: unknown) {
  const text = String(value ?? '').trim();
  if (!text) return '';

  const protagonistAliases = new Set(获取主角别名列表());
  if (protagonistAliases.has(text)) return 'user';

  const exactName = 固定角色名列表.find(name => name === text);
  if (exactName) return exactName;

  const embeddedName = 固定角色名列表.find(name => text.includes(name));
  return embeddedName ?? text;
}

function 归一化场景地点文本(value: unknown) {
  const text = String(value ?? '').trim();
  if (!text) return '';
  if (text === '集集会堂' || text.includes('集会堂')) return '集会堂';
  return text;
}

function 获取正式宴会票决候选角色列表(stat: Record<string, any>) {
  return 归一化场景名单(_.get(stat, '场景.当前宴会参与角色列表', []))
    .filter(name => name !== 'user')
    .filter(name => 固定角色名集合.has(name));
}

function 是否票决对象仍算本场有效对象(stat: Record<string, any>, target: string, validCandidates: Set<string>) {
  if (!target) return false;
  if (target === 'user' || validCandidates.has(target)) return true;

  const currentEvents = dedupeStringArray(_.get(stat, '宴会.今日异常事件列表', []));
  return currentEvents.some(
    text => text.includes(target) && /今日票决后被带去隔离看管|今日票决后失去行动资格|已在今日被处决/u.test(text),
  );
}

function 纠正式宴会参与名单(stat: Record<string, any>) {
  if (!Boolean(_.get(stat, '世界.是否处于宴会阶段', false))) return;

  const female = _.get(stat, '角色.女性角色', {}) as Record<string, Record<string, any>>;
  const male = _.get(stat, '角色.男性角色', {}) as Record<string, Record<string, any>>;
  const blockedStatuses = new Set(['不可见', '神隐中', '被隔离', '被关押']);

  const currentBanquetList = 归一化场景名单(_.get(stat, '场景.当前宴会参与角色列表', []))
    .filter(name => name !== 'user')
    .filter(name => 固定角色名集合.has(name));

  const currentPresentList = 归一化场景名单(_.get(stat, '场景.在场角色列表', []))
    .filter(name => name !== 'user')
    .filter(name => 固定角色名集合.has(name));

  const forcedParticipants = 固定角色名列表.filter(name => {
    const detail = female[name] ?? male[name];
    if (!_.isObject(detail)) return false;

    const currentStatus = String(_.get(detail, '当前在场状态', '') ?? '').trim();
    if (blockedStatuses.has(currentStatus)) return false;
    return true;
  });

  const nextParticipants = _.uniq([...forcedParticipants, ...currentBanquetList, ...currentPresentList]);
  const nextBanquetList = nextParticipants;
  const nextPresentList = nextParticipants;
  if (!_.isEqual(nextBanquetList, currentBanquetList)) {
    _.set(stat, '场景.当前宴会参与角色列表', nextBanquetList);
  }
  if (!_.isEqual(nextPresentList, currentPresentList)) {
    _.set(stat, '场景.在场角色列表', nextPresentList);
  }
  _.set(
    stat,
    '场景.缺席角色列表',
    固定角色名列表.filter(name => !nextPresentList.includes(name)),
  );

  [...Object.entries(female), ...Object.entries(male)].forEach(([name, detail]) => {
    if (!_.isObject(detail)) return;
    const currentStatus = String(_.get(detail, '当前在场状态', '') ?? '').trim();
    if (nextBanquetList.includes(name)) {
      if (blockedStatuses.has(currentStatus)) return;
      _.set(detail, '当前所在地点', '集会堂');
      _.set(detail, '当前在场状态', '宴会中');
      return;
    }

    if (currentStatus === '宴会中') {
      _.set(detail, '当前在场状态', '离场');
    }
  });
  _.set(stat, '主角.当前所在地点', '集会堂');
  _.set(stat, '主角.当前在场状态', '在场');
}

function 清理正式宴会场外票决结果(stat: Record<string, any>) {
  const voteResult = _.get(stat, '宴会.票决结果', {}) as Record<string, any>;
  if (!_.isPlainObject(voteResult)) return;

  const normalizedTarget = 归一化票决对象名称(String(_.get(voteResult, '票出对象', '') ?? '').trim());
  const validCandidates = new Set(获取正式宴会票决候选角色列表(stat));
  if (
    !normalizedTarget ||
    validCandidates.size <= 0 ||
    是否票决对象仍算本场有效对象(stat, normalizedTarget, validCandidates)
  ) {
    return;
  }

  _.set(voteResult, '是否完成', false);
  _.set(voteResult, '票出对象', '');
  _.set(voteResult, '处置结果', '');
  _.set(voteResult, '结果说明', '');

  const currentFocus = dedupeStringArray(_.get(stat, '宴会.当前怀疑焦点', []));
  if (currentFocus.includes(normalizedTarget)) {
    _.set(
      stat,
      '宴会.当前怀疑焦点',
      currentFocus.filter(name => name !== normalizedTarget),
    );
  }

  const currentEvents = dedupeStringArray(_.get(stat, '宴会.今日异常事件列表', []));
  const filteredEvents = currentEvents.filter(text => !text.includes(normalizedTarget));
  if (!_.isEqual(currentEvents, filteredEvents)) {
    _.set(stat, '宴会.今日异常事件列表', filteredEvents);
  }

  const survivalTable = _.get(stat, '生存.角色存活状态', {}) as Record<string, any>;
  if (_.get(survivalTable, normalizedTarget) === '已死亡') {
    _.set(survivalTable, normalizedTarget, '存活');
  }

  logDebug('已清理正式宴会场外票决结果', {
    target: normalizedTarget,
    validCandidates: [...validCandidates],
  });
}

function 规范化正式宴会结果(stat: Record<string, any>) {
  const normalizedSceneLocation = 归一化场景地点文本(_.get(stat, '场景.当前地点', ''));
  if (normalizedSceneLocation) {
    _.set(stat, '场景.当前地点', normalizedSceneLocation);
  }
  const normalizedProtagonistLocation = 归一化场景地点文本(_.get(stat, '主角.当前所在地点', ''));
  if (normalizedProtagonistLocation) {
    _.set(stat, '主角.当前所在地点', normalizedProtagonistLocation);
  }

  const isBanquet = Boolean(_.get(stat, '世界.是否处于宴会阶段', false));
  if (isBanquet) {
    同步正式宴会场面(stat);
    纠正式宴会参与名单(stat);
  } else {
    解除正式宴会场面(stat);
  }

  从异常事件回填票决结果(stat);

  const voteResult = _.get(stat, '宴会.票决结果', {}) as Record<string, any>;
  if (!_.isPlainObject(voteResult)) return;

  const originalTarget = String(_.get(voteResult, '票出对象', '') ?? '').trim();
  const normalizedTarget = 归一化票决对象名称(originalTarget);
  if (normalizedTarget && normalizedTarget !== originalTarget) {
    _.set(voteResult, '票出对象', normalizedTarget);
  }

  const currentStage = String(_.get(stat, '宴会.当前阶段', '未开始') ?? '').trim();
  const isCompleted = Boolean(_.get(voteResult, '是否完成', false));
  if (isBanquet) {
    if (isCompleted && currentStage !== '票决中') {
      _.set(stat, '宴会.当前阶段', '票决中');
    } else if (!isCompleted && currentStage === '未开始') {
      _.set(stat, '宴会.当前阶段', '讨论中');
    }
  } else if (isCompleted && currentStage !== '已散场') {
    _.set(stat, '宴会.当前阶段', '已散场');
  }

  if (!isCompleted) return;

  const validCandidates = new Set(获取正式宴会票决候选角色列表(stat));
  const shouldValidateCompletedVote = validCandidates.size > 0;
  const isValidTarget = 是否票决对象仍算本场有效对象(stat, normalizedTarget, validCandidates);
  if (shouldValidateCompletedVote && (!normalizedTarget || !isValidTarget)) {
    _.set(voteResult, '是否完成', false);
    _.set(voteResult, '票出对象', '');
    _.set(voteResult, '处置结果', '');
    _.set(voteResult, '结果说明', '');

    const currentEvents = dedupeStringArray(_.get(stat, '宴会.今日异常事件列表', []));
    const filteredEvents = currentEvents.filter(text => {
      if (!normalizedTarget) return true;
      if (!text.includes(normalizedTarget)) return true;
      return !/今日票决|今日被处决|带去隔离看管|失去行动资格/u.test(text);
    });
    if (!_.isEqual(currentEvents, filteredEvents)) {
      _.set(stat, '宴会.今日异常事件列表', filteredEvents);
    }

    if (String(_.get(stat, '宴会.当前阶段', '未开始') ?? '').trim() === '已散场') {
      _.set(stat, '宴会.当前阶段', isBanquet ? '讨论中' : '未开始');
    }

    logDebug('已拦截无效票决对象', {
      originalTarget,
      normalizedTarget,
      validCandidates: [...validCandidates],
    });
  }

  清理正式宴会场外票决结果(stat);
}

function 同步正式角色存活状态(stat: Record<string, any>) {
  const voteEvent = 从票决结果构建异常事件(stat);
  const rawAbnormalEvents = dedupeStringArray([voteEvent, ...(_.get(stat, '宴会.今日异常事件列表', []) as string[])]).map(
    归一化异常事件文本,
  );
  const abnormalEventsByName = new Map<string, string[]>();
  固定角色名列表.forEach(name => {
    abnormalEventsByName.set(
      name,
      rawAbnormalEvents.filter(text => text.includes(name)),
    );
  });
  const abnormalEvents = rawAbnormalEvents.filter(text => {
    const matchedName = 固定角色名列表.find(name => text.includes(name));
    if (!matchedName) return true;
    const sameNameEvents = abnormalEventsByName.get(matchedName) ?? [];
    const isGeneratedDaytimeResolution =
      /在今日票决后被带去隔离看管|在今日票决后失去行动资格|已在今日被处决/u.test(text);
    const hasNightOriginEvent = sameNameEvents.some(
      eventText =>
        eventText !== text &&
        /(在昨夜|昨夜出事后|昨夜起雾后|在昨夜失踪|昨晚|被狼盯上|天亮后人还在)/u.test(eventText),
    );
    return !(isGeneratedDaytimeResolution && hasNightOriginEvent);
  });
  if (!_.isEqual(rawAbnormalEvents, abnormalEvents)) {
    _.set(stat, '宴会.今日异常事件列表', abnormalEvents);
  }
  const presentSet = new Set(归一化场景名单(_.get(stat, '场景.在场角色列表', [])));
  const banquetSet = new Set(归一化场景名单(_.get(stat, '场景.当前宴会参与角色列表', [])));
  const nextTable = 读取角色存活状态表(stat);
  const nextPresent = 归一化场景名单(_.get(stat, '场景.在场角色列表', []));
  const nextBanquet = 归一化场景名单(_.get(stat, '场景.当前宴会参与角色列表', []));

  固定角色名列表.forEach(name => {
    const { groupName, detail } = 获取角色详情(stat, name);
    const currentStatus = String(_.get(detail, '当前在场状态', '') ?? '').trim();
    const abnormalText = abnormalEvents.find(text => text.includes(name)) ?? '';

    if (abnormalText) {
      nextTable[name] = 推断正式角色存活状态(groupName, currentStatus, abnormalText);
      return;
    }

    if (['神隐中', '被隔离', '被关押'].includes(currentStatus)) {
      nextTable[name] = 推断正式角色存活状态(groupName, currentStatus);
      return;
    }

    if (presentSet.has(name) || banquetSet.has(name) || ['在场', '独处中', '宴会中'].includes(currentStatus)) {
      nextTable[name] = '存活';
    }
  });

  _.set(stat, '生存.角色存活状态', nextTable);

  const shouldBackfillAbnormalEvent =
    Boolean(_.get(stat, '世界.是否处于宴会阶段', false)) ||
    Number(_.get(stat, '宴会.当前宴会轮次', 0)) > 0 ||
    是否已进入雾后次晨阶段(stat);
  if (!shouldBackfillAbnormalEvent) return;

  const currentEvents = dedupeStringArray(_.get(stat, '宴会.今日异常事件列表', [])).map(归一化异常事件文本);
  const currentSegment = String(_.get(stat, '世界.当前时间段', '') ?? '').trim();
  const isDaytimeResolutionWindow = ['清晨', '白天', '傍晚'].includes(currentSegment);
  const fallbackEvents = Object.entries(nextTable)
    .map(([name, survivalStatus]) => {
      if (currentEvents.some(text => text.includes(name))) return '';
      if (survivalStatus === '已失踪') return `${name}在昨夜失踪`;
      if (survivalStatus === '被隔离') {
        return isDaytimeResolutionWindow ? `${name}在今日票决后被带去隔离看管` : `${name}在昨夜出事后被带去隔离看管`;
      }
      if (survivalStatus === '被关押') {
        return isDaytimeResolutionWindow ? `${name}在今日票决后失去行动资格` : `${name}在昨夜出事后失去行动资格`;
      }
      if (survivalStatus === '已死亡') {
        return isDaytimeResolutionWindow ? `${name}已在今日被处决` : `${name}已在昨日被处决`;
      }
      return '';
    })
    .filter(Boolean);

  if (fallbackEvents.length > 0) {
    _.set(stat, '宴会.今日异常事件列表', dedupeStringArray([...currentEvents, ...fallbackEvents]));
  }

  Object.entries(nextTable).forEach(([name, survivalStatus]) => {
    const { detail } = 获取角色详情(stat, name);
    if (!_.isObject(detail)) return;

    if (survivalStatus === '已死亡') {
      _.set(detail, '当前在场状态', '离场');
      _.pull(nextPresent, name);
      _.pull(nextBanquet, name);
      return;
    }
    if (survivalStatus === '已失踪') {
      _.set(detail, '当前在场状态', '神隐中');
      _.pull(nextPresent, name);
      _.pull(nextBanquet, name);
      return;
    }
    if (survivalStatus === '被隔离') {
      _.set(detail, '当前在场状态', '被隔离');
      _.pull(nextPresent, name);
      _.pull(nextBanquet, name);
      return;
    }
    if (survivalStatus === '被关押') {
      _.set(detail, '当前在场状态', '被关押');
      _.pull(nextPresent, name);
      _.pull(nextBanquet, name);
    }
  });

  _.set(stat, '场景.在场角色列表', dedupeStringArray(nextPresent));
  _.set(stat, '场景.当前宴会参与角色列表', dedupeStringArray(nextBanquet));
  纠正式宴会参与名单(stat);
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
  return _.uniq(
    [...castNames, ...获取主角别名列表()]
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

function 清理匿名背景人措辞(text: string) {
  return String(text ?? '')
    .replace(/屋里零零散散坐着几个人/gu, '')
    .replace(/屋里还有几个人/gu, '')
    .replace(/旁边几个人/gu, '')
    .replace(/几个村民一起看过来/gu, '')
    .replace(/角落里几个村民/gu, '')
    .replace(/门口一个老人/gu, '')
    .replace(/路边两个男人/gu, '')
    .replace(/其他村民/gu, '')
    .replace(/围观的人/gu, '')
    .replace(/一屋子人/gu, '');
}

function 归一化女性夜间后果文本(text: string, femaleNames: Set<string>) {
  const normalized = 清理匿名背景人措辞(归一化非死亡措辞(text));
  const femaleName = [...femaleNames].find(name => normalized.includes(name));
  if (!femaleName) return normalized;
  if (/失踪|失联|消失|不见了|找不到了|没回来|人没了|被带走|被拖走|被拖离|神隐/u.test(normalized)) {
    return `${femaleName}在昨夜出事后被带去隔离看管。`;
  }
  return normalized;
}

function 归一化陌生出事者文本(text: string, validNames: Set<string>) {
  const normalized = 清理匿名背景人措辞(归一化非死亡措辞(text));
  const invalidName = 提取线索中的未知出事者名(normalized, validNames);
  const genericIncident =
    /(有人|某人|某户|某家|老宅|旧宅|村头那边|那边)/u.test(normalized) &&
    /(出事|失踪|失联|消失|不见了|找不到了|没回来|人没了|被带走|被拖走|被拖离|神隐|倒下|昏迷|被隔离|被关押)/u.test(normalized);
  if (!invalidName && !genericIncident) return normalized;

  const targetName = 从现有角色中选择出事者名(validNames, normalized);
  if (!targetName) return normalized;

  if (/失踪|失联|消失|不见了|找不到了|没回来|人没了|被带走|被拖走|被拖离|神隐/u.test(normalized)) {
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
  const validNames = new Set(获取既有角色名集合(variables));
  const femaleNames = new Set(
    Object.keys(_.get(variables, 'stat_data.角色.女性角色', {}) as Record<string, any>)
      .map(name => String(name ?? '').trim())
      .filter(Boolean),
  );
  const normalizeProgressText = (item: string) => 归一化女性夜间后果文本(item, femaleNames);
  const rawClues = dedupeStringArray(_.get(variables, cluePath, [])).map(normalizeProgressText);
  const rawTruths = dedupeStringArray(_.get(variables, truthPath, [])).map(normalizeProgressText);
  const rawAbnormalEvents = dedupeStringArray(_.get(variables, abnormalEventPath, [])).map(normalizeProgressText);
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
  写入永久记忆(variables);

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

function 是否说明体回复(message: string) {
  const text = `${message}\n${getNarrativeMessageContent(message)}`;
  return (
    [
    '<yasumiki_loop_state>',
    '根据最新的 `<yasumiki_loop_state>` 快照',
    'status_current_variable',
    '场外质问',
    '这怎么收场',
    '严重的BUG',
    '这是一个严重的BUG',
    '好吧，如果我已经写了',
    '如果我上一轮刚把',
    '根据设定里',
    '停一下停一下，我知道你现在一脑门子问号',
    '如果你真的这么想，那只能说你对休水这座村子的残酷程度还缺乏最基本的认知',
  ].some(keyword => text.includes(keyword))
  );
}

function 是否元叙事污染回复(message: string) {
  const text = `${message}\n${getNarrativeMessageContent(message)}`;
  return (
    [
    'status_current_variable',
    '场外质问',
    '<yasumiki_loop_state>',
    '根据最新的 `<yasumiki_loop_state>` 快照',
    '这怎么收场',
    '严重的BUG',
    '这是一个严重的BUG',
    '好吧，如果我已经写了',
    '如果我上一轮刚把',
    '根据设定里',
    '停一下停一下，我知道你现在一脑门子问号',
    '如果你真的这么想，那只能说你对休水这座村子的残酷程度还缺乏最基本的认知',
  ].some(keyword => text.includes(keyword))
  );
}

function 读取助手消息内容(message: Record<string, any>) {
  return getNarrativeMessageContent(获取聊天消息文本(message));
}

function 获取最近有效场面锚点(maxTrustedLoop = Infinity, excludeMessageId: number | null = null) {
  if (typeof Mvu === 'undefined' || !Mvu?.getMvuData) return null;

  const messages = 获取当前聊天消息列表().filter(message => !Boolean(_.get(message, 'is_user', false)));
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index] as Record<string, any>;
    const messageId = 获取聊天消息编号(message);
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

function 获取最近主角轮回锚点(targetLoop: number) {
  if (typeof Mvu === 'undefined' || !Mvu?.getMvuData) return null;

  for (let offset = 2; offset <= 60; offset += 1) {
    try {
      const stat = _.get(Mvu.getMvuData({ type: 'message', message_id: -offset }), 'stat_data', {});
      const loop = Number(_.get(stat, '世界.当前轮回编号', 1));
      if (!Number.isFinite(loop) || loop !== targetLoop) continue;

      const identity = String(_.get(stat, '主角.本轮功能身份', '村民'));
      const camp = String(_.get(stat, '主角.当前阵营', '未知'));
      const known = Boolean(_.get(stat, '主角.是否已知晓身份', false));
      const prepared = Boolean(_.get(stat, '主角.是否完成宴前准备', false));

      if (identity !== '村民' || camp !== '未知' || known || prepared) {
        return { identity, camp, known, prepared };
      }
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
  const operations = parseLatestJsonPatch(latestMessageContent);
  if (operations.length > 0) return;

  const blockedPaths = 提取核心漂移补丁路径(operations);
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
    if (blockedSet.has('/主角/本轮功能身份') && historyIdentityAnchor.identity !== '村民') {
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
  const operations = parseLatestJsonPatch(latestMessageContent);
  if (!是否元叙事污染回复(latestMessageContent)) return;
  if (operations.length > 0) return;

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


const 主角身份确认关键词 = /(托梦|梦里|梦中|梦境|印记|印痕|纹印|烙印|标记|记号)/;
const 主角身份确认场景关键词 =
  /(你(?:醒来|睡醒|睁开眼|梦里|梦中|梦见|低头|抬手)|主角(?:醒来|睡醒|梦里|梦中)|手背|掌心|手腕|胸口|额头|后颈|天亮|次日清晨|次日一早|清晨)/;

const {
  归一化主角功能身份,
  归一化主角阵营,
  归一化主角当前状态,
  根据主角功能身份推断阵营,
  更新宴会当前胜负,
  同步正式宴会场面,
  解除正式宴会场面,
  是否已进入雾后次晨阶段,
  是否已进入主角身份可确认阶段,
  计算稳定文本哈希,
  获取当前轮回编号,
  读取身份分配锁定轮回编号,
  获取身份校验参与者,
  获取本轮身份参与者,
  构建标准化身份分配表,
  是否存在当前轮回锁定身份表,
  是否命中当前轮回身份锁,
  从身份分配表读取角色身份,
  获取指定身份角色列表,
  获取可分配身份角色名,
  获取默认宴会参与角色列表,
  同步身份分配表到角色,
  按身份表同步主角字段,
  补全本轮身份分配,
  预同步主角雾夜身份到当前楼层,
} = createBanquetIdentityApi({
  固定角色名列表,
  核心女性角色名集合,
  核心女性角色宴会排除状态集合,
  获取当前用户名称,
  获取角色详情,
  getCurrentChatIdSafe,
  从身份分配表读取主角功能身份,
});

const {
  应用当前场面锚点,
  计算可信轮回编号,
  修正轮回编号,
  修正主角身份阵营,
  构建轮回重置变量,
  修正本轮身份锁,
  归一化主角在场状态,
} = createLoopStateApi({
  初始轮回变量,
  主角身份分配表标准键,
  归一化场景名单,
  getNarrativeMessageContent,
  提取用户原始输入,
  读取永久记忆,
  写入永久记忆,
  标准化轮回变量: data => Schema.parse(data),
  补全本轮身份分配,
  解析日期序号,
  日期顺延一天,
  是否已进入雾后次晨阶段,
  是否已进入主角身份可确认阶段,
  归一化主角功能身份,
  归一化主角阵营,
  归一化主角当前状态,
  根据主角功能身份推断阵营,
  获取当前轮回编号,
  获取本轮身份参与者,
  获取身份校验参与者,
  构建标准化身份分配表,
  读取身份分配锁定轮回编号,
  是否存在当前轮回锁定身份表,
  是否命中当前轮回身份锁,
  同步身份分配表到角色,
  按身份表同步主角字段,
  从身份分配表读取主角功能身份,
  回写主角身份分配表条目,
  归一化主角身份分配表条目,
  获取前一助手楼层变量,
  是否出现主角身份确认描写,
});

const {
  修正首日未起雾安全约束,
  修正夜间行动记录,
  回滚未决夜间行动推进,
  修正夜间处理状态,
} = createNightActionApi({
  初始轮回变量,
  固定角色名列表,
  固定女性角色名列表,
  固定角色名集合,
  获取当前用户名称,
  获取角色详情,
  获取主角别名列表,
  dedupeStringArray,
  拆分叙事句子,
  获取既有角色名集合,
  归一化陌生出事者文本,
  归一化女性夜间后果文本,
  归一化非死亡措辞,
  应用当前场面锚点,
  logDebug,
  归一化主角功能身份,
  读取本轮身份分配表: stat => (_.get(stat, '宴会.本轮身份分配表', {}) ?? {}) as Record<string, string>,
  从身份分配表读取角色身份,
  获取指定身份角色列表,
  获取本轮身份参与者,
  获取可分配身份角色名,
  获取默认宴会参与角色列表,
  是否本轮身份分配表合法: (stat, participantNames) =>
    是否存在当前轮回锁定身份表(stat) && 是否命中当前轮回身份锁(stat, participantNames),
  是否已进入雾后次晨阶段,
  计算稳定文本哈希,
  getCurrentChatIdSafe,
});

function 获取当前用户名称() {
  try {
    const contextName = String((window as SillyTavernNameBridge).SillyTavern?.getContext?.()?.name1 ?? '').trim();
    if (contextName) return contextName;
  } catch {
    // ignore context lookup failures and fall back to message metadata
  }

  try {
    const latest = 获取指定角色最新聊天消息('user');
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
      identity: '村民' as (typeof 主角合法功能身份列表)[number],
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
    identity: '村民' as (typeof 主角合法功能身份列表)[number],
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
  if (identity !== '村民' || rawText === '村民') return;

  _.set(assignmentTable, protagonistKey, '村民');
  _.set(stat, '宴会.本轮身份分配表', assignmentTable);
}

function 从身份分配表读取主角功能身份(stat: Record<string, any>) {
  return 读取主角身份分配表条目(stat).identity;
}

function 是否出现主角身份确认描写(message: string) {
  const text = getNarrativeMessageContent(message).replace(/\s+/g, '');
  return Boolean(text) && 主角身份确认关键词.test(text) && 主角身份确认场景关键词.test(text);
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

function 应用消息变量修正流水线(options: {
  variables: Record<string, any>;
  latestMessageContent: string;
  latestMessageId?: number | null;
  latestUserMessageContent?: string;
  operations?: JsonPatchOperation[];
  variablesBeforeUpdate?: Record<string, any>;
  shouldRepairMetaDrift?: boolean;
  shouldRepairIdentityState?: boolean;
}) {
  const {
    variables,
    latestMessageContent,
    latestMessageId = null,
    latestUserMessageContent = '',
    operations = [],
    variablesBeforeUpdate,
    shouldRepairMetaDrift = false,
    shouldRepairIdentityState = false,
  } = options;
  const 显式补丁特征 = 提取显式补丁特征(operations);
  const 允许自动修正身份 = !显式补丁特征.has身份补丁;
  const 允许自动修正胜负 = !显式补丁特征.has胜负补丁;

  预拦截说明体核心字段漂移(variables, latestMessageContent, latestMessageId);
  if (允许自动修正身份) {
    补全本轮身份分配(variables);
    预同步主角雾夜身份到当前楼层(variables, latestUserMessageContent);
  }
  修正首日未起雾安全约束(variables);
  修正夜间行动记录(variables, latestMessageContent, latestUserMessageContent);
  同步正式角色存活状态(_.get(variables, 'stat_data', {}) as Record<string, any>);
  修正夜间处理状态(variables, latestMessageContent);
  sanitizeMemoryProgress(variables);

  if (shouldRepairMetaDrift && variablesBeforeUpdate) {
    回滚元叙事状态漂移(variables, variablesBeforeUpdate, latestMessageContent);
  }

  if (shouldRepairIdentityState && variablesBeforeUpdate) {
    修正轮回编号(variables, variablesBeforeUpdate, latestUserMessageContent);
    if (允许自动修正身份) {
      修正主角身份阵营(variables, variablesBeforeUpdate, latestUserMessageContent, latestMessageContent);
      修正本轮身份锁(variables, variablesBeforeUpdate, latestUserMessageContent);
    }
  }

  应用显式场景补丁保护(variables, operations);
  回滚未决夜间行动推进(variables, latestMessageContent, variablesBeforeUpdate);
  if (shouldRepairIdentityState && variablesBeforeUpdate) {
    修正本轮身份锁(variables, variablesBeforeUpdate, latestUserMessageContent);
    if (显式补丁特征.has身份补丁) {
      补全本轮身份分配(variables);
    }
  }
  修正跨夜日期一致性(variables, variablesBeforeUpdate);
  修正雾夜时刻一致性(variables, variablesBeforeUpdate);
  修正时间段一致性(variables);
  规范化正式宴会结果(_.get(variables, 'stat_data', {}) as Record<string, any>);
  归一化主角在场状态(_.get(variables, 'stat_data', {}) as Record<string, any>);
  同步正式角色存活状态(_.get(variables, 'stat_data', {}) as Record<string, any>);
  if (允许自动修正胜负) {
    更新宴会当前胜负(_.get(variables, 'stat_data', {}) as Record<string, any>);
  }
  同步宴会票决提示(_.get(variables, 'stat_data', {}) as Record<string, any>);
  同步在场心里话提示(_.get(variables, 'stat_data', {}) as Record<string, any>);

  logDebug('应用消息变量修正流水线', {
    operationCount: operations.length,
    显式补丁特征,
  });
}

async function 尝试按最终助手回复重算最新楼层变量() {
  if (typeof Mvu === 'undefined' || !Mvu?.getMvuData || !Mvu?.replaceMvuData || !Mvu?.parseMessage) return;

  const latestMessage = getLatestAssistantMessageMeta();
  if (!latestMessage.rawContent.trim()) return;
  const normalizedRawContent = normalizeAssistantMessageForMvuParsing(latestMessage.rawContent);

  try {
    const previousAssistantMessageId = getPreviousAssistantMessageId();
    const previousVariables =
      typeof previousAssistantMessageId === 'number'
        ? (Mvu.getMvuData({ type: 'message', message_id: previousAssistantMessageId }) as Record<string, any>)
        : ({ stat_data: _.cloneDeep(初始轮回变量) } as Record<string, any>);
    const reparsedVariables = (await Mvu.parseMessage(
      normalizedRawContent,
      _.cloneDeep(previousVariables),
    )) as Record<string, any>;
    if (!_.isPlainObject(reparsedVariables) || !_.has(reparsedVariables, 'stat_data')) return;

    const latestUserMessageContent = getLatestUserMessageContent();
    const operations = 是否跳过Latest补丁(latestMessage.messageId) ? [] : parseLatestJsonPatch(latestMessage.rawContent);
    应用消息变量修正流水线({
      variables: reparsedVariables,
      latestMessageContent: latestMessage.rawContent,
      latestMessageId: latestMessage.messageId,
      latestUserMessageContent,
      operations,
      variablesBeforeUpdate: previousVariables,
      shouldRepairMetaDrift: true,
      shouldRepairIdentityState: true,
    });

    const latestVariables = Mvu.getMvuData({ type: 'message', message_id: 'latest' }) as Record<string, any>;
    _.set(latestVariables, 'stat_data', _.cloneDeep(_.get(reparsedVariables, 'stat_data', {})));
    await Mvu.replaceMvuData(latestVariables, { type: 'message', message_id: 'latest' });
    logDebug('已按最终助手回复重算最新楼层变量', {
      messageId: latestMessage.messageId,
      scene: _.get(reparsedVariables, 'stat_data.场景.当前地点'),
      date: _.get(reparsedVariables, 'stat_data.世界.当前日期'),
      time: _.get(reparsedVariables, 'stat_data.世界.当前时刻'),
    });
  } catch (error) {
    console.error(`${debugPrefix} 最终回复重算最新楼层变量失败`, error);
  }
}

export async function init变量结构运行时() {
  logDebug('初始化开始');
  logDebug('等待 Mvu 初始化');
  await waitGlobalInitialized('Mvu');
  logDebug('Mvu 初始化完成');

  暴露轮回重置接口();
  注册待触发轮回提示();
  注册待触发票决提示();
  注册待触发心里话提示();
  eventOn(tavern_events.MESSAGE_SENT, () => {
    if (window.localStorage.getItem(pendingLoopPromptStorageKey) && 轮回提示是否已送达()) {
      清除待触发轮回提示('MESSAGE_SENT_AFTER_LOOP_SCENE');
    }
  });
  eventOn(tavern_events.CHAT_CHANGED, () => {
    清除待触发轮回提示('CHAT_CHANGED');
    清除待触发票决提示('CHAT_CHANGED');
    清除待触发心里话提示('CHAT_CHANGED');
    清除跳过补丁阈值();
  });

  eventOn(Mvu.events.VARIABLE_INITIALIZED, (variables, swipeId) => {
    补全本轮身份分配(variables);
    同步正式角色存活状态(_.get(variables, 'stat_data', {}) as Record<string, any>);
    logDebug('VARIABLE_INITIALIZED', { swipeId });
  });

  eventOn(Mvu.events.BEFORE_MESSAGE_UPDATE, context => {
    const latestMessage = getLatestAssistantMessageMeta();
    const latestMessageContent = latestMessage.rawContent || context.message_content;
    const operations = 是否跳过Latest补丁(latestMessage.messageId) ? [] : parseLatestJsonPatch(latestMessageContent);
    logDebug('BEFORE_MESSAGE_UPDATE', {
      operationCount: operations.length,
      skipped: true,
    });
  });

  eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, (variables, variablesBeforeUpdate) => {
    const latestMessage = getLatestAssistantMessageMeta();
    const latestMessageContent = latestMessage.rawContent;
    const latestUserMessageContent = getLatestUserMessageContent();
    const operations = 是否跳过Latest补丁(latestMessage.messageId) ? [] : parseLatestJsonPatch(latestMessageContent);
    应用消息变量修正流水线({
      variables,
      latestMessageContent,
      latestMessageId: latestMessage.messageId,
      latestUserMessageContent,
      operations,
      variablesBeforeUpdate,
      shouldRepairMetaDrift: true,
      shouldRepairIdentityState: true,
    });
    logDebug('VARIABLE_UPDATE_ENDED', { operationCount: operations.length });
  });
  eventOn(tavern_events.MESSAGE_RECEIVED, () => {
    标记轮回提示已送达('MESSAGE_RECEIVED');
    const latestMessage = getLatestAssistantMessageMeta();
    if (是否元叙事污染回复(latestMessage.rawContent) && typeof Mvu !== 'undefined' && Mvu?.getMvuData && Mvu?.replaceMvuData) {
      try {
        const latest = Mvu.getMvuData({ type: 'message', message_id: 'latest' });
        const latestStat = _.get(latest, 'stat_data', {}) as Record<string, any>;
        const trustedLoop = 计算可信轮回编号(latestStat);
        const anchorStat = 获取最近有效场面锚点(trustedLoop, latestMessage.messageId) ?? 获取最近楼层变量锚点(trustedLoop);
        if (anchorStat) {
          _.set(latest, 'stat_data', _.cloneDeep(anchorStat));
          void Mvu.replaceMvuData(latest, { type: 'message', message_id: 'latest' });
          logDebug('MESSAGE_RECEIVED 后已回滚元叙事污染楼层变量', {
            anchorLoop: _.get(anchorStat, '世界.当前轮回编号'),
            anchorLocation: _.get(anchorStat, '场景.当前地点'),
          });
        }
      } catch (error) {
        console.error(`${debugPrefix} MESSAGE_RECEIVED 回滚元叙事楼层失败`, error);
      }
    }
    void 尝试按最终助手回复重算最新楼层变量();
    logDebug('MESSAGE_RECEIVED');
  });
  eventOn(tavern_events.MESSAGE_UPDATED, () => {
    标记轮回提示已送达('MESSAGE_UPDATED');
    logDebug('MESSAGE_UPDATED');
  });
  eventOn(tavern_events.MESSAGE_SWIPED, () => {
    logDebug('MESSAGE_SWIPED');
  });

  void 尝试按最终助手回复重算最新楼层变量();
  try {
    const latest = Mvu.getMvuData({ type: 'message', message_id: 'latest' }) as Record<string, any>;
    同步宴会票决提示(_.get(latest, 'stat_data', {}) as Record<string, any>);
    同步在场心里话提示(_.get(latest, 'stat_data', {}) as Record<string, any>);
  } catch {
    // ignore initial prompt sync failures
  }
  logDebug('变量结构注册成功');
}
