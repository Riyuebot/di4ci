const 在场状态值 = ['在场', '离场', '独处中', '被关押', '被隔离', '宴会中', '不可见', '神隐中'] as const;
const 当前时间段值 = ['清晨', '白天', '傍晚', '夜间', '雾夜'] as const;
const 当前阵营值 = ['未知', '人类', '狼侧'] as const;
const 主角当前状态值 = ['清醒', '睡梦中', '在场', '离场', '被关押', '被压制'] as const;

const 地点别名映射: Record<string, string> = {
  宿舍: '学生公寓',
  学生宿舍: '学生公寓',
  公寓: '学生公寓',
  宿舍楼: '学生公寓',
  村食堂: '村中食堂',
  食堂: '村中食堂',
  村里食堂: '村中食堂',
  回末家: '回末住处',
  回末宅: '回末住处',
  回末宅邸: '回末住处',
  集会所: '集会堂',
  村公所: '集会堂',
  村中小道: '村中',
  村落小道: '村中',
  村路: '村中',
  河滩: '皿永滩',
  皿永: '皿永滩',
  皿永河滩: '皿永滩',
  皿永方向河滩: '皿永滩',
  洋馆别馆: '洋馆',
  能里别馆: '洋馆',
  便利店门口: '便利店',
  休水村落路口: '休水村落路口',
  休水村落小道: '休水村落小道',
};

const 功能身份别名映射: Record<string, string> = {
  未揭晓: '未分配',
  未公开: '未分配',
  未确认: '未分配',
  未知身份: '未分配',
  无身份: '未分配',
  平民: '未分配',
  普通人: '未分配',
  普通平民: '未分配',
  普通村民: '未分配',
  村民: '未分配',
  人类: '未分配',
  火柴人: '未分配',
  猿猴: '猿',
  蛛: '蜘蛛',
  蜘蛛神: '蜘蛛',
  乌鸦神: '乌鸦',
  狼神: '狼',
  蛇神: '蛇',
};

const 对user态度别名映射: Record<string, string> = {
  观察中: '观察',
  试探: '审视',
  戒备: '警惕',
  烦躁: '不耐烦',
  仇视: '敌意',
  敌视: '敌意',
  敌对: '敌意',
  冷淡: '观察',
};

const 美辻轮回干涉状态别名映射: Record<string, string> = {
  未知: '未确认',
  尚未确认: '未确认',
  没有干涉: '未确认',
  已干涉: '已介入',
  干涉中: '已介入',
};

export function 归一化文本(value: unknown) {
  return String(value ?? '').trim();
}

function 创建枚举标准化器<T extends readonly [string, ...string[]]>(
  选项: T,
  默认值: T[number],
  别名映射: Record<string, T[number]> = {},
) {
  return z
    .string()
    .transform(input => {
      const 文本 = 归一化文本(input);
      if ((选项 as readonly string[]).includes(文本)) {
        return 文本 as T[number];
      }
      return 别名映射[文本] ?? 默认值;
    })
    .prefault(默认值);
}

function 创建字符串标准化器(默认值: string, 别名映射: Record<string, string> = {}) {
  return z
    .string()
    .transform(input => {
      const 文本 = 归一化文本(input);
      return (别名映射[文本] ?? 文本) || 默认值;
    })
    .prefault(默认值);
}

function 创建时间标准化器(默认值 = '09:00') {
  return z
    .string()
    .transform(input => {
      const 文本 = 归一化文本(input).replace('：', ':');
      const matched = 文本.match(/^(\d{1,2}):(\d{2})$/);
      if (!matched) {
        return 文本 || 默认值;
      }
      const hour = _.clamp(Number(matched[1]), 0, 23);
      const minute = _.clamp(Number(matched[2]), 0, 59);
      return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    })
    .prefault(默认值);
}

