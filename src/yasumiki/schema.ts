export const 在场状态 = z
  .enum(['在场', '离场', '独处中', '被关押', '被隔离', '宴会中', '不可见', '神隐中'])
  .prefault('在场');

export const 深层关系阶段 = z
  .enum(['未建立', '产生印象', '试探期', '信任期', '深层亲密期', '共犯期', '专属期'])
  .prefault('未建立');

export const 角色功能身份 = z.string().prefault('未分配');

export const 数值百分比 = (初始值: number) =>
  z.coerce
    .number()
    .transform(value => _.clamp(value, 0, 100))
    .prefault(初始值);

export const 非负整数 = (初始值: number) =>
  z.coerce
    .number()
    .transform(value => Math.max(初始值 === 0 ? 0 : 1, Math.floor(value)))
    .prefault(初始值);

export const 核心女角色结构 = z.object({
  当前所在地点: z.string().prefault('学生公寓'),
  当前在场状态: 在场状态,
  本轮功能身份: 角色功能身份,
  是否已独处: z.boolean().prefault(false),
  是否已亲密接触: z.boolean().prefault(false),
  是否已发生性关系: z.boolean().prefault(false),
  深层关系阶段,
});

export const 轻量女角色结构 = z.object({
  当前所在地点: z.string().prefault('村中食堂'),
  当前在场状态: 在场状态,
  本轮功能身份: 角色功能身份,
  好感: 数值百分比(0),
});

export const 关键男角色结构 = z.object({
  当前所在地点: z.string().prefault('村中食堂'),
  当前在场状态: 在场状态,
  本轮功能身份: 角色功能身份,
  当前立场: z.string().prefault('中立'),
  对user态度: z.string().prefault('观察'),
  是否掌握关键情报: z.boolean().prefault(false),
});

