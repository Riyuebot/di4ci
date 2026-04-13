export const 主角合法功能身份列表 = ['村民', '蛇', '猿', '乌鸦', '蜘蛛', '狼', '貉'] as const;
const 主角人类功能身份列表 = ['蛇', '猿', '乌鸦', '蜘蛛'] as const;
const 主角狼侧功能身份列表 = ['狼', '貉'] as const;
const 主角功能身份回退映射: Record<string, (typeof 主角合法功能身份列表)[number]> = {
  未分配: '村民',
  未知: '村民',
  未确认: '村民',
  未公开: '村民',
  平民: '村民',
  普通人: '村民',
  普通平民: '村民',
  '普通平民（人类）': '村民',
  '平民（人类）': '村民',
  '普通人（人类）': '村民',
  普通村民: '村民',
  村民: '村民',
  人类: '村民',
  火柴人: '村民',
};
const 主角合法阵营列表 = ['未知', '人类', '狼'] as const;
const 主角阵营回退映射: Record<string, (typeof 主角合法阵营列表)[number]> = {
  人类侧: '人类',
  村民侧: '人类',
  狼方: '狼',
  狼阵营: '狼',
  狼侧: '狼',
  狼侧阵营: '狼',
  未确认: '未知',
  中立: '未知',
};
const 主角合法当前状态列表 = ['清醒', '睡梦中', '在场', '离场', '被关押', '被压制'] as const;
const 主角伪普通人身份关键词 = ['平民', '普通人', '普通平民', '普通村民', '村民', '人类', '火柴人'] as const;
const 宴会基础功能身份模板 = ['蛇', '猿', '猿', '乌鸦', '蜘蛛', '狼', '狼', '狼'] as const;
const 身份分配排除角色列表 = [] as const;

export const 主角身份分配表标准键 = '主角' as const;

type 日期序号 = {
  month: number;
  day: number;
  serial: number;
};

type BanquetIdentityDeps = {
  固定角色名列表: string[];
  核心女性角色名集合: Set<string>;
  核心女性角色宴会排除状态集合: Set<string>;
  获取当前用户名称: () => string;
  获取角色详情: (stat: Record<string, any>, name: string) => {
    detail?: Record<string, any> | null;
  };
  getCurrentChatIdSafe: () => string;
  从身份分配表读取主角功能身份: (stat: Record<string, any>) => string;
};

function dedupeStringArray(items: unknown[]) {
  return _.uniq(
    _.flattenDeep(Array.isArray(items) ? items : [items])
      .map(item => String(item ?? '').trim())
      .filter(Boolean),
  );
}

export function 解析日期序号(value: unknown): 日期序号 | null {
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

export function 日期顺延一天(value: unknown) {
  const parsed = 解析日期序号(value);
  if (!parsed) return '5月13日';
  return `${parsed.month}月${_.clamp(parsed.day + 1, 1, 31)}日`;
}

export function 解析时刻分钟(value: unknown) {
  const matched = String(value ?? '').trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!matched) return null;
  const hour = Number(matched[1]);
  const minute = Number(matched[2]);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  return hour * 60 + minute;
}

