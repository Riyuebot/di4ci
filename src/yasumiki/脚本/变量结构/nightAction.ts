import { 主角身份分配表标准键, 解析日期序号, 解析时刻分钟 } from './banquetIdentity';

const 夜间出事判定关键词 =
  /(昨夜|夜里|夜间|雾夜|首夜|天亮后|次日清晨|今早|出事|失踪|失联|神隐|消失|不见了|找不到了|没回来|人没了|被带走|被拖走|被拖离|拖离|拖走|倒下|昏迷|失去意识|隔离|看管|照看|拘束|关押|污染|标记|失控)/u;
const 历史回顾排除关键词 = /(八年前|十五年前|很久以前|以前|曾经|上次宴会|上一轮|往年|传说里|旧事)/u;
const 平安排除关键词 = /(平安|安然|无事|没事|还活着|还在场|没有出事|没有失踪)/u;
const 首日安全夜结果关键词 =
  /(昨夜|昨晚|首夜|昨夜起雾后|昨晚起雾后).*(出事|失踪|失联|神隐|消失|被带走|被拖走|被拖离|倒下|昏迷|失去意识|隔离|看管|照看|关押|拘束|污染|标记|失控)/u;

type NightActionDeps = {
  初始轮回变量: Record<string, any>;
  固定角色名列表: string[];
  固定女性角色名列表: string[];
  固定角色名集合: Set<string>;
  获取当前用户名称: () => string;
  获取角色详情: (
    stat: Record<string, any>,
    name: string,
  ) => {
    groupName: '女性角色' | '男性角色' | null;
    detail: Record<string, any> | null;
  };
  获取主角别名列表: () => string[];
  dedupeStringArray: (items: unknown[]) => string[];
  拆分叙事句子: (message: string) => string[];
  获取既有角色名集合: (variables: Record<string, any>) => string[];
  归一化陌生出事者文本: (text: string, validNames: Set<string>) => string;
  归一化女性夜间后果文本: (text: string, femaleNames: Set<string>) => string;
  归一化非死亡措辞: (text: string) => string;
  应用当前场面锚点: (currentData: Record<string, any>, nextData: Record<string, any>) => void;
  logDebug: (stage: string, extra?: Record<string, any>) => void;
  归一化主角功能身份: (value: unknown) => string;
  读取本轮身份分配表: (stat: Record<string, any>) => Record<string, string>;
  从身份分配表读取角色身份: (stat: Record<string, any>, name: string) => string;
  获取指定身份角色列表: (stat: Record<string, any>, identity: string) => string[];
  获取本轮身份参与者: (stat: Record<string, any>) => string[];
  获取可分配身份角色名: (stat: Record<string, any>) => string[];
  获取默认宴会参与角色列表: (stat: Record<string, any>) => string[];
  是否本轮身份分配表合法: (stat: Record<string, any>, participantNames: string[]) => boolean;
  是否已进入雾后次晨阶段: (stat: Record<string, any>) => boolean;
  计算稳定文本哈希: (text: string) => number;
  getCurrentChatIdSafe: () => string;
};