function 创建日期标准化器(默认值: string) {
  return z
    .string()
    .transform(input => {
      const 文本 = 归一化文本(input);
      const 月日格式 = 文本.match(/^(\d{1,2})月(\d{1,2})日$/);
      if (月日格式) {
        const month = _.clamp(Number(月日格式[1]), 1, 12);
        const day = _.clamp(Number(月日格式[2]), 1, 31);
        return `${month}月${day}日`;
      }

      const iso格式 = 文本.match(/^(?:\d{4})-(\d{1,2})-(\d{1,2})$/);
      if (iso格式) {
        const month = _.clamp(Number(iso格式[1]), 1, 12);
        const day = _.clamp(Number(iso格式[2]), 1, 31);
        return `${month}月${day}日`;
      }

      return 默认值;
    })
    .prefault(默认值);
}

export const 非负整数 = (初始值: number) =>
  z.coerce
    .number()
    .transform(value => Math.max(初始值 === 0 ? 0 : 1, Math.floor(value)))
    .prefault(初始值);

export const 去重字符串列表 = () =>
  z
    .array(z.string())
    .transform(values => _.uniq(values.map(value => 归一化文本(value)).filter(Boolean)))
    .prefault([]);

export const 创建在场状态 = (初始值: (typeof 在场状态值)[number] = '在场') =>
  创建枚举标准化器(在场状态值, 初始值, {
    缺席: '离场',
    不在场: '离场',
    退场: '离场',
    独处: '独处中',
    单独相处: '独处中',
    被看押: '被关押',
    看押中: '被关押',
    被囚禁: '被关押',
    囚禁: '被关押',
    隔离中: '被隔离',
    隐身: '不可见',
    隐匿: '不可见',
    神隐: '神隐中',
    潜伏中: '神隐中',
  });
export const 在场状态 = 创建在场状态();

export const 创建角色功能身份 = (初始值 = '未分配') => 创建字符串标准化器(初始值, 功能身份别名映射);
export const 角色功能身份 = 创建角色功能身份();

export const 数值百分比 = (初始值: number) =>
  z.coerce
    .number()
    .transform(value => _.clamp(value, 0, 100))
    .prefault(初始值);

function 读取兼容关系数值(
  data: Record<string, any>,
  主字段名: string,
  默认值: number,
  兼容字段名?: string,
  兼容默认值 = 默认值,
) {
  const 主值 = Number(_.get(data, 主字段名, 默认值));
  const 归一主值 = Number.isFinite(主值) ? _.clamp(主值, 0, 100) : 默认值;
  if (!兼容字段名) return 归一主值;

  const 兼容值 = Number(_.get(data, 兼容字段名, 兼容默认值));
  const 归一兼容值 = Number.isFinite(兼容值) ? _.clamp(兼容值, 0, 100) : 兼容默认值;
  if (归一主值 !== 默认值) return 归一主值;
  if (归一兼容值 !== 兼容默认值) return 归一兼容值;
  return 归一主值;
}

function 统一女性关系字段<T extends Record<string, any>>(
  data: T,
  options: {
    信任默认值: number;
    欲望默认值: number;
    信任兼容字段?: string;
    欲望兼容字段?: string;
    信任兼容默认值?: number;
    欲望兼容默认值?: number;
    移除字段?: string[];
  },
) {
  return {
    ..._.omit(data, options.移除字段 ?? []),
    信任: 读取兼容关系数值(
      data,
      '信任',
      options.信任默认值,
      options.信任兼容字段,
      options.信任兼容默认值 ?? options.信任默认值,
    ),
    欲望: 读取兼容关系数值(
      data,
      '欲望',
      options.欲望默认值,
      options.欲望兼容字段,
      options.欲望兼容默认值 ?? options.欲望默认值,
    ),
  };
}

export const 当前路线 = 创建字符串标准化器('未定', {
  未开启: '未定',
  未确认: '未定',
  未知路线: '未定',
  未知: '未定',
});

export const 当前时间段 = 创建枚举标准化器(当前时间段值, '清晨', {
  凌晨: '清晨',
  上午: '白天',
  中午: '白天',
  午后: '白天',
  黄昏: '傍晚',
  夜晚: '夜间',
  深夜: '夜间',
  入夜: '夜间',
  浓雾夜: '雾夜',
});