export function createBanquetIdentityApi({
  固定角色名列表,
  核心女性角色名集合,
  核心女性角色宴会排除状态集合,
  获取当前用户名称,
  获取角色详情,
  getCurrentChatIdSafe,
  从身份分配表读取主角功能身份,
}: BanquetIdentityDeps) {
  function 读取本轮身份分配表(stat: Record<string, any>) {
    return (_.get(stat, '宴会.本轮身份分配表', {}) ?? {}) as Record<string, string>;
  }

  function 从身份分配表读取角色身份(stat: Record<string, any>, name: string) {
    const assignmentTable = 读取本轮身份分配表(stat);
    const key = name === 'user' ? 主角身份分配表标准键 : name;
    return 归一化主角功能身份(
      _.get(
        assignmentTable,
        key,
        key === 主角身份分配表标准键
          ? _.get(stat, '主角.本轮功能身份', '村民')
          : _.get(获取角色详情(stat, name).detail, '本轮功能身份', '村民'),
      ),
    );
  }

  function 获取指定身份角色列表(stat: Record<string, any>, identity: string) {
    const assignmentTable = 读取本轮身份分配表(stat);
    return Object.entries(assignmentTable)
      .filter(([, assigned]) => 归一化主角功能身份(assigned) === identity)
      .map(([name]) => name);
  }

  function 归一化主角功能身份(value: unknown) {
    const text = String(value ?? '').trim();
    if (!text) return '村民';
    if (主角伪普通人身份关键词.some(keyword => text.includes(keyword))) return '村民';
    const normalized = 主角功能身份回退映射[text] ?? text;
    return 主角合法功能身份列表.includes(normalized as (typeof 主角合法功能身份列表)[number])
      ? (normalized as (typeof 主角合法功能身份列表)[number])
      : '村民';
  }

  function 归一化主角阵营(value: unknown) {
    const text = String(value ?? '').trim();
    const normalized = 主角阵营回退映射[text] ?? text;
    return 主角合法阵营列表.includes(normalized as (typeof 主角合法阵营列表)[number])
      ? (normalized as (typeof 主角合法阵营列表)[number])
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
      return '狼';
    }
    return '未知';
  }

  function 角色是否已退出本轮(stat: Record<string, any>, name: string) {
    const 出局状态 = new Set(['被隔离', '被关押', '不可见', '神隐中']);
    if (name === 主角身份分配表标准键 || name === 'user') {
      const protagonistPresence = String(_.get(stat, '主角.当前在场状态', '在场') ?? '在场').trim();
      return 出局状态.has(protagonistPresence);
    }

    const { detail } = 获取角色详情(stat, name);
    if (!_.isObject(detail)) return false;
    const currentStatus = String(_.get(detail, '当前在场状态', '离场') ?? '离场').trim();
    return 出局状态.has(currentStatus);
  }

  function 是否已进入雾后次晨阶段(stat: Record<string, any>) {
    if (_.get(stat, '世界.是否处于宴会阶段', false)) return true;
    if (Number(_.get(stat, '宴会.当前宴会轮次', 0)) > 0) return true;

    const currentDate = 解析日期序号(_.get(stat, '世界.当前日期', ''));
    if (currentDate && currentDate.serial > 512) return true;
    return false;
  }

  function 是否已进入主角身份可确认阶段(stat: Record<string, any>) {
    if (是否已进入雾后次晨阶段(stat)) return true;

    const currentDate = 解析日期序号(_.get(stat, '世界.当前日期', ''));
    if (!currentDate) return false;

    if (currentDate.serial > 512) return true;
    if (currentDate.serial !== 512) return false;

    const currentSegment = String(_.get(stat, '世界.当前时间段', '') ?? '').trim();
    const isFog = Boolean(_.get(stat, '世界.是否起雾', false));
    return isFog && ['雾夜', '夜间', '深夜'].includes(currentSegment);
  }

  function 是否应预构建本轮身份(stat: Record<string, any>) {
    const currentDate = 解析日期序号(_.get(stat, '世界.当前日期', ''));
    if (!currentDate) return false;
    return currentDate.serial >= 512;
  }

  function 是否应补全本轮身份(stat: Record<string, any>) {
    return 是否应预构建本轮身份(stat);
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

  function 获取身份校验参与者(stat: Record<string, any>) {
    return _.uniq(['user', ...获取可分配身份角色名(stat)]);
  }

  function 同步正式宴会场面(stat: Record<string, any>) {
    const participants = 获取默认宴会参与角色列表(stat);
    const explicitSceneParticipants = dedupeStringArray(
      (_.get(stat, '场景.当前宴会参与角色列表', []) as unknown[]).map(name => String(name ?? '').trim()),
    ).filter(name => name !== 'user' && 固定角色名列表.includes(name));
    const defaultParticipants = participants.filter(name => name !== 'user');
    const sceneParticipants = _.uniq([...defaultParticipants, ...explicitSceneParticipants]);
    const female = _.get(stat, '角色.女性角色', {}) as Record<string, Record<string, any>>;
    const male = _.get(stat, '角色.男性角色', {}) as Record<string, Record<string, any>>;
    const hiddenStates = new Set(['不可见', '神隐中', '被隔离', '被关押']);

    _.set(stat, '场景.当前地点', '集会堂');
    _.set(stat, '场景.当前宴会参与角色列表', sceneParticipants);
    _.set(stat, '场景.在场角色列表', sceneParticipants);
    _.set(
      stat,
      '场景.缺席角色列表',
      固定角色名列表.filter(name => !sceneParticipants.includes(name)),
    );
    _.set(stat, '主角.当前所在地点', '集会堂');
    _.set(stat, '主角.当前在场状态', '在场');

    [...Object.entries(female), ...Object.entries(male)].forEach(([name, detail]) => {
      if (!_.isObject(detail)) return;
      const currentStatus = String(_.get(detail, '当前在场状态', '') ?? '').trim();
      if (sceneParticipants.includes(name)) {
        if (hiddenStates.has(currentStatus)) return;
        _.set(detail, '当前所在地点', '集会堂');
        _.set(detail, '当前在场状态', '宴会中');
        return;
      }

      if (currentStatus === '宴会中') {
        _.set(detail, '当前在场状态', '离场');
      }
    });
  }

  function 解除正式宴会场面(stat: Record<string, any>) {
    const female = _.get(stat, '角色.女性角色', {}) as Record<string, Record<string, any>>;
    const male = _.get(stat, '角色.男性角色', {}) as Record<string, Record<string, any>>;
    const eventTexts = dedupeStringArray(_.get(stat, '宴会.今日异常事件列表', []));
    const likelyPostVoteDetentionTargets = new Set(
      eventTexts
        .flatMap(text =>
          固定角色名列表.filter(name =>
            String(text ?? '').includes(name) &&
            /今日票决后被带去隔离看管|今日票决后失去行动资格/u.test(String(text ?? '')),
          ),
        )
        .filter(Boolean),
    );
    _.set(stat, '场景.当前宴会参与角色列表', []);
    if (String(_.get(stat, '场景.当前地点', '') ?? '').trim() === '集会堂') {
      _.set(stat, '场景.当前地点', '集会堂');
    }
    if (String(_.get(stat, '主角.当前所在地点', '') ?? '').trim() === '集会堂') {
      _.set(stat, '主角.当前所在地点', '集会堂');
    }

    [...Object.entries(female), ...Object.entries(male)].forEach(([name, detail]) => {
      if (!_.isObject(detail)) return;
      const currentStatus = String(_.get(detail, '当前在场状态', '') ?? '').trim();
      const currentLocation = String(_.get(detail, '当前所在地点', '') ?? '').trim();
      if (currentStatus === '宴会中') {
        _.set(detail, '当前在场状态', likelyPostVoteDetentionTargets.has(name) ? '被隔离' : '在场');
      }
      if (
        String(_.get(detail, '当前在场状态', '') ?? '').trim() === '离场' &&
        currentLocation === '集会堂'
      ) {
        _.set(detail, '当前所在地点', '集会堂');
      }
    });

    const nextPresent = 固定角色名列表.filter(name => {
      const detail = female[name] ?? male[name];
      if (!_.isObject(detail)) return false;
      const currentStatus = String(_.get(detail, '当前在场状态', '') ?? '').trim();
      const currentLocation = String(_.get(detail, '当前所在地点', '') ?? '').trim();
      if (!['在场', '独处中'].includes(currentStatus)) return false;
      return currentLocation === String(_.get(stat, '场景.当前地点', '集会堂') ?? '集会堂').trim();
    });
    _.set(stat, '场景.在场角色列表', nextPresent);
    _.set(stat, '场景.当前宴会参与角色列表', nextPresent);
    _.set(
      stat,
      '场景.缺席角色列表',
      固定角色名列表.filter(name => !nextPresent.includes(name)),
    );
    _.set(stat, '主角.当前在场状态', '在场');
  }

  function 获取当前轮回编号(stat: Record<string, any>) {
    return Number(_.get(stat, '世界.当前轮回编号', 1)) || 1;
  }

  function 读取身份分配锁定轮回编号(stat: Record<string, any>) {
    return Number(_.get(stat, '宴会.身份分配锁定轮回编号', 0)) || 0;
  }

  function 获取锁定本轮身份参与者(stat: Record<string, any>) {
    const currentLoop = 获取当前轮回编号(stat);
    const lockedLoop = 读取身份分配锁定轮回编号(stat);
    const currentTable = _.get(stat, '宴会.本轮身份分配表', {}) as Record<string, any>;
    if (lockedLoop !== currentLoop || !_.isPlainObject(currentTable) || _.isEmpty(currentTable)) {
      return [];
    }

    return 获取身份校验参与者(stat);
  }

  function 获取本轮身份参与者(stat: Record<string, any>) {
    const lockedParticipants = 获取锁定本轮身份参与者(stat);
    if (是否存在当前轮回锁定身份表(stat) && lockedParticipants.length > 0) {
      return lockedParticipants;
    }
    return 获取身份校验参与者(stat);
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

  function 选择主角本轮功能身份(stat: Record<string, any>, loopNumber: number) {
    const rolePool = ['蛇', '猿', '乌鸦', '蜘蛛', '狼'] as const;
    const chatSeed = getCurrentChatIdSafe() || 获取当前用户名称() || 'default-chat';
    const seed = [loopNumber, _.get(stat, '世界.当前路线', ''), chatSeed].join('|');
    const index = 计算稳定文本哈希(seed) % rolePool.length;
    return rolePool[index];
  }

  function 构建待分配功能身份序列(protagonistIdentity: string) {
    const template: Array<Exclude<(typeof 主角合法功能身份列表)[number], '村民'>> = [...宴会基础功能身份模板];

    const normalizedIdentity = 归一化主角功能身份(protagonistIdentity);
    const hitIndex = normalizedIdentity === '村民' ? -1 : template.indexOf(normalizedIdentity);
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

  function 写入主角身份分配表条目(assignmentTable: Record<string, string>, identity: string) {
    assignmentTable[主角身份分配表标准键] = identity;
  }

  function 构建标准化身份分配表(stat: Record<string, any>, participantNames: string[]) {
    const currentTable = _.get(stat, '宴会.本轮身份分配表', {}) as Record<string, any>;
    const nextTable: Record<string, string> = {};
    const protagonistIdentity = 从身份分配表读取主角功能身份(stat);
    if (protagonistIdentity !== '村民') {
      写入主角身份分配表条目(nextTable, protagonistIdentity);
    }

    const female = _.get(stat, '角色.女性角色', {}) as Record<string, Record<string, any>>;
    const male = _.get(stat, '角色.男性角色', {}) as Record<string, Record<string, any>>;
    participantNames
      .filter(name => name !== 'user')
      .forEach(name => {
        const detail = female[name] ?? male[name];
        nextTable[name] = 归一化主角功能身份(_.get(currentTable, name, _.get(detail, '本轮功能身份', '村民')));
      });

    return nextTable;
  }

  function 是否存在当前轮回锁定身份表(stat: Record<string, any>) {
    const currentLoop = 获取当前轮回编号(stat);
    const lockedLoop = 读取身份分配锁定轮回编号(stat);
    const currentTable = _.get(stat, '宴会.本轮身份分配表', {});
    const participantNames = 获取身份校验参与者(stat);
    return (
      lockedLoop === currentLoop &&
      _.isPlainObject(currentTable) &&
      !_.isEmpty(currentTable) &&
      从身份分配表读取主角功能身份(stat) !== '村民' &&
      是否本轮身份分配表合法(stat, participantNames)
    );
  }

  function 是否命中当前轮回身份锁(stat: Record<string, any>, _participantNames?: string[]) {
    return 是否存在当前轮回锁定身份表(stat);
  }

  function 统计本轮身份数量(table: Record<string, string>, participantNames: string[]) {
    const counts: Record<string, number> = {
      村民: 0,
      蛇: 0,
      猿: 0,
      乌鸦: 0,
      蜘蛛: 0,
      狼: 0,
      貉: 0,
    };

    participantNames
      .filter(name => name !== 'user')
      .forEach(name => {
        const identity = 归一化主角功能身份(_.get(table, name, '村民'));
        counts[identity] += 1;
      });

    return counts;
  }

  function 计算期望本轮身份数量(protagonistIdentity: string, participantNames: string[]) {
    const counts: Record<string, number> = {
      村民: 0,
      蛇: 0,
      猿: 0,
      乌鸦: 0,
      蜘蛛: 0,
      狼: 0,
      貉: 0,
    };
    const remainingCount = Math.max(0, participantNames.filter(name => name !== 'user').length);
    const sequence = 构建待分配功能身份序列(protagonistIdentity).slice(0, remainingCount);

    sequence.forEach(identity => {
      counts[identity] += 1;
    });
    counts.村民 = Math.max(0, remainingCount - sequence.length);

    return counts;
  }

  function 是否本轮身份分配表完整(stat: Record<string, any>, participantNames: string[]) {
    const normalizedTable = 构建标准化身份分配表(stat, participantNames);
    if (归一化主角功能身份(normalizedTable[主角身份分配表标准键]) === '村民') return false;

    return participantNames
      .filter(name => name !== 'user')
      .every(name => _.has(normalizedTable, name));
  }

  function 是否本轮身份分配表合法(stat: Record<string, any>, participantNames: string[]) {
    if (!是否本轮身份分配表完整(stat, participantNames)) return false;

    const normalizedTable = 构建标准化身份分配表(stat, participantNames);
    const loopNumber = Number(_.get(stat, '世界.当前轮回编号', 1)) || 1;
    const expectedProtagonistIdentity = 选择主角本轮功能身份(stat, loopNumber);
    const currentProtagonistIdentity = 归一化主角功能身份(normalizedTable[主角身份分配表标准键]);
    if (currentProtagonistIdentity !== expectedProtagonistIdentity) return false;

    const actualCounts = 统计本轮身份数量(normalizedTable, participantNames);
    const expectedCounts = 计算期望本轮身份数量(expectedProtagonistIdentity, participantNames);

    return (Object.keys(expectedCounts) as Array<keyof typeof expectedCounts>).every(
      identity => actualCounts[identity] === expectedCounts[identity],
    );
  }

  function 构建本轮身份分配表(stat: Record<string, any>) {
    const participantNames = 获取本轮身份参与者(stat);
    if (participantNames.length === 0) return {} as Record<string, string>;

    const loopNumber = 获取当前轮回编号(stat);
    const protagonistIdentity = 选择主角本轮功能身份(stat, loopNumber);
    const assignmentTable: Record<string, string> = {};
    写入主角身份分配表条目(assignmentTable, protagonistIdentity);

    const remainingNames = participantNames.filter(name => name !== 'user');
    构建待分配功能身份序列(protagonistIdentity).forEach(identity => {
      const candidate = 按身份分配顺序排序候选角色(stat, remainingNames, identity, loopNumber)[0];
      if (!candidate) return;
      assignmentTable[candidate] = identity;
      _.pull(remainingNames, candidate);
    });

    remainingNames.forEach(name => {
      assignmentTable[name] = '村民';
    });

    return assignmentTable;
  }

  function 同步身份分配表到角色(stat: Record<string, any>, assignmentTable: Record<string, string>) {
    const female = _.get(stat, '角色.女性角色', {}) as Record<string, Record<string, any>>;
    const male = _.get(stat, '角色.男性角色', {}) as Record<string, Record<string, any>>;
    获取可分配身份角色名(stat).forEach(name => {
      const detail = female[name] ?? male[name];
      if (!_.isObject(detail)) return;
      _.set(detail, '本轮功能身份', 归一化主角功能身份(_.get(assignmentTable, name, '村民')));
    });
  }

  function 按身份表同步主角字段(stat: Record<string, any>, assignmentTable: Record<string, string>) {
    const protagonistIdentity = 归一化主角功能身份(_.get(assignmentTable, 主角身份分配表标准键, '村民'));
    if (protagonistIdentity === '村民') return;

    _.set(stat, '主角.本轮功能身份', protagonistIdentity);
    _.set(stat, '主角.当前阵营', 根据主角功能身份推断阵营(protagonistIdentity));
    _.set(stat, '主角.是否完成宴前准备', true);

    if (是否已进入主角身份可确认阶段(stat)) {
      _.set(stat, '主角.是否已知晓身份', true);
    }
  }

  function 更新宴会当前胜负(stat: Record<string, any>) {
    const assignmentTable = 读取本轮身份分配表(stat);
    const participantNames = 获取本轮身份参与者(stat);
    if (_.isEmpty(assignmentTable) || !是否本轮身份分配表合法(stat, participantNames)) {
      _.set(stat, '宴会.当前胜负状态', '未分出');
      _.set(stat, '宴会.当前胜负说明', '');
      return;
    }

    let humanCount = 0;
    let wolfCount = 0;

    Object.entries(assignmentTable).forEach(([name, rawIdentity]) => {
      if (角色是否已退出本轮(stat, name)) return;
      const identity = 归一化主角功能身份(rawIdentity);
      if (identity === '狼' || identity === '貉') {
        wolfCount += 1;
        return;
      }
      humanCount += 1;
    });

    if (wolfCount <= 0 && humanCount <= 0) {
      _.set(stat, '宴会.当前胜负状态', '未分出');
      _.set(stat, '宴会.当前胜负说明', '这一轮还没人真正站到最后，暂时还不能算谁赢。');
      return;
    }

    if (wolfCount <= 0) {
      _.set(stat, '宴会.当前胜负状态', '人类胜利');
      _.set(
        stat,
        '宴会.当前胜负说明',
        '场上已经没有狼和貉了。村民、蛇、猿、乌鸦、蜘蛛这一边赢了。',
      );
      return;
    }

    if (wolfCount >= humanCount) {
      _.set(stat, '宴会.当前胜负状态', '狼胜利');
      _.set(
        stat,
        '宴会.当前胜负说明',
        '还留在局里的狼和貉，人数已经追平或超过人类。狼这一边赢了。',
      );
      return;
    }

    _.set(stat, '宴会.当前胜负状态', '未分出');
    _.set(
      stat,
      '宴会.当前胜负说明',
      `现在还没分出胜负。村民和有神职的人类这边还剩 ${humanCount} 人，狼和貉这边还剩 ${wolfCount} 人。`,
    );
  }

  function 补全本轮身份分配(variables: Record<string, any>) {
    const stat = _.get(variables, 'stat_data', {}) as Record<string, any>;
    if (!是否应补全本轮身份(stat)) {
      更新宴会当前胜负(stat);
      return;
    }

    if (_.get(stat, '世界.是否处于宴会阶段', false)) {
      _.set(stat, '宴会.今日是否已召开宴会', true);
      _.set(stat, '宴会.当前宴会轮次', Math.max(1, Number(_.get(stat, '宴会.当前宴会轮次', 0)) || 0));
    }

    const participantNames = 获取本轮身份参与者(stat);
    if (participantNames.length === 0) {
      更新宴会当前胜负(stat);
      return;
    }

    const assignmentTable = 是否命中当前轮回身份锁(stat, participantNames)
      ? 构建标准化身份分配表(stat, participantNames)
      : 是否本轮身份分配表合法(stat, participantNames)
        ? 构建标准化身份分配表(stat, participantNames)
        : 构建本轮身份分配表(stat);
    _.set(stat, '宴会.本轮身份分配表', assignmentTable);
    _.set(stat, '宴会.身份分配锁定轮回编号', 获取当前轮回编号(stat));

    if (是否已进入主角身份可确认阶段(stat)) {
      同步身份分配表到角色(stat, assignmentTable);
      按身份表同步主角字段(stat, assignmentTable);
    }

    更新宴会当前胜负(stat);
  }

  function 预同步主角雾夜身份到当前楼层(
    variables: Record<string, any>,
    latestUserMessageContent = '',
  ) {
    const stat = _.get(variables, 'stat_data', {}) as Record<string, any>;
    const currentIdentity = 归一化主角功能身份(_.get(stat, '主角.本轮功能身份', '村民'));
    if (currentIdentity !== '村民') return;

    const normalizedUserInput = String(latestUserMessageContent ?? '');
    const hasNightCue = /(今夜|今晚|夜里|夜间|雾夜|深夜|入夜|天黑后|锁门|洗澡|待到天亮|回公寓|回房|回屋|反锁|准备过夜)/u.test(
      normalizedUserInput,
    );
    if (!hasNightCue) return;

    const assignmentTable = _.get(stat, '宴会.本轮身份分配表', {}) as Record<string, string>;
    if (!_.isPlainObject(assignmentTable) || _.isEmpty(assignmentTable)) return;

    同步身份分配表到角色(stat, assignmentTable);
    按身份表同步主角字段(stat, assignmentTable);

    if (!_.get(stat, '世界.是否起雾', false)) {
      const currentSegment = String(_.get(stat, '世界.当前时间段', '') ?? '').trim();
      const currentMinute = 解析时刻分钟(_.get(stat, '世界.当前时刻', ''));
      const shouldEnterNightStage =
        ['傍晚', '夜间', '雾夜', '深夜'].includes(currentSegment) ||
        (currentMinute !== null && currentMinute >= 18 * 60);
      if (shouldEnterNightStage) {
        _.set(stat, '世界.是否起雾', true);
      }
    }
  }

  return {
    读取本轮身份分配表,
    从身份分配表读取角色身份,
    获取指定身份角色列表,
    获取可分配身份角色名,
    获取默认宴会参与角色列表,
    归一化主角功能身份,
    归一化主角阵营,
    归一化主角当前状态,
    根据主角功能身份推断阵营,
    更新宴会当前胜负,
    是否已进入雾后次晨阶段,
    是否已进入主角身份可确认阶段,
    获取当前轮回编号,
    读取身份分配锁定轮回编号,
    获取身份校验参与者,
    同步正式宴会场面,
    解除正式宴会场面,
    获取本轮身份参与者,
    计算稳定文本哈希,
    构建标准化身份分配表,
    是否存在当前轮回锁定身份表,
    是否命中当前轮回身份锁,
    是否本轮身份分配表合法,
    同步身份分配表到角色,
    按身份表同步主角字段,
    补全本轮身份分配,
    预同步主角雾夜身份到当前楼层,
  };
}
