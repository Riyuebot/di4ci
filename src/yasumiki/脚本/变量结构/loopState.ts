type LoopStateDeps = {
  初始轮回变量: Record<string, any>;
  主角身份分配表标准键: string;
  归一化场景名单: (rawList: unknown) => string[];
  getNarrativeMessageContent: (message: string) => string;
  提取用户原始输入: (message: string) => string;
  读取永久记忆: (source: Record<string, any>) => Record<string, any>;
  写入永久记忆: (target: Record<string, any>, memory?: Record<string, any>) => void;
  标准化轮回变量: (data: Record<string, any>) => Record<string, any>;
  补全本轮身份分配: (variables: Record<string, any>) => void;
  解析日期序号: (value: unknown) => { serial: number } | null;
  日期顺延一天: (value: unknown) => string;
  是否已进入雾后次晨阶段: (stat: Record<string, any>) => boolean;
  是否已进入主角身份可确认阶段: (stat: Record<string, any>) => boolean;
  归一化主角功能身份: (value: unknown) => string;
  归一化主角阵营: (value: unknown) => string;
  归一化主角当前状态: (value: unknown, presenceState: unknown, stat?: Record<string, any>) => string;
  根据主角功能身份推断阵营: (identity: string) => string;
  获取当前轮回编号: (stat: Record<string, any>) => number;
  获取本轮身份参与者: (stat: Record<string, any>) => string[];
  获取身份校验参与者: (stat: Record<string, any>) => string[];
  构建标准化身份分配表: (stat: Record<string, any>, participantNames: string[]) => Record<string, string>;
  读取身份分配锁定轮回编号: (stat: Record<string, any>) => number;
  是否存在当前轮回锁定身份表: (stat: Record<string, any>) => boolean;
  是否命中当前轮回身份锁: (stat: Record<string, any>, participantNames?: string[]) => boolean;
  同步身份分配表到角色: (stat: Record<string, any>, assignmentTable: Record<string, string>) => void;
  按身份表同步主角字段: (stat: Record<string, any>, assignmentTable: Record<string, string>) => void;
  从身份分配表读取主角功能身份: (stat: Record<string, any>) => string;
  回写主角身份分配表条目: (stat: Record<string, any>, identity: string) => void;
  归一化主角身份分配表条目: (stat: Record<string, any>) => void;
  获取前一助手楼层变量: () => Record<string, any>;
  是否出现主角身份确认描写: (message: string) => boolean;
};