export const 当前阵营 = 创建枚举标准化器(当前阵营值, '未知', {
  人类侧: '人类',
  村民侧: '人类',
  狼方: '狼侧',
  狼阵营: '狼侧',
  未确认: '未知',
  中立: '未知',
});

export const 主角当前状态 = 创建枚举标准化器(主角当前状态值, '清醒', {
  清醒中: '清醒',
  睡着: '睡梦中',
  沉睡: '睡梦中',
  被制服: '被压制',
  被控制: '被压制',
  行动受限: '被压制',
  受压制: '被压制',
  被按住: '被压制',
  被拘束: '被关押',
});

export const 标准地点 = (初始值: string) =>
  z
    .string()
    .transform(input => {
      const 文本 = 归一化文本(input);
      const 归一值 = (地点别名映射[文本] ?? 文本) || 初始值;
      return Object.values(地点别名映射).includes(归一值) ? 归一值 : 初始值;
    })
    .prefault(初始值);
export const 标准态度 = (初始值 = '观察') => 创建字符串标准化器(初始值, 对user态度别名映射);
export const 标准轮回干涉状态 = (初始值 = '未确认') => 创建字符串标准化器(初始值, 美辻轮回干涉状态别名映射);

export const 核心女角色结构 = z.object({
  当前所在地点: 标准地点('学生公寓'),
  当前在场状态: 创建在场状态(),
  本轮功能身份: 创建角色功能身份(),
  是否已独处: z.boolean().prefault(false),
  是否已亲密接触: z.boolean().prefault(false),
  是否已发生性关系: z.boolean().prefault(false),
});

export const 轻量女角色结构 = z.object({
  当前所在地点: 标准地点('村中食堂'),
  当前在场状态: 创建在场状态(),
  本轮功能身份: 创建角色功能身份(),
  好感: 数值百分比(0),
});

export const 关键男角色结构 = z.object({
  当前所在地点: 标准地点('村中食堂'),
  当前在场状态: 创建在场状态(),
  本轮功能身份: 创建角色功能身份(),
  对user态度: 标准态度('观察'),
  是否掌握关键情报: z.boolean().prefault(false),
});