export function createNightActionApi({
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
  读取本轮身份分配表,
  从身份分配表读取角色身份,
  获取指定身份角色列表,
  获取本轮身份参与者,
  获取可分配身份角色名,
  获取默认宴会参与角色列表,
  是否本轮身份分配表合法,
  是否已进入雾后次晨阶段,
  计算稳定文本哈希,
  getCurrentChatIdSafe,
}: NightActionDeps) {
  function 读取夜间行动记录(stat: Record<string, any>) {
    const record = _.get(stat, '宴会.夜间行动记录', {}) as Record<string, any>;
    return {
      狼目标: String(_.get(record, '狼目标', '') ?? '').trim(),
      狼执行者: String(_.get(record, '狼执行者', '') ?? '').trim(),
      蛇查验目标: String(_.get(record, '蛇查验目标', '') ?? '').trim(),
      蛇查验结果: String(_.get(record, '蛇查验结果', '') ?? '').trim(),
      蜘蛛守护目标: String(_.get(record, '蜘蛛守护目标', '') ?? '').trim(),
      乌鸦验明对象: String(_.get(record, '乌鸦验明对象', '') ?? '').trim(),
      乌鸦验明结果: String(_.get(record, '乌鸦验明结果', '') ?? '').trim(),
    };
  }

  function 获取主角夜间行动目标字段(identity: string) {
    if (identity === '狼') return '狼目标' as const;
    if (identity === '蛇') return '蛇查验目标' as const;
    if (identity === '蜘蛛') return '蜘蛛守护目标' as const;
    return '' as const;
  }

  function 是否主角夜间行动待定(stat: Record<string, any>) {
    const protagonistIdentity = 归一化主角功能身份(_.get(stat, '主角.本轮功能身份', '村民'));
    const protagonistKnown = Boolean(_.get(stat, '主角.是否已知晓身份', false));
    if (!protagonistKnown) return false;

    const actionField = 获取主角夜间行动目标字段(protagonistIdentity);
    if (!actionField) return false;

    const currentSegment = String(_.get(stat, '世界.当前时间段', '') ?? '').trim();
    const currentMinute = 解析时刻分钟(_.get(stat, '世界.当前时刻', ''));
    const isNightWindow =
      ['傍晚', '夜间', '雾夜', '深夜'].includes(currentSegment) ||
      (currentMinute !== null && (currentMinute >= 18 * 60 || currentMinute <= 4 * 60));
    if (!isNightWindow && !_.get(stat, '世界.是否起雾', false)) return false;

    const nightRecord = 读取夜间行动记录(stat) as Record<string, string>;
    return !String(nightRecord[actionField] ?? '').trim();
  }

  function 写入夜间行动记录(
    stat: Record<string, any>,
    patch: Partial<ReturnType<typeof 读取夜间行动记录>>,
  ) {
    _.set(stat, '宴会.夜间行动记录', {
      ...读取夜间行动记录(stat),
      ...patch,
    });
  }

  function 是否仍处于首日未起雾阶段(stat: Record<string, any>) {
    const currentDate = 解析日期序号(_.get(stat, '世界.当前日期', ''));
    if (!currentDate || currentDate.serial !== 512) return false;
    return !_.get(stat, '世界.是否起雾', false);
  }

  function 从文本提取命中角色名(text: string) {
    const normalized = String(text ?? '').trim();
    if (!normalized) return [];
    return 固定角色名列表.filter(name => normalized.includes(name));
  }

  function 恢复角色到首日初始状态(stat: Record<string, any>, name: string) {
    const { groupName: currentGroupName, detail: currentDetail } = 获取角色详情(stat, name);
    const { groupName: initialGroupName, detail: initialDetail } = 获取角色详情(初始轮回变量, name);
    if (
      !currentGroupName ||
      !initialGroupName ||
      currentGroupName !== initialGroupName ||
      !_.isObject(currentDetail) ||
      !_.isObject(initialDetail)
    ) {
      return;
    }

    _.set(currentDetail, '当前所在地点', _.get(initialDetail, '当前所在地点', _.get(currentDetail, '当前所在地点', '')));
    _.set(currentDetail, '当前在场状态', _.get(initialDetail, '当前在场状态', '离场'));
    _.set(currentDetail, '本轮功能身份', '村民');
    if (_.has(currentDetail, '当前心里话')) {
      _.set(currentDetail, '当前心里话', '');
    }
  }

  function 修正首日未起雾安全约束(variables: Record<string, any>) {
    const stat = _.get(variables, 'stat_data', {}) as Record<string, any>;
    if (!是否仍处于首日未起雾阶段(stat)) return;

    const rawClues = dedupeStringArray(_.get(stat, '线索与真相.已解锁线索列表', []));
    const rawAbnormalEvents = dedupeStringArray(_.get(stat, '宴会.今日异常事件列表', []));
    const removedTexts = [...rawClues, ...rawAbnormalEvents].filter(text => 首日安全夜结果关键词.test(String(text ?? '').trim()));
    const removedNames = _.uniq(removedTexts.flatMap(text => 从文本提取命中角色名(String(text ?? '').trim())));

    _.set(
      stat,
      '线索与真相.已解锁线索列表',
      rawClues.filter(text => !首日安全夜结果关键词.test(String(text ?? '').trim())),
    );
    _.set(
      stat,
      '宴会.今日异常事件列表',
      rawAbnormalEvents.filter(text => !首日安全夜结果关键词.test(String(text ?? '').trim())),
    );

    写入夜间行动记录(stat, {
      狼目标: '',
      狼执行者: '',
      蛇查验目标: '',
      蛇查验结果: '',
      蜘蛛守护目标: '',
      乌鸦验明对象: '',
      乌鸦验明结果: '',
    });

    _.set(stat, '宴会.当前宴会轮次', 0);
    _.set(stat, '宴会.今日是否已召开宴会', false);
    _.set(stat, '宴会.本轮身份分配表', {});
    _.set(stat, '宴会.身份分配锁定轮回编号', 0);
    _.set(stat, '场景.当前宴会参与角色列表', []);
    _.set(stat, '主角.本轮功能身份', '村民');
    _.set(stat, '主角.当前阵营', '未知');
    _.set(stat, '主角.是否已知晓身份', false);

    (['女性角色', '男性角色'] as const).forEach(groupName => {
      const group = _.get(stat, `角色.${groupName}`, {}) as Record<string, Record<string, any>>;
      Object.values(group).forEach(detail => {
        if (!_.isObject(detail) || !_.has(detail, '本轮功能身份')) return;
        _.set(detail, '本轮功能身份', '村民');
      });
    });

    if (removedNames.length === 0) return;

    const currentPresent = dedupeStringArray(_.get(stat, '场景.在场角色列表', []));
    const currentAbsent = dedupeStringArray(_.get(stat, '场景.缺席角色列表', []));
    const initialPresent = new Set(dedupeStringArray(_.get(初始轮回变量, '场景.在场角色列表', [])));
    const initialAbsent = new Set(dedupeStringArray(_.get(初始轮回变量, '场景.缺席角色列表', [])));

    removedNames.forEach(name => {
      恢复角色到首日初始状态(stat, name);
      _.pull(currentPresent, name);
      _.pull(currentAbsent, name);
      if (initialPresent.has(name)) {
        currentPresent.push(name);
      } else if (initialAbsent.has(name) || !currentAbsent.includes(name)) {
        currentAbsent.push(name);
      }
    });

    _.set(stat, '场景.在场角色列表', _.uniq(currentPresent));
    _.set(stat, '场景.缺席角色列表', _.uniq(currentAbsent));
  }

  function 提取句子命中的角色名(sentence: string, candidates: string[]) {
    const normalizedSentence = String(sentence ?? '').replace(/\s+/g, '');
    if (!normalizedSentence) return '';
    return candidates.find(name => normalizedSentence.includes(name)) ?? '';
  }

  function 从文本集合里提取命中角色名(texts: string[], candidates: string[]) {
    for (const text of texts) {
      const matched = 提取句子命中的角色名(text, candidates);
      if (matched) return matched;
    }
    return '';
  }

  function 获取默认狼执行者(stat: Record<string, any>) {
    const wolves = 获取指定身份角色列表(stat, '狼');
    if (wolves.length === 0) return '';
    if (归一化主角功能身份(_.get(stat, '主角.本轮功能身份', '村民')) === '狼' && wolves.includes(主角身份分配表标准键)) {
      return 主角身份分配表标准键;
    }
    return wolves.find(name => name !== 主角身份分配表标准键) ?? wolves[0] ?? '';
  }

  function 计算验明结果(stat: Record<string, any>, name: string) {
    if (!name) return '';
    return 从身份分配表读取角色身份(stat, name) === '狼' ? '是狼' : '不是狼';
  }

  function 归一化身份参与者名称(name: string) {
    return name === 主角身份分配表标准键 ? 'user' : name;
  }

  function 获取可作为夜间目标的角色列表(
    stat: Record<string, any>,
    options: {
      purpose: 'wolf' | 'snake' | 'spider';
      excludeNames?: string[];
    },
  ) {
    const excludeSet = new Set(
      [
        ...获取主角别名列表(),
        ...(options.excludeNames ?? []),
      ]
        .map(name => 归一化身份参与者名称(String(name ?? '').trim()))
        .filter(Boolean),
    );
    const participantNames = 获取本轮身份参与者(stat)
      .map(name => 归一化身份参与者名称(name))
      .filter(name => name !== 'user')
      .filter(name => !excludeSet.has(name));

    return participantNames.filter(name => {
      const { detail } = 获取角色详情(stat, name);
      if (!_.isObject(detail)) return false;
      const currentStatus = String(_.get(detail, '当前在场状态', '离场') ?? '离场').trim();
      if (['被隔离', '被关押', '不可见', '神隐中'].includes(currentStatus)) return false;
      const identity = 从身份分配表读取角色身份(stat, name);
      if (options.purpose === 'wolf') {
        return !['狼', '貉'].includes(identity);
      }
      if (options.purpose === 'spider') {
        return !['狼', '貉'].includes(identity);
      }
      return true;
    });
  }

  function 选择稳定夜间目标(
    stat: Record<string, any>,
    options: {
      purpose: 'wolf' | 'snake' | 'spider';
      excludeNames?: string[];
    },
  ) {
    const candidates = 获取可作为夜间目标的角色列表(stat, options);
    if (candidates.length === 0) return '';

    const loopNumber = Number(_.get(stat, '世界.当前轮回编号', 1)) || 1;
    const currentDate = String(_.get(stat, '世界.当前日期', '') ?? '').trim();
    const currentChatId = getCurrentChatIdSafe();
    const seed = `${options.purpose}|${currentChatId}|${loopNumber}|${currentDate}|${candidates.join('|')}`;
    return candidates[计算稳定文本哈希(seed) % candidates.length] ?? '';
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

  function 是否应解析夜间行动记录(stat: Record<string, any>, latestMessageContent = '') {
    const hasReachedNextMorning = 是否已进入雾后次晨阶段(stat);
    if (!_.get(stat, '世界.是否起雾', false) && !hasReachedNextMorning) return false;
    if (是否仍处于首日未起雾阶段(stat)) return false;

    const currentSegment = String(_.get(stat, '世界.当前时间段', '') ?? '').trim();
    const currentMinute = 解析时刻分钟(_.get(stat, '世界.当前时刻', ''));
    const isNightWindow =
      ['傍晚', '夜间', '雾夜', '深夜'].includes(currentSegment) ||
      (currentMinute !== null && (currentMinute >= 18 * 60 || currentMinute <= 4 * 60));

    if (isNightWindow) return true;
    if (hasReachedNextMorning) return true;

    const text = String(latestMessageContent ?? '').trim();
    return /(查验|查了|守护|护住|盯上|盯住|动手|下手|狼.*商量|狼.*决定|验人|验出)/u.test(text);
  }

  function 修正夜间行动记录(
    variables: Record<string, any>,
    latestMessageContent = '',
    latestUserMessageContent = '',
  ) {
    const stat = _.get(variables, 'stat_data', {}) as Record<string, any>;
    if (!是否应解析夜间行动记录(stat, latestMessageContent)) return;
    const assignmentTable = 读取本轮身份分配表(stat);
    const participantNames = 获取本轮身份参与者(stat);
    if (Object.keys(assignmentTable).length === 0 || !是否本轮身份分配表合法(stat, participantNames)) {
      写入夜间行动记录(stat, {});
      return;
    }

    const actionSourceText = [latestUserMessageContent, latestMessageContent].filter(Boolean).join('\n');
    const sentences = 拆分叙事句子(actionSourceText);
    const candidateNames = 获取可分配身份角色名(stat);
    const eventTexts = 提取夜间出事文本集合(stat, latestMessageContent);
    const currentRecord = 读取夜间行动记录(stat);
    const nextRecord = { ...currentRecord };

    if (!nextRecord.狼目标) {
      const wolfSentence = sentences.find(sentence => /(盯上|盯住|选中|决定.*(?:动手|下手|处理)|今晚.*(?:找|抓|处理)|狼.*(?:商量|决定|选))/u.test(sentence));
      nextRecord.狼目标 =
        提取句子命中的角色名(wolfSentence ?? '', candidateNames) || 从文本集合里提取命中角色名(eventTexts, candidateNames);
    }
    if (nextRecord.狼目标 && !nextRecord.狼执行者) {
      nextRecord.狼执行者 = 获取默认狼执行者(stat);
    }

    if (!nextRecord.蛇查验目标) {
      const snakeSentence = sentences.find(sentence => /(查验|查了|去查|验人|验出|不是狼|是狼)/u.test(sentence));
      nextRecord.蛇查验目标 = 提取句子命中的角色名(snakeSentence ?? '', candidateNames);
    }
    if (nextRecord.蛇查验目标 && !nextRecord.蛇查验结果) {
      nextRecord.蛇查验结果 = 计算验明结果(stat, nextRecord.蛇查验目标);
    }

    if (!nextRecord.蜘蛛守护目标) {
      const spiderSentence = sentences.find(sentence => /(守护|守住|护住|护了一夜|保住)/u.test(sentence));
      nextRecord.蜘蛛守护目标 = 提取句子命中的角色名(spiderSentence ?? '', candidateNames);
    }

    if (!nextRecord.乌鸦验明对象) {
      const crowSentence = sentences.find(sentence => /(验明|验出|确认.*是不是狼|知道.*是不是狼|到底是不是狼)/u.test(sentence));
      nextRecord.乌鸦验明对象 = 提取句子命中的角色名(crowSentence ?? '', 固定角色名列表);
    }
    if (nextRecord.乌鸦验明对象 && !nextRecord.乌鸦验明结果) {
      nextRecord.乌鸦验明结果 = 计算验明结果(stat, nextRecord.乌鸦验明对象);
    }

    const hasReachedNextMorning = 是否已进入雾后次晨阶段(stat);
    if (hasReachedNextMorning) {
      const wolfActors = 获取指定身份角色列表(stat, '狼').map(name => 归一化身份参与者名称(name));
      const snakeActors = 获取指定身份角色列表(stat, '蛇').map(name => 归一化身份参与者名称(name));
      const spiderActors = 获取指定身份角色列表(stat, '蜘蛛').map(name => 归一化身份参与者名称(name));

      if (!nextRecord.狼目标 && wolfActors.length > 0) {
        nextRecord.狼目标 =
          从文本集合里提取命中角色名(eventTexts, candidateNames) ||
          选择稳定夜间目标(stat, {
            purpose: 'wolf',
            excludeNames: wolfActors,
          });
      }
      if (nextRecord.狼目标 && !nextRecord.狼执行者) {
        nextRecord.狼执行者 = 获取默认狼执行者(stat);
      }

      if (!nextRecord.蛇查验目标 && snakeActors.length > 0) {
        nextRecord.蛇查验目标 = 选择稳定夜间目标(stat, {
          purpose: 'snake',
          excludeNames: snakeActors,
        });
      }
      if (nextRecord.蛇查验目标 && !nextRecord.蛇查验结果) {
        nextRecord.蛇查验结果 = 计算验明结果(stat, nextRecord.蛇查验目标);
      }

      if (!nextRecord.蜘蛛守护目标 && spiderActors.length > 0) {
        nextRecord.蜘蛛守护目标 = 选择稳定夜间目标(stat, {
          purpose: 'spider',
          excludeNames: [...spiderActors, nextRecord.狼目标].filter(Boolean),
        });
      }
    }

    if (!nextRecord.狼目标) {
      const authoritativeEvent = 生成首夜兜底异常事件(stat);
      const fallbackWolfTarget = 从文本集合里提取命中角色名(
        [...eventTexts, authoritativeEvent].filter(Boolean),
        固定角色名列表,
      );
      if (fallbackWolfTarget) {
        nextRecord.狼目标 = fallbackWolfTarget;
      }
    }
    if (nextRecord.狼目标 && !nextRecord.狼执行者) {
      nextRecord.狼执行者 = 获取默认狼执行者(stat);
    }

    if (_.isEqual(currentRecord, nextRecord)) return;
    写入夜间行动记录(stat, nextRecord);
  }

  function 回滚未决夜间行动推进(
    variables: Record<string, any>,
    latestMessageContent = '',
    variablesBeforeUpdate?: Record<string, any>,
  ) {
    const stat = _.get(variables, 'stat_data', {}) as Record<string, any>;
    const previousStat = variablesBeforeUpdate ? (_.get(variablesBeforeUpdate, 'stat_data', {}) as Record<string, any>) : {};
    if (_.isEmpty(previousStat)) return;
    if (!是否主角夜间行动待定(stat) || !是否主角夜间行动待定(previousStat)) return;

    const narrative = String(latestMessageContent ?? '').trim();
    if (!narrative) return;

    const isTryingToAdvancePastNight =
      /(天亮|清晨|今早|次日|第二天|早晨|敲门|有人敲门|门外|香织|食堂|昨夜到底谁出了事|开宴|宴会|桥本|失踪|出事)/u.test(
        narrative,
      );
    if (!isTryingToAdvancePastNight) return;

    应用当前场面锚点(previousStat, stat);
    logDebug('已阻止未决夜间行动直接跳到次晨', {
      role: _.get(stat, '主角.本轮功能身份'),
      date: _.get(stat, '世界.当前日期'),
      time: _.get(stat, '世界.当前时刻'),
      location: _.get(stat, '场景.当前地点'),
    });
  }

  function 推断角色夜间处理状态(groupName: '女性角色' | '男性角色', text: string) {
    const normalized = String(text ?? '').trim();
    if (!normalized || 平安排除关键词.test(normalized)) return null;

    if (groupName === '女性角色') {
      if (/神隐|失踪|失联|消失|被带走|被拖走|被拖离|隔离|看管|照看|污染|标记|失控|倒下|昏迷|失去意识|出事/u.test(normalized)) {
        return '被隔离';
      }
      return null;
    }

    if (/关押|拘束|绑住|扣住|压住|看管/u.test(normalized)) return '被关押';
    if (/神隐|失踪|失联|消失|被带走|被拖走|被拖离/u.test(normalized)) return '神隐中';
    if (/倒下|昏迷|失去意识|出事/u.test(normalized)) return '被关押';
    return null;
  }

  function 获取首夜兜底异常事件候选角色(stat: Record<string, any>) {
    const male = _.get(stat, '角色.男性角色', {}) as Record<string, Record<string, any>>;
    const excluded = new Set<string>(['user', '主角', '你', 获取当前用户名称(), ...[]]);
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

    return [];
  }

  function 获取首夜兜底保底角色列表(stat: Record<string, any>) {
    const male = new Set(
      Object.keys(_.get(stat, '角色.男性角色', {}) as Record<string, Record<string, any>>)
        .map(name => String(name ?? '').trim())
        .filter(name => Boolean(name) && 固定角色名集合.has(name)),
    );
    const excluded = new Set<string>([...获取主角别名列表()]);
    return 固定角色名列表.filter(name => male.has(name) && !excluded.has(name));
  }

  function 生成首夜兜底异常事件(stat: Record<string, any>) {
    if (!是否已进入雾后次晨阶段(stat)) return '';

    const nightRecord = 读取夜间行动记录(stat);
    if (nightRecord.狼目标) {
      if (nightRecord.蜘蛛守护目标 && nightRecord.蜘蛛守护目标 === nightRecord.狼目标) {
        return `${nightRecord.狼目标}在昨夜被狼盯上，但被人护住，天亮后人还在。`;
      }

      const targetName = nightRecord.狼目标;
      const isMale = _.has(_.get(stat, '角色.男性角色', {}), targetName);
      return isMale
        ? `${targetName}在昨夜起雾后失踪，直到天亮也没有回来。`
        : `${targetName}在昨夜起雾后倒下，被人带去隔离看管。`;
    }

    const protagonistIdentity = 归一化主角功能身份(_.get(stat, '主角.本轮功能身份', '村民'));
    const protagonistKnown = Boolean(_.get(stat, '主角.是否已知晓身份', false));
    if (protagonistKnown && ['狼', '蛇', '蜘蛛'].includes(protagonistIdentity)) {
      return '';
    }

    const abnormalEvents = dedupeStringArray(_.get(stat, '宴会.今日异常事件列表', []));
    if (abnormalEvents.length > 0) return '';

    const candidates = 获取首夜兜底异常事件候选角色(stat);
    const fallbackCandidates = 获取首夜兜底保底角色列表(stat);
    const finalCandidates = candidates.length > 0 ? candidates : fallbackCandidates;
    if (finalCandidates.length === 0) return '';

    const loopNumber = Number(_.get(stat, '世界.当前轮回编号', 1)) || 1;
    const currentDate = String(_.get(stat, '世界.当前日期', '') ?? '').trim();
    const currentChatId = getCurrentChatIdSafe();
    const seed = `${currentChatId}|${loopNumber}|${currentDate}|${finalCandidates.join('|')}`;
    const victimName = finalCandidates[计算稳定文本哈希(seed) % finalCandidates.length];
    const isMale = _.has(_.get(stat, '角色.男性角色', {}), victimName);

    return isMale
      ? `${victimName}在昨夜起雾后失踪，直到天亮也没有回来。`
      : `${victimName}在昨夜起雾后倒下，被人带去隔离看管。`;
  }

  function 获取权威夜间异常事件文本集合(stat: Record<string, any>) {
    return dedupeStringArray(_.get(stat, '宴会.今日异常事件列表', []))
      .map(text => String(text ?? '').trim())
      .filter(Boolean)
      .filter(text => 夜间出事判定关键词.test(text))
      .filter(text => !历史回顾排除关键词.test(text));
  }

  function 同步夜间异常事件到事件列表(stat: Record<string, any>, eventTexts: string[]) {
    const currentEvents = dedupeStringArray(_.get(stat, '宴会.今日异常事件列表', []));
    const authoritativeEvent = 生成首夜兜底异常事件(stat);
    if (authoritativeEvent) {
      _.set(stat, '宴会.今日异常事件列表', [authoritativeEvent]);
      return;
    }

    const validNames = new Set(固定角色名列表);
    const normalizedEvents = dedupeStringArray(eventTexts)
      .map(text => 归一化陌生出事者文本(String(text ?? '').trim(), validNames))
      .map(text => 归一化女性夜间后果文本(text, new Set(固定女性角色名列表)))
      .map(text => 归一化非死亡措辞(text))
      .filter(Boolean)
      .filter(text => 夜间出事判定关键词.test(text))
      .filter(text => !历史回顾排除关键词.test(text));

    if (normalizedEvents.length === 0) return;

    _.set(stat, '宴会.今日异常事件列表', dedupeStringArray([...currentEvents, ...normalizedEvents]));
  }

  function 是否应解析夜间处理结果(stat: Record<string, any>, latestMessageContent = '') {
    if (!是否已进入雾后次晨阶段(stat)) return false;
    if (是否仍处于首日未起雾阶段(stat)) return false;

    const text = String(latestMessageContent ?? '').trim();
    if (夜间出事判定关键词.test(text) && !历史回顾排除关键词.test(text)) return true;

    const events = dedupeStringArray(_.get(stat, '宴会.今日异常事件列表', []));
    return events.some(text => 夜间出事判定关键词.test(text) && !历史回顾排除关键词.test(text));
  }

  function 修正夜间处理状态(variables: Record<string, any>, latestMessageContent = '') {
    const stat = _.get(variables, 'stat_data', {}) as Record<string, any>;
    if (!是否已进入雾后次晨阶段(stat)) return;
    if (!是否应解析夜间处理结果(stat, latestMessageContent)) return;

    const sceneLocation = String(_.get(stat, '场景.当前地点', '未知') ?? '未知').trim();
    const abnormalEvents = 获取权威夜间异常事件文本集合(stat);
    let eventTexts = [...abnormalEvents];
    if (eventTexts.length === 0) {
      const fallbackEvent = 生成首夜兜底异常事件(stat);
      if (fallbackEvent) {
        _.set(stat, '宴会.今日异常事件列表', _.uniq([...abnormalEvents, fallbackEvent]));
        eventTexts = [fallbackEvent];
      }
    }
    同步夜间异常事件到事件列表(stat, eventTexts);
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

  return {
    读取夜间行动记录,
    获取主角夜间行动目标字段,
    是否主角夜间行动待定,
    写入夜间行动记录,
    修正首日未起雾安全约束,
    修正夜间行动记录,
    回滚未决夜间行动推进,
    修正夜间处理状态,
    是否应解析夜间行动记录,
    是否应解析夜间处理结果,
  };
}