export function createLoopStateApi({
  初始轮回变量,
  主角身份分配表标准键,
  归一化场景名单,
  getNarrativeMessageContent,
  提取用户原始输入,
  读取永久记忆,
  写入永久记忆,
  标准化轮回变量,
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
}: LoopStateDeps) {
  function 构建空夜间行动记录() {
    return {
      狼目标: '',
      狼执行者: '',
      蛇查验目标: '',
      蛇查验结果: '',
      蜘蛛守护目标: '',
      乌鸦验明对象: '',
      乌鸦验明结果: '',
    };
  }

  function 提取statData(source: Record<string, any>) {
    return (_.has(source, 'stat_data') ? _.get(source, 'stat_data', {}) : source) as Record<string, any>;
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
            _.get(detail, '本轮功能身份', _.get(nextData, `${basePath}.本轮功能身份`, '村民')),
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
    _.set(nextData, '主角.本轮功能身份', '村民');
    _.set(nextData, '主角.当前阵营', '未知');
    _.set(nextData, '主角.是否完成宴前准备', false);
    _.set(nextData, '主角.是否已知晓身份', false);
    _.set(nextData, '主角.当前状态', '清醒');
    _.set(nextData, '宴会.本轮身份分配表', {});
    _.set(nextData, '宴会.身份分配锁定轮回编号', 0);
    _.set(nextData, '宴会.当前胜负状态', '未分出');
    _.set(nextData, '宴会.当前胜负说明', '');
    _.set(nextData, '宴会.夜间行动记录', 构建空夜间行动记录());

    (['女性角色', '男性角色'] as const).forEach(分组名 => {
      const group = _.get(nextData, `角色.${分组名}`, {}) as Record<string, Record<string, any>>;
      Object.entries(group).forEach(([角色名, detail]) => {
        if (!_.isObject(detail) || !_.has(detail, '本轮功能身份')) return;
        _.set(nextData, `角色.${分组名}.${角色名}.本轮功能身份`, '村民');
      });
    });
  }

  function 重置宴会即时状态(nextData: Record<string, any>) {
    _.set(nextData, '世界.是否处于宴会阶段', false);
    _.set(nextData, '宴会.当前宴会轮次', 0);
    _.set(nextData, '宴会.今日是否已召开宴会', false);
    _.set(nextData, '宴会.当前怀疑焦点', []);
    _.set(nextData, '宴会.今日异常事件列表', []);
    _.set(nextData, '宴会.身份分配锁定轮回编号', 0);
    _.set(nextData, '宴会.当前胜负状态', '未分出');
    _.set(nextData, '宴会.当前胜负说明', '');
    _.set(nextData, '宴会.夜间行动记录', 构建空夜间行动记录());
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
    设置轮回检查点在场角色(nextData, ['芹泽千枝实'], '学生公寓');
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
    const presentList = 归一化场景名单(_.get(stat, '场景.在场角色列表', []));
    const absentList = 归一化场景名单(_.get(stat, '场景.缺席角色列表', []));
    const protagonistState = String(_.get(stat, '主角.当前在场状态', '在场') || '在场').trim();
    const protagonistLocation = String(
      _.get(stat, '主角.当前所在地点', _.get(stat, '场景.当前地点', '未知')) || _.get(stat, '场景.当前地点', '未知'),
    ).trim();
    const sceneLocation = String(_.get(stat, '场景.当前地点', protagonistLocation) || protagonistLocation).trim();

    _.set(stat, '场景.在场角色列表', _.uniq(presentList.filter(name => name !== 'user')));
    _.set(
      stat,
      '场景.缺席角色列表',
      _.uniq(absentList.filter(name => name !== 'user')),
    );

    if (_.get(stat, '主角.当前在场状态') === '在场' && sceneLocation) {
      _.set(stat, '主角.当前所在地点', sceneLocation);
      return;
    }

    if (
      sceneLocation &&
      protagonistLocation &&
      protagonistLocation === sceneLocation &&
      !['被关押', '被压制'].includes(protagonistState)
    ) {
      _.set(stat, '主角.当前在场状态', '在场');
      _.set(stat, '主角.当前所在地点', sceneLocation);
      return;
    }

    if (presentList.includes('user') || protagonistState === '在场') {
      _.set(stat, '主角.当前在场状态', '在场');
      _.set(stat, '主角.当前所在地点', sceneLocation || protagonistLocation || '未知');
    }
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
      _.set(stat, '主角.本轮功能身份', '村民');
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

    const oldIdentity = 归一化主角功能身份(_.get(variablesBeforeUpdate, 'stat_data.主角.本轮功能身份', '村民'));
    const newIdentity = 归一化主角功能身份(_.get(stat, '主角.本轮功能身份', '村民'));
    const historyIdentity = 归一化主角功能身份(historyAnchor?.identity);
    const tableIdentity = 从身份分配表读取主角功能身份(stat);
    const lockedIdentity =
      sameLoop && oldKnown && oldIdentity !== '村民'
        ? oldIdentity
        : historyAnchor?.known && historyIdentity !== '村民'
          ? historyIdentity
          : '';
    const candidateIdentity = tableIdentity !== '村民' ? tableIdentity : newIdentity;
    const shouldKnowIdentityByStage =
      nextPrepared && candidateIdentity !== '村民' && 是否已进入主角身份可确认阶段(stat);
    const hasIdentityReveal =
      nextPrepared && candidateIdentity !== '村民' && 是否出现主角身份确认描写(latestAssistantMessageContent);
    const nextKnown = newKnown || lockedKnown || shouldKnowIdentityByStage || hasIdentityReveal;
    const nextIdentity = lockedIdentity || (nextKnown ? candidateIdentity : '村民');
    if (nextIdentity !== _.get(stat, '主角.本轮功能身份', '村民')) {
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
    let nextCamp = nextKnown && nextIdentity !== '村民' ? lockedCamp || newCamp : '未知';
    const derivedCamp = 根据主角功能身份推断阵营(nextIdentity);
    if (nextKnown && derivedCamp !== '未知') {
      nextCamp = derivedCamp;
    }
    if (!nextKnown || nextIdentity === '村民') {
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

    if (nextKnown && nextIdentity !== '村民') {
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
    const currentData = 标准化轮回变量(_.cloneDeep(_.get(currentVariables, 'stat_data', {})));
    const nextData = _.cloneDeep(初始轮回变量);

    写入永久记忆(nextData, _.cloneDeep(读取永久记忆(currentData)));
    _.set(nextData, '跨轮残留', _.cloneDeep(_.get(currentData, '跨轮残留', {})));
    应用可继承线索(currentData, nextData);
    _.set(nextData, '世界.当前轮回编号', 计算可信轮回编号(currentData) + 1);
    应用轮回检查点(currentData, nextData);
    清空新轮回身份信息(nextData);
    补全本轮身份分配({ stat_data: nextData });

    计算残留关系(currentData, nextData);
    应用角色轮回残响(nextData);
    return 标准化轮回变量(nextData);
  }

  function 修正本轮身份锁(
    variables: Record<string, any>,
    variablesBeforeUpdate: Record<string, any>,
    latestUserMessageContent = '',
  ) {
    if (是否显式轮回请求(latestUserMessageContent)) return;

    const stat = _.get(variables, 'stat_data', {}) as Record<string, any>;
    const previousStat = _.get(variablesBeforeUpdate, 'stat_data', {}) as Record<string, any>;
    const previousAssistantStat = 获取前一助手楼层变量() ?? {};
    const currentLoop = 获取当前轮回编号(stat);
    const participantNames = 获取本轮身份参与者(stat);
    const sourceStat = [previousAssistantStat, previousStat].find(candidate => {
      const candidateLoop = 获取当前轮回编号(candidate);
      if (candidateLoop !== currentLoop) return false;
      return 是否存在当前轮回锁定身份表(candidate);
    });
    if (!sourceStat) return;

    const sourceTable = 构建标准化身份分配表(sourceStat, 获取身份校验参与者(sourceStat));
    const sourceIdentity = 归一化主角功能身份(_.get(sourceTable, 主角身份分配表标准键, '村民'));
    const currentIdentity = 归一化主角功能身份(_.get(stat, '宴会.本轮身份分配表.主角', '村民'));
    const sourceLockLoop = 读取身份分配锁定轮回编号(sourceStat) || currentLoop;

    if (是否命中当前轮回身份锁(stat, participantNames) && currentIdentity === sourceIdentity) return;

    _.set(stat, '宴会.本轮身份分配表', sourceTable);
    _.set(stat, '宴会.身份分配锁定轮回编号', sourceLockLoop);
    同步身份分配表到角色(stat, sourceTable);
    按身份表同步主角字段(stat, sourceTable);
  }

  return {
    计算残留关系,
    应用可继承线索,
    应用角色轮回残响,
    应用当前场面锚点,
    清空新轮回身份信息,
    重置宴会即时状态,
    设置轮回检查点在场角色,
    应用轮回检查点,
    是否显式轮回请求,
    统计聊天中的显式轮回次数,
    归一化主角在场状态,
    提取statData,
    计算可信轮回编号,
    修正轮回编号,
    修正主角身份阵营,
    构建轮回重置变量,
    修正本轮身份锁,
  };
}