export const SchemaObject = z.object({
  世界: z
    .object({
      当前路线,
      当前章节: 创建字符串标准化器('序章'),
      当前日期: 创建日期标准化器('5月11日'),
      当前时刻: 创建时间标准化器('09:00'),
      当前时间段,
      当前轮回编号: 非负整数(1),
      是否起雾: z.boolean().prefault(false),
      是否处于宴会阶段: z.boolean().prefault(false),
      主线层级: z.coerce
        .number()
        .transform(value => _.clamp(Math.floor(value), 1, 10))
        .prefault(1),
    })
    .prefault({}),

  场景: z
    .object({
      当前地点: 标准地点('学生公寓'),
      在场角色列表: 去重字符串列表(),
      缺席角色列表: 去重字符串列表(),
      当前宴会参与角色列表: 去重字符串列表(),
    })
    .prefault({}),

  宴会: z
    .object({
      当前宴会轮次: 非负整数(0),
      今日是否已召开宴会: z.boolean().prefault(false),
      当前怀疑焦点: 去重字符串列表(),
      今日异常事件列表: 去重字符串列表(),
      本轮身份分配表: z.record(z.string(), z.string()).prefault({}),
    })
    .prefault({}),

  主角: z
    .object({
      当前所在地点: 标准地点('学生公寓'),
      当前在场状态: 创建在场状态('在场'),
      本轮功能身份: 创建角色功能身份('未分配'),
      当前阵营,
      当前状态: 主角当前状态,
      是否完成宴前准备: z.boolean().prefault(false),
      是否已知晓身份: z.boolean().prefault(false),
    })
    .prefault({}),

  角色: z
    .object({
      女性角色: z
        .object({
          芹泽千枝实: 核心女角色结构
            .extend({
              当前所在地点: 标准地点('学生公寓'),
              当前心里话: 创建字符串标准化器(''),
              好感: 数值百分比(10),
              信任: 数值百分比(5),
              欲望: 数值百分比(0),
            })
            .prefault({}),

          回末李花子: 核心女角色结构
            .extend({
              当前所在地点: 标准地点('回末住处'),
              当前心里话: 创建字符串标准化器(''),
              好感: 数值百分比(10),
              信任: 数值百分比(10),
              欲望: 数值百分比(5),
              信赖: 数值百分比(10),
              色诱度: 数值百分比(5),
            })
            .transform(data =>
              统一女性关系字段(data, {
                信任默认值: 10,
                欲望默认值: 5,
                信任兼容字段: '信赖',
                欲望兼容字段: '色诱度',
                移除字段: ['信赖', '色诱度'],
              }),
            )
            .prefault({}),

          马宫久子: 核心女角色结构
            .extend({
              当前所在地点: 标准地点('村中食堂'),
              当前心里话: 创建字符串标准化器(''),
              好感: 数值百分比(0),
              信任: 数值百分比(10),
              欲望: 数值百分比(5),
              合作度: 数值百分比(10),
              色气值: 数值百分比(5),
            })
            .transform(data =>
              统一女性关系字段(data, {
                信任默认值: 10,
                欲望默认值: 5,
                信任兼容字段: '合作度',
                欲望兼容字段: '色气值',
                移除字段: ['合作度', '色气值'],
              }),
            )
            .prefault({}),

          织部香织: 核心女角色结构
            .extend({
              当前所在地点: 标准地点('村中食堂'),
              当前心里话: 创建字符串标准化器(''),
              好感: 数值百分比(0),
              信任: 数值百分比(0),
              欲望: 数值百分比(20),
              压抑值: 数值百分比(20),
              顺从度: 数值百分比(0),
            })
            .transform(data =>
              统一女性关系字段(data, {
                信任默认值: 0,
                欲望默认值: 20,
                信任兼容字段: '顺从度',
                欲望兼容字段: '压抑值',
                移除字段: ['压抑值', '顺从度'],
              }),
            )
            .prefault({}),

          卷岛春: 核心女角色结构
            .extend({
              当前所在地点: 标准地点('学生公寓'),
              当前心里话: 创建字符串标准化器(''),
              好感: 数值百分比(0),
              信任: 数值百分比(0),
              欲望: 数值百分比(10),
              依赖: 数值百分比(0),
              异常值: 数值百分比(10),
            })
            .transform(data =>
              统一女性关系字段(data, {
                信任默认值: 0,
                欲望默认值: 10,
                信任兼容字段: '依赖',
                欲望兼容字段: '异常值',
                移除字段: ['依赖', '异常值'],
              }),
            )
            .prefault({}),

          咩子: 核心女角色结构
            .extend({
              当前所在地点: 标准地点('回末住处'),
              当前心里话: 创建字符串标准化器(''),
              好感: 数值百分比(0),
              信任: 数值百分比(20),
              欲望: 数值百分比(0),
              依赖: 数值百分比(20),
              特殊性: 创建字符串标准化器('关键角色'),
            })
            .transform(data =>
              统一女性关系字段(data, {
                信任默认值: 20,
                欲望默认值: 0,
                信任兼容字段: '依赖',
                移除字段: ['依赖', '特殊性'],
              }),
            )
            .prefault({}),

          山胁多惠: 轻量女角色结构
            .extend({
              当前所在地点: 标准地点('村中'),
              当前心里话: 创建字符串标准化器(''),
            })
            .prefault({}),

          美佐峰美辻: 核心女角色结构
            .extend({
              当前所在地点: 标准地点('便利店'),
              当前心里话: 创建字符串标准化器(''),
              当前在场状态: 创建在场状态('不可见'),
              好感: 数值百分比(0),
              信任: 数值百分比(0),
              欲望: 数值百分比(0),
            })
            .prefault({}),
        })
        .prefault({}),

      男性角色: z
        .object({
          织部泰长: 关键男角色结构
            .extend({
              当前所在地点: 标准地点('学生公寓'),
              当前心里话: 创建字符串标准化器(''),
              对user态度: 标准态度('审视'),
            })
            .prefault({}),

          织部义次: 关键男角色结构
            .extend({
              当前所在地点: 标准地点('村中食堂'),
              当前心里话: 创建字符串标准化器(''),
              对user态度: 标准态度('敌意'),
            })
            .prefault({}),

          酿田近望: 关键男角色结构
            .extend({
              当前所在地点: 标准地点('学生公寓'),
              当前心里话: 创建字符串标准化器(''),
              对user态度: 标准态度('好奇'),
            })
            .prefault({}),

          室匠: 关键男角色结构
            .extend({
              当前所在地点: 标准地点('村中食堂'),
              当前心里话: 创建字符串标准化器(''),
              对user态度: 标准态度('警惕'),
            })
            .prefault({}),

          能里清之介: 关键男角色结构
            .extend({
              当前所在地点: 标准地点('洋馆'),
              当前心里话: 创建字符串标准化器(''),
              当前在场状态: 创建在场状态('离场'),
              对user态度: 标准态度('不耐烦'),
              是否掌握关键情报: z.boolean().prefault(true),
            })
            .prefault({}),

          卷岛宽造: 关键男角色结构
            .extend({
              当前所在地点: 标准地点('集会堂'),
              当前心里话: 创建字符串标准化器(''),
              对user态度: 标准态度('敌意'),
              是否掌握关键情报: z.boolean().prefault(true),
            })
            .prefault({}),

          狼爷爷: 关键男角色结构
            .extend({
              当前所在地点: 标准地点('村外'),
              当前心里话: 创建字符串标准化器(''),
              对user态度: 标准态度('不可测'),
              是否掌握关键情报: z.boolean().prefault(true),
            })
            .prefault({}),

          桥本雄大: 关键男角色结构
            .extend({
              当前所在地点: 标准地点('村中食堂'),
              当前心里话: 创建字符串标准化器(''),
              对user态度: 标准态度('观察'),
            })
            .prefault({}),
        })
        .prefault({}),
    })
    .prefault({}),

  线索与真相: z
    .object({
      已解锁线索列表: 去重字符串列表(),
      已解锁真相列表: 去重字符串列表(),
      已触发线索回收节点列表: 去重字符串列表(),
    })
    .prefault({}),

  永久Key: z
    .object({
      已获得真相Key列表: 去重字符串列表(),
      已获得角色核心Key列表: 去重字符串列表(),
      已获得路线Key列表: 去重字符串列表(),
      已解锁主线层级: z.coerce
        .number()
        .transform(value => _.clamp(Math.floor(value), 1, 10))
        .prefault(1),
      已解锁角色深层路线: 去重字符串列表(),
    })
    .prefault({}),

  跨轮残留: z
    .object({
      角色残留关系: z
        .object({
          千枝实残留关系: 数值百分比(0),
          李花子残留关系: 数值百分比(0),
          久子残留关系: 数值百分比(0),
          香织残留关系: 数值百分比(0),
          春残留关系: 数值百分比(0),
          咩子残留关系: 数值百分比(0),
        })
        .prefault({}),

      轮回认知: z
        .object({
          user轮回认知层级: z.coerce
            .number()
            .transform(value => _.clamp(Math.floor(value), 0, 10))
            .prefault(0),
          千枝实轮回记忆清晰度: 数值百分比(0),
          美辻轮回干涉状态: 标准轮回干涉状态('未确认'),
        })
        .prefault({}),

      神异连续: z
        .object({
          梦境稳定度: 数值百分比(100),
        })
        .prefault({}),
    })
    .prefault({}),
});

export const Schema = SchemaObject.prefault({});
export type Schema = z.output<typeof SchemaObject>;