export const SchemaObject = z.object({
  世界: z
    .object({
      当前路线: z.enum(['黄泉线', '机知线', '暗黑线', '神明线', '未定']).prefault('未定'),
      当前章节: z.string().prefault('序章'),
      当前日期: z.string().prefault('5月11日'),
      当前时间段: z.enum(['清晨', '白天', '傍晚', '夜间', '雾夜']).prefault('清晨'),
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
      当前地点: z.string().prefault('学生公寓'),
      在场角色列表: z.array(z.string()).prefault([]),
      缺席角色列表: z.array(z.string()).prefault([]),
      当前宴会参与角色列表: z.array(z.string()).prefault([]),
    })
    .prefault({}),

  宴会: z
    .object({
      当前宴会轮次: 非负整数(0),
      今日是否已召开宴会: z.boolean().prefault(false),
      当前怀疑焦点: z.array(z.string()).prefault([]),
      今日异常事件列表: z.array(z.string()).prefault([]),
      本轮身份分配表: z.record(z.string(), z.string()).prefault({}),
    })
    .prefault({}),

  主角: z
    .object({
      当前所在地点: z.string().prefault('学生公寓'),
      当前在场状态: 在场状态.prefault('在场'),
      本轮功能身份: z.string().prefault('未分配'),
      当前阵营: z.enum(['未知', '人类', '狼侧']).prefault('未知'),
      当前状态: z.enum(['清醒', '睡梦中', '在场', '离场', '被关押']).prefault('清醒'),
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
              当前所在地点: z.string().prefault('学生公寓'),
              好感: 数值百分比(10),
              信任: 数值百分比(5),
              欲望: 数值百分比(0),
            })
            .prefault({}),

          回末李花子: 核心女角色结构
            .extend({
              当前所在地点: z.string().prefault('回末住处'),
              好感: 数值百分比(10),
              信赖: 数值百分比(10),
              色诱度: 数值百分比(5),
            })
            .prefault({}),

          马宫久子: 核心女角色结构
            .extend({
              当前所在地点: z.string().prefault('村中食堂'),
              好感: 数值百分比(0),
              合作度: 数值百分比(10),
              色气值: 数值百分比(5),
            })
            .prefault({}),

          织部香织: 核心女角色结构
            .extend({
              当前所在地点: z.string().prefault('村中食堂'),
              好感: 数值百分比(0),
              压抑值: 数值百分比(20),
              顺从度: 数值百分比(0),
            })
            .prefault({}),

          卷岛春: 核心女角色结构
            .extend({
              当前所在地点: z.string().prefault('学生公寓'),
              好感: 数值百分比(0),
              依赖: 数值百分比(0),
              异常值: 数值百分比(10),
              是否已暴露异常面: z.boolean().prefault(false),
            })
            .prefault({}),

          咩子: 核心女角色结构
            .extend({
              当前所在地点: z.string().prefault('回末住处'),
              好感: 数值百分比(0),
              依赖: 数值百分比(20),
              特殊性: z.string().prefault('关键角色'),
            })
            .prefault({}),

          山胁多惠: 轻量女角色结构
            .extend({
              当前所在地点: z.string().prefault('村中'),
            })
            .prefault({}),

          美佐峰美辻: z
            .object({
              当前所在地点: z.string().prefault('便利店'),
              当前在场状态: 在场状态,
              当前是否现身: z.boolean().prefault(false),
              当前干涉状态: z.string().prefault('未介入'),
              是否已介入本轮: z.boolean().prefault(false),
            })
            .prefault({}),
        })
        .prefault({}),

      男性角色: z
        .object({
          织部泰长: 关键男角色结构
            .extend({
              当前所在地点: z.string().prefault('学生公寓'),
              当前立场: z.string().prefault('观察'),
              对user态度: z.string().prefault('审视'),
            })
            .prefault({}),

          织部义次: 关键男角色结构
            .extend({
              当前所在地点: z.string().prefault('村中食堂'),
              当前立场: z.string().prefault('暴躁'),
              对user态度: z.string().prefault('敌意'),
            })
            .prefault({}),

          酿田近望: 关键男角色结构
            .extend({
              当前所在地点: z.string().prefault('学生公寓'),
              当前立场: z.string().prefault('摇摆'),
              对user态度: z.string().prefault('好奇'),
            })
            .prefault({}),

          室匠: 关键男角色结构
            .extend({
              当前所在地点: z.string().prefault('村中食堂'),
              当前立场: z.string().prefault('中立'),
              对user态度: z.string().prefault('警惕'),
            })
            .prefault({}),

          能里清之介: 关键男角色结构
            .extend({
              当前所在地点: z.string().prefault('洋馆'),
              当前在场状态: 在场状态.prefault('离场'),
              当前立场: z.string().prefault('旁观'),
              对user态度: z.string().prefault('不耐烦'),
              是否掌握关键情报: z.boolean().prefault(true),
            })
            .prefault({}),

          卷岛宽造: 关键男角色结构
            .extend({
              当前所在地点: z.string().prefault('集会堂'),
              当前立场: z.string().prefault('保守'),
              对user态度: z.string().prefault('敌视'),
              是否掌握关键情报: z.boolean().prefault(true),
            })
            .prefault({}),

          狼爷爷: 关键男角色结构
            .extend({
              当前所在地点: z.string().prefault('村外'),
              当前立场: z.string().prefault('诡异'),
              对user态度: z.string().prefault('不可测'),
              是否掌握关键情报: z.boolean().prefault(true),
            })
            .prefault({}),

          桥本雄大: 关键男角色结构
            .extend({
              当前所在地点: z.string().prefault('村中食堂'),
              当前立场: z.string().prefault('理性'),
              对user态度: z.string().prefault('观察'),
            })
            .prefault({}),
        })
        .prefault({}),
    })
    .prefault({}),

  线索与真相: z
    .object({
      已解锁线索列表: z.array(z.string()).prefault([]),
      已解锁真相列表: z.array(z.string()).prefault([]),
      已触发线索回收节点列表: z.array(z.string()).prefault([]),
    })
    .prefault({}),

  永久Key: z
    .object({
      已获得真相Key列表: z.array(z.string()).prefault([]),
      已获得角色核心Key列表: z.array(z.string()).prefault([]),
      已获得路线Key列表: z.array(z.string()).prefault([]),
      已解锁主线层级: z.coerce
        .number()
        .transform(value => _.clamp(Math.floor(value), 1, 10))
        .prefault(1),
      已解锁角色深层路线: z.array(z.string()).prefault([]),
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
          美辻轮回干涉状态: z.string().prefault('未确认'),
        })
        .prefault({}),

      神异连续: z
        .object({
          春的神异状态: z.string().prefault('未激活'),
          梦境稳定度: 数值百分比(100),
        })
        .prefault({}),
    })
    .prefault({}),
});

export const Schema = SchemaObject.prefault({});
export type Schema = z.output<typeof SchemaObject>;
