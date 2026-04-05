<template>
  <div class="status-shell">
    <div class="status-card">
      <div class="status-ambience status-ambience-primary"></div>
      <div class="status-ambience status-ambience-secondary"></div>
      <div class="status-noise"></div>
      <header class="hero-bar">
        <div class="hero-side hero-side-left">
          <div class="micro-row">
            <span class="micro-dot micro-dot-accent"></span>
            <span class="micro-text">当前章节</span>
          </div>
          <h2 class="hero-title">{{ world.当前章节 || '未定章节' }}</h2>
          <div class="hero-meta">
            <span class="hero-route">{{ world.当前路线 || '未定路线' }}</span>
            <span class="hero-divider"></span>
            <span class="hero-loop">第 {{ world.当前轮回编号 || 1 }} 次轮回</span>
            <span class="hero-divider"></span>
            <span class="hero-loop">主线 {{ mainStoryLevel }}</span>
          </div>
          <div class="hero-inline-chips hero-inline-chips-left">
            <span class="status-chip" :class="world.是否起雾 ? 'danger' : 'normal'">
              {{ world.是否起雾 ? '起雾' : '未起雾' }}
            </span>
            <span class="status-chip" :class="world.是否处于宴会阶段 ? 'danger' : 'normal'">
              {{ world.是否处于宴会阶段 ? '宴会中' : '非宴会中' }}
            </span>
            <span class="status-chip info">{{ scene.当前地点 || '未知地点' }}</span>
          </div>
        </div>

        <button class="totem-button" type="button" aria-label="折叠状态栏" @click="collapsed = !collapsed">
          <span class="totem-glow"></span>
          <span class="totem-shell" aria-hidden="true">
            <svg viewBox="0 0 100 100" class="totem-svg" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <radialGradient id="yasumikiSheepGlow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                  <stop offset="0%" stop-color="rgba(217, 70, 90, 0.4)" />
                  <stop offset="100%" stop-color="rgba(217, 70, 90, 0)" />
                </radialGradient>
                <filter id="yasumikiInkBlur">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="0.5" />
                </filter>
              </defs>
              <circle cx="50" cy="50" r="48" fill="url(#yasumikiSheepGlow)" class="totem-pulse" />
              <path
                d="M50 15C40 15 32 18 28 24C22 22 15 25 12 32C8 38 10 45 15 50C10 55 8 62 12 68C15 75 22 78 28 76C32 82 40 85 50 85C60 85 68 82 72 76C78 78 85 75 88 68C92 62 90 55 85 50C90 45 92 38 88 32C85 25 78 22 72 24C68 18 60 15 50 15Z"
                class="totem-wool"
                filter="url(#yasumikiInkBlur)"
              />
              <path
                d="M50 32C42 32 35 38 35 48C35 58 42 64 50 64C58 64 65 58 65 48C65 38 58 32 50 32Z"
                class="totem-face-fill"
              />
              <circle cx="44" cy="48" r="2.5" class="totem-eye-fill" />
              <circle cx="56" cy="48" r="2.5" class="totem-eye-fill" />
              <circle cx="40" cy="52" r="2.5" class="totem-blush" />
              <circle cx="60" cy="52" r="2.5" class="totem-blush" />
              <path d="M30 25Q20 20 15 30" class="totem-horn" />
              <path d="M70 25Q80 20 85 30" class="totem-horn" />
            </svg>
          </span>
        </button>

        <div class="hero-side hero-side-right">
          <div class="micro-row micro-row-right">
            <span class="micro-text">时空坐标</span>
            <span class="micro-dot micro-dot-gold"></span>
          </div>
          <div class="hero-date">{{ world.当前日期 || '未知日期' }}</div>
          <div class="hero-time">{{ displayClock }}</div>
          <div class="hero-inline-chips hero-inline-chips-right">
            <span class="status-chip info">轮回认知 Lv.{{ loopAwarenessLevel }}</span>
            <span class="status-chip" :class="dreamStabilityPercent <= 40 ? 'danger' : 'normal'">
              梦境稳定度 {{ dreamStabilityPercent }}%
            </span>
          </div>
        </div>
      </header>

      <div v-if="!collapsed" class="panel-body">
        <nav class="tab-bar">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            type="button"
            class="tab-button"
            :class="{ active: activeTab === tab.id }"
            @click="activeTab = tab.id"
          >
            <span class="tab-icon">{{ tab.icon }}</span>
            <span>{{ tab.label }}</span>
          </button>
        </nav>

        <Transition name="panel-fade" mode="out-in">
          <section v-if="activeTab === 'overview'" key="overview" class="panel-section overview-section">
            <div class="section-block">
              <h3 class="section-heading">
                <span class="section-heading-mark"></span>
                自我认知
              </h3>
              <div class="identity-panel">
                <div class="identity-card">
                  <span class="identity-label">加护</span>
                  <span class="identity-value">{{ identityBlessing }}</span>
                </div>
                <div class="identity-card">
                  <span class="identity-label">阵营</span>
                  <span class="identity-value identity-value-gold">{{ identityCamp }}</span>
                </div>
                <div class="identity-card">
                  <span class="identity-label">状态</span>
                  <span class="identity-value identity-value-danger">{{ identityStatus }}</span>
                </div>
              </div>
            </div>

            <div class="overview-dual-grid">
              <div class="section-block">
                <h3 class="section-heading">
                  <span class="section-heading-mark section-heading-mark-danger"></span>
                  异象监测
                </h3>
                <div class="phenomenon-grid">
                  <div class="phenomenon-card" :class="world.是否起雾 ? 'active-danger' : ''">
                    <div class="phenomenon-icon">☁</div>
                    <div class="phenomenon-name">迷雾</div>
                    <div class="phenomenon-note">{{ world.是否起雾 ? '幽冥之气 · 浓郁' : '暂无异动' }}</div>
                  </div>
                  <div class="phenomenon-card" :class="world.是否处于宴会阶段 ? 'active-gold' : ''">
                    <div class="phenomenon-icon">🔥</div>
                    <div class="phenomenon-name">祭祀</div>
                    <div class="phenomenon-note">{{ world.是否处于宴会阶段 ? '宴会 · 进行中' : '尚未开启' }}</div>
                  </div>
                </div>
              </div>

              <div class="section-block">
                <h3 class="section-heading">
                  <span class="section-heading-mark section-heading-mark-gold"></span>
                  轮回与仪式
                </h3>
                <div class="phenomenon-grid">
                  <div class="phenomenon-card">
                    <div class="phenomenon-icon">↺</div>
                    <div class="phenomenon-name">轮回认知</div>
                    <div class="phenomenon-note">Lv.{{ loopAwarenessLevel }}</div>
                  </div>
                  <button
                    class="phenomenon-card phenomenon-card-button"
                    type="button"
                    :disabled="!loopResetAvailable || loopResetPending"
                    @click="triggerLoopReset"
                  >
                    <div class="phenomenon-icon">⟳</div>
                    <div class="phenomenon-name">轮回重置</div>
                    <div class="phenomenon-note">{{ loopResetPending ? '执行中…' : '重新开局' }}</div>
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section v-else-if="activeTab === 'present'" key="present" class="panel-section">
            <div class="section-block">
              <div class="section-head-row">
                <h3 class="section-heading">
                  <span class="section-heading-mark section-heading-mark-danger"></span>
                  众生索引（{{ allCharacterList.length }}）
                </h3>
                <span class="section-tip">点击卡片查看头像、立绘与心绪</span>
              </div>

              <div class="character-grid reference-grid">
                <button
                  v-for="char in allCharacterList"
                  :key="char.name"
                  type="button"
                  class="character-reference-card"
                  :class="{
                    selected: selectedCharacter?.name === char.name,
                    'has-residual-aura': hasImportantResidualAura(char),
                    'is-absent-card': !char.isPresent,
                    'is-present-card': char.isPresent,
                    'is-unseen-card': getPresenceText(char.detail) === '不可见',
                  }"
                  @click="selectedCharacter = selectedCharacter?.name === char.name ? null : char"
                >
                  <div class="character-reference-aura"></div>
                  <div v-if="hasImportantResidualAura(char)" class="character-residual-badge">
                    <span class="character-residual-badge-ring"></span>
                    <span class="character-residual-badge-text">残响</span>
                  </div>
                  <div class="character-avatar-badge">
                    <img
                      v-if="getAvatarUrl(char.name)"
                      :src="getAvatarUrl(char.name)"
                      :alt="`${char.name}头像`"
                      class="character-avatar-image"
                    />
                    <span v-else>{{ getAvatarText(char.name) }}</span>
                  </div>
                  <div class="character-reference-main compact-reference-main">
                    <div class="character-reference-headline compact-reference-headline">
                      <span class="character-reference-name">{{ char.name }}</span>
                      <span
                        class="character-state-pill"
                        :class="{
                          present: char.isPresent,
                          absent: !char.isPresent && getPresenceText(char.detail) !== '不可见',
                          unseen: getPresenceText(char.detail) === '不可见',
                        }"
                      >
                        {{ getPresenceText(char.detail) }}
                      </span>
                    </div>
                    <div class="character-reference-meta compact-reference-meta">
                      <span class="character-reference-kicker">所在</span>
                      <span class="character-reference-location">{{ getLocationText(char.detail) }}</span>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div v-if="selectedCharacter" class="character-detail-overlay" @click="selectedCharacter = null">
              <div class="character-detail-modal" @click.stop>
                <button class="detail-close" type="button" aria-label="关闭角色详情" @click="selectedCharacter = null">
                  ×
                </button>
                <div class="detail-modal-body">
                  <div class="detail-modal-hero">
                    <div class="detail-modal-hero-glow"></div>
                    <div class="detail-modal-avatar detail-modal-avatar-large">
                      <img
                        v-if="getAvatarUrl(selectedCharacter.name)"
                        :src="getAvatarUrl(selectedCharacter.name)"
                        :alt="`${selectedCharacter.name}头像`"
                        class="character-avatar-image detail-avatar-image"
                      />
                      <span v-else>{{ getAvatarText(selectedCharacter.name) }}</span>
                    </div>
                    <div class="detail-modal-hero-copy">
                      <div class="detail-flag">角色启示</div>
                      <div class="detail-title">{{ selectedCharacter.name }}</div>
                      <div class="detail-subtitle">
                        <span>{{ getRoleText(selectedCharacter.detail) }}</span>
                        <span class="detail-subtitle-divider"></span>
                        <span>{{ getPresenceText(selectedCharacter.detail) }}</span>
                      </div>
                    </div>
                  </div>

                  <div class="detail-portrait-card">
                    <div class="detail-portrait-head">
                      <span class="detail-portrait-label">立绘栏</span>
                      <span class="detail-portrait-tip">可填图床</span>
                    </div>
                    <div class="detail-portrait-frame">
                      <img
                        v-if="getPortraitUrl(selectedCharacter.name)"
                        :src="getPortraitUrl(selectedCharacter.name)"
                        :alt="`${selectedCharacter.name}立绘`"
                        class="detail-portrait-image"
                      />
                      <div v-else class="detail-portrait-placeholder">
                        <span class="detail-portrait-placeholder-title">立绘预留</span>
                        <span class="detail-portrait-placeholder-text">在角色立绘映射里填入图床 URL 后显示</span>
                      </div>
                    </div>
                  </div>

                  <div class="detail-layout-row">
                    <div class="detail-layout-main">
                      <div v-if="hasImportantResidualAura(selectedCharacter)" class="detail-resonance-banner">
                        <span class="detail-resonance-label">残留共鸣</span>
                        <span class="detail-resonance-value">{{
                          getResidualRelationValue(selectedCharacter.name)
                        }}</span>
                      </div>

                      <div class="detail-role-banner">所在地点：{{ getLocationText(selectedCharacter.detail) }}</div>

                      <div v-if="selectedCharacter.name === '卷岛春'" class="detail-extra-pills">
                        <span class="attribute-pill key-pill">春的神异：{{ springMysticState }}</span>
                      </div>

                      <div
                        v-if="getResidualRelationValue(selectedCharacter.name) !== null"
                        class="detail-residual-card"
                      >
                        <div class="detail-residual-title">跨轮残留关系</div>
                        <div class="detail-residual-value">{{ getResidualRelationValue(selectedCharacter.name) }}</div>
                      </div>

                      <div class="detail-quote">“{{ getCharacterThought(selectedCharacter) }}”</div>
                    </div>

                    <div class="detail-layout-side">
                      <div class="detail-grid reference-detail-grid compact-detail-grid">
                        <div class="detail-item">
                          <span class="detail-label">在场状态</span>
                          <span class="detail-value">{{ getPresenceText(selectedCharacter.detail) }}</span>
                        </div>
                        <div class="detail-item">
                          <span class="detail-label">所在地点</span>
                          <span class="detail-value">{{ getLocationText(selectedCharacter.detail) }}</span>
                        </div>
                        <div
                          v-for="attribute in getAttributes(selectedCharacter)"
                          :key="attribute.label"
                          class="detail-item"
                        >
                          <span class="detail-label">{{ attribute.label }}</span>
                          <span class="detail-value">{{ attribute.value }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section v-else-if="activeTab === 'clues'" key="clues" class="panel-section clue-grid">
            <div class="info-card wide">
              <div class="card-title">记忆总览</div>
              <div class="memory-single-tab-wrap">
                <button type="button" class="memory-single-tab" @click="memoryPanelExpanded = !memoryPanelExpanded">
                  <div class="memory-single-tab-main">
                    <span class="memory-single-tab-title">记忆档案</span>
                    <span class="memory-single-tab-summary">{{ memorySummaryText }}</span>
                  </div>
                  <span class="memory-single-tab-arrow" :class="{ expanded: memoryPanelExpanded }">▾</span>
                </button>
              </div>
              <div v-if="memoryPanelExpanded" class="memory-detail-panel memory-detail-panel-expanded">
                <button
                  type="button"
                  class="memory-detail-chip active"
                  @click="memoryKeyListExpanded = !memoryKeyListExpanded"
                >
                  <span>剧情 Key</span>
                  <span class="memory-key-explainer-arrow" :class="{ expanded: memoryKeyListExpanded }">▾</span>
                </button>
                <div v-if="memoryKeyListExpanded" class="memory-key-list-panel">
                  <div class="memory-key-explainer-body">
                    这些 Key 不是普通收藏品，而是剧情里的“开门钥匙”。拿到某个 Key
                    之后，对应角色才会愿意露出更深一层的秘密、关系和异常面；没拿到之前，就算好感已经够高，剧情也会先停在比较克制的阶段，不会一下子跳进最深层内容。
                  </div>
                  <div v-if="roleKeys.length" class="memory-key-list-group">
                    <div class="memory-key-list-title">角色核心 Key</div>
                    <div class="memory-key-list-tags">
                      <span v-for="key in roleKeys" :key="key" class="memory-key-tag">{{ key }}</span>
                    </div>
                  </div>
                  <div v-if="routeAndTruthKeys.length" class="memory-key-list-group">
                    <div class="memory-key-list-title">真相 / 路线 Key</div>
                    <div class="memory-key-list-tags">
                      <span v-for="key in routeAndTruthKeys" :key="key" class="memory-key-tag">{{ key }}</span>
                    </div>
                  </div>
                  <div v-if="!roleKeys.length && !routeAndTruthKeys.length" class="empty-text compact-memory-text">
                    当前还没有已获得的剧情 Key
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section v-else key="scene" class="panel-section scene-section">
            <div class="section-head-row">
              <h3 class="section-heading">
                <span class="section-heading-mark section-heading-mark-danger"></span>
                地缘情报
              </h3>
            </div>

            <div class="scene-stack">
              <div class="scene-current-card group-card-hover">
                <div class="scene-current-aura"></div>
                <div class="scene-pin scene-pin-danger">⌖</div>
                <div class="scene-current-main">
                  <div class="scene-current-kicker">CURRENT NODE</div>
                  <div class="scene-current-name">{{ scene.当前地点 || '未知地点' }}</div>
                  <div class="scene-current-subtitle">当前地缘坐标</div>
                  <div class="scene-current-summary">
                    <span class="scene-current-summary-chip">{{ displayClock }}</span>
                    <span class="scene-current-summary-chip">{{ world.是否起雾 ? '雾已迫近' : '白日仍稳' }}</span>
                    <span class="scene-current-summary-chip">{{ banquetOpenedToday ? '宴会已动' : '宴会未开' }}</span>
                  </div>
                </div>
              </div>

              <div class="scene-grid">
                <div class="scene-mini-card scene-mini-card-abyss group-card-hover">
                  <div class="scene-mini-pin">⌖</div>
                  <div>
                    <div class="scene-mini-name">皿永</div>
                    <div class="scene-mini-note">黄泉通道</div>
                  </div>
                </div>
                <div class="scene-mini-card scene-mini-card-village group-card-hover">
                  <div class="scene-mini-pin">⌖</div>
                  <div>
                    <div class="scene-mini-name">休水村 · 食堂</div>
                    <div class="scene-mini-note">生活区</div>
                  </div>
                </div>
                <div class="scene-mini-card scene-mini-card-abyss group-card-hover">
                  <div class="scene-mini-pin">⌖</div>
                  <div>
                    <div class="scene-mini-name">首吊松</div>
                    <div class="scene-mini-note">墓地入口</div>
                  </div>
                </div>
                <div class="scene-mini-card scene-mini-card-forbidden group-card-hover">
                  <div class="scene-mini-pin">⌖</div>
                  <div>
                    <div class="scene-mini-name">神社后山</div>
                    <div class="scene-mini-note">禁忌之地</div>
                  </div>
                </div>
                <div class="scene-mini-card scene-mini-card-banquet group-card-hover">
                  <div class="scene-mini-pin">⌖</div>
                  <div>
                    <div class="scene-mini-name">洋馆</div>
                    <div class="scene-mini-note">能里别馆</div>
                  </div>
                </div>
                <div class="scene-mini-card scene-mini-card-banquet group-card-hover">
                  <div class="scene-mini-pin">⌖</div>
                  <div>
                    <div class="scene-mini-name">集会堂</div>
                    <div class="scene-mini-note">宴会场所</div>
                  </div>
                </div>
              </div>

              <div class="scene-info-grid">
                <div class="info-card wide scene-banquet-card">
                  <div class="scene-banquet-head">
                    <div>
                      <div class="card-title">宴会情报</div>
                      <div class="scene-banquet-subtitle">今夜局势与仪式推进</div>
                    </div>
                    <div class="scene-banquet-state-badge" :class="banquetOpenedToday ? 'is-opened' : 'is-idle'">
                      {{ banquetOpenedToday ? '今日已召开' : '今日未召开' }}
                    </div>
                  </div>

                  <div class="banquet-status-row">
                    <div class="banquet-status-card banquet-status-card-round">
                      <span class="banquet-status-label">轮次</span>
                      <span class="banquet-status-value">{{ banquetRound }}</span>
                    </div>
                    <div class="banquet-status-card" :class="banquetOpenedToday ? 'is-opened' : 'is-idle'">
                      <span class="banquet-status-label">局势</span>
                      <span class="banquet-status-value">{{
                        banquetOpenedToday ? '仪式已被触发' : '白日仍在铺垫'
                      }}</span>
                    </div>
                  </div>

                  <div v-if="feastList.length" class="key-section">
                    <div class="key-subtitle">参与角色</div>
                    <div class="card-tags">
                      <span v-for="name in feastList" :key="name" class="attribute-pill feast-pill">
                        {{ name }}
                      </span>
                    </div>
                  </div>

                  <div v-if="suspicionList.length" class="key-section">
                    <div class="key-subtitle">怀疑焦点</div>
                    <div class="card-tags">
                      <span v-for="name in suspicionList" :key="name" class="attribute-pill key-pill">
                        {{ name }}
                      </span>
                    </div>
                  </div>

                  <div v-if="anomalyList.length" class="key-section">
                    <div class="key-subtitle">今日异常事件</div>
                    <div class="card-tags">
                      <span v-for="event in anomalyList" :key="event" class="attribute-pill truth-pill">
                        {{ event }}
                      </span>
                    </div>
                  </div>

                  <div v-if="identityAssignments.length" class="key-section">
                    <div class="key-subtitle">本轮身份分配</div>
                    <div class="card-tags">
                      <span v-for="item in identityAssignments" :key="item.label" class="attribute-pill">
                        {{ item.label }}：{{ item.value }}
                      </span>
                    </div>
                  </div>

                  <div
                    v-if="
                      !feastList.length && !suspicionList.length && !anomalyList.length && !identityAssignments.length
                    "
                    class="empty-text"
                  >
                    当前尚无额外宴会信息
                  </div>
                </div>
              </div>
            </div>
          </section>
        </Transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useDataStore } from './store';

type TabId = 'overview' | 'present' | 'clues' | 'scene';
type Attribute = { label: string; value: string | number | boolean };
type AnyCharacter = {
  name: string;
  type: 'female' | 'male';
  detail: Record<string, any>;
};

const tabs: { id: TabId; label: string; icon: string }[] = [
  { id: 'overview', label: '现世', icon: '〰' },
  { id: 'present', label: '众生', icon: '◌' },
  { id: 'clues', label: '记忆', icon: '↺' },
  { id: 'scene', label: '地缘', icon: '⛃' },
];

const activeTab = ref<TabId>('overview');
const collapsed = ref(false);
const selectedCharacter = ref<AnyCharacter | null>(null);
const memoryPanelExpanded = ref(false);
const memoryKeyListExpanded = ref(false);

const store = useDataStore();
const world = computed(() => store.world ?? {});
const scene = computed(() => store.scene ?? {});
const banquet = computed(() => store.banquet ?? {});
const permanentKeys = computed(() => store.permanentKeys ?? {});
const crossLoop = computed(() => store.crossLoop ?? {});
const displayClock = computed(() => {
  const phase = _.get(world.value, '当前时间段', '未知时段');
  const time = _.get(world.value, '当前时刻', '??:??');
  return `${time} · ${phase}`;
});
const protagonist = computed(() => store.protagonist ?? ({} as Record<string, any>));
const allCharacterList = computed<Array<AnyCharacter & { isPresent: boolean }>>(() => store.mergedCharacters ?? []);
const feastList = computed<string[]>(() => _.get(scene.value, '当前宴会参与角色列表', []));
const roleKeys = computed(() => _.get(permanentKeys.value, '已获得角色核心Key列表', []) as string[]);
const routeAndTruthKeys = computed(() => {
  const routeKeys = _.get(permanentKeys.value, '已获得路线Key列表', []) as string[];
  const truthKeys = _.get(permanentKeys.value, '已获得真相Key列表', []) as string[];
  return [...routeKeys, ...truthKeys];
});
const combinedKeyText = computed(() => {
  const keys = [...roleKeys.value, ...routeAndTruthKeys.value];
  return keys.length ? keys.join('、') : '暂无';
});
const mainStoryLevel = computed(() => _.get(permanentKeys.value, '已解锁主线层级', _.get(world.value, '主线层级', 1)));
const memorySummaryText = computed(() => {
  const segments = [`剧情 Key：${combinedKeyText.value}`];
  return segments.join('｜');
});
const identityBlessing = computed(() => _.get(protagonist.value, '本轮功能身份', '未分配'));
const identityCamp = computed(() => _.get(protagonist.value, '当前阵营', '未知'));
const identityStatus = computed(() => _.get(protagonist.value, '当前状态', '清醒'));
const loopAwarenessLevel = computed(() => _.get(crossLoop.value, '轮回认知.user轮回认知层级', 0));
const dreamStabilityPercent = computed(() => _.get(crossLoop.value, '神异连续.梦境稳定度', 100));
const springMysticState = computed(() => _.get(crossLoop.value, '神异连续.春的神异状态', '未激活'));
const loopResetPending = ref(false);
const loopResetAvailable = computed(() => {
  const target = (window.parent ?? window) as Window & {
    __yasumikiLoopReset?: (() => Promise<void>) | undefined;
  };
  return typeof target.__yasumikiLoopReset === 'function';
});

async function triggerLoopReset() {
  const target = (window.parent ?? window) as Window & {
    __yasumikiLoopReset?: (() => Promise<void>) | undefined;
  };

  if (typeof target.__yasumikiLoopReset !== 'function') {
    toastr.warning('轮回重置入口尚未准备好');
    return;
  }

  if (!window.confirm('确定要执行轮回重置吗？当前轮的现场状态会回到开局，但跨轮积累会保留。')) {
    return;
  }

  loopResetPending.value = true;
  try {
    await target.__yasumikiLoopReset();
  } finally {
    loopResetPending.value = false;
  }
}

function getResidualRelationValue(name: string) {
  const map: Record<string, number | null> = {
    芹泽千枝实: _.get(crossLoop.value, '角色残留关系.千枝实残留关系', 0),
    回末李花子: _.get(crossLoop.value, '角色残留关系.李花子残留关系', 0),
    马宫久子: _.get(crossLoop.value, '角色残留关系.久子残留关系', 0),
    织部香织: _.get(crossLoop.value, '角色残留关系.香织残留关系', 0),
    卷岛春: _.get(crossLoop.value, '角色残留关系.春残留关系', 0),
    咩子: _.get(crossLoop.value, '角色残留关系.咩子残留关系', 0),
  };
  return _.has(map, name) ? map[name] : null;
}
const banquetRound = computed(() => _.get(banquet.value, '当前宴会轮次', 0));
const banquetOpenedToday = computed(() => _.get(banquet.value, '今日是否已召开宴会', false));
const suspicionList = computed(() => _.get(banquet.value, '当前怀疑焦点', []) as string[]);
const anomalyList = computed(() => _.get(banquet.value, '今日异常事件列表', []) as string[]);
const identityAssignments = computed(() => {
  const record = _.get(banquet.value, '本轮身份分配表', {}) as Record<string, string>;
  return Object.entries(record).map(([label, value]) => ({ label, value }));
});

const characterAvatarUrlMap: Partial<Record<string, string>> = {
  芹泽千枝实: '',
  回末李花子: '',
  马宫久子: '',
  织部香织: '',
  卷岛春: '',
  咩子: '',
  山胁多惠: '',
  美佐峰美辻: '',
  织部泰长: '',
  织部义次: '',
  酿田近望: '',
  室匠: '',
  能里清之介: '',
  卷岛宽造: '',
  狼爷爷: '',
  桥本雄大: '',
};

const characterPortraitUrlMap: Partial<Record<string, string>> = {
  芹泽千枝实: '',
  回末李花子: 'https://img.213964.xyz/huiweilihuazi.png',
  马宫久子: '',
  织部香织: '',
  卷岛春: '',
  咩子: '',
  山胁多惠: '',
  美佐峰美辻: '',
  织部泰长: '',
  织部义次: '',
  酿田近望: '',
  室匠: '',
  能里清之介: '',
  卷岛宽造: '',
  狼爷爷: '',
  桥本雄大: '',
};

function getPresenceText(detail: Record<string, any>) {
  return detail.当前在场状态 ?? '未知';
}

function getLocationText(detail: Record<string, any>) {
  return detail.当前所在地点 ?? '未知';
}

function getRoleText(detail: Record<string, any>) {
  return detail.本轮功能身份 ?? '未分配';
}

function getAvatarText(name: string) {
  return name.slice(0, 1);
}

function getAvatarUrl(name: string) {
  return characterAvatarUrlMap[name]?.trim() ?? '';
}

function getPortraitUrl(name: string) {
  return characterPortraitUrlMap[name]?.trim() ?? '';
}

function hasImportantResidualAura(char: AnyCharacter | null) {
  if (!char) return false;
  if (char.type !== 'female') return false;
  const value = getResidualRelationValue(char.name);
  return value !== null && value > 0;
}

function getLiveThought(char: AnyCharacter) {
  return (_.get(char.detail, '当前心里话', '') as string).trim();
}

function getCharacterThought(char: AnyCharacter) {
  const thought = getLiveThought(char);
  if (thought) return thought;

  if (char.type === 'female') {
    return '……先别急着开口。再看一眼。';
  }
  return '先记住眼前的事，别太早下判断。';
}

function getAttributes(char: AnyCharacter): Attribute[] {
  const d = char.detail;

  if (char.name === '芹泽千枝实') {
    return [
      { label: '好感', value: d.好感 ?? 0 },
      { label: '信任', value: d.信任 ?? 0 },
      { label: '欲望', value: d.欲望 ?? 0 },
      { label: '阶段', value: d.深层关系阶段 ?? '未建立' },
    ];
  }
  if (char.name === '回末李花子') {
    return [
      { label: '好感', value: d.好感 ?? 0 },
      { label: '信赖', value: d.信赖 ?? 0 },
      { label: '色诱', value: d.色诱度 ?? 0 },
      { label: '阶段', value: d.深层关系阶段 ?? '未建立' },
    ];
  }
  if (char.name === '卷岛春') {
    return [
      { label: '好感', value: d.好感 ?? 0 },
      { label: '依赖', value: d.依赖 ?? 0 },
      { label: '异常', value: d.异常值 ?? 0 },
      { label: '暴露', value: d.是否已暴露异常面 ? '已暴露' : '未暴露' },
      { label: '阶段', value: d.深层关系阶段 ?? '未建立' },
    ];
  }
  if (char.name === '马宫久子') {
    return [
      { label: '好感', value: d.好感 ?? 0 },
      { label: '合作', value: d.合作度 ?? 0 },
      { label: '色气', value: d.色气值 ?? 0 },
      { label: '阶段', value: d.深层关系阶段 ?? '未建立' },
    ];
  }
  if (char.name === '织部香织') {
    return [
      { label: '好感', value: d.好感 ?? 0 },
      { label: '压抑', value: d.压抑值 ?? 0 },
      { label: '顺从', value: d.顺从度 ?? 0 },
      { label: '阶段', value: d.深层关系阶段 ?? '未建立' },
    ];
  }
  if (char.name === '咩子') {
    return [
      { label: '好感', value: d.好感 ?? 0 },
      { label: '依赖', value: d.依赖 ?? 0 },
      { label: '特殊', value: d.特殊性 ?? '关键角色' },
    ];
  }
  if (char.name === '美佐峰美辻') {
    return [
      { label: '现身', value: d.当前是否现身 ? '已现身' : '未现身' },
      { label: '干涉', value: d.当前干涉状态 ?? '未介入' },
      { label: '本轮', value: d.是否已介入本轮 ? '已介入' : '未介入' },
    ];
  }

  const result: Attribute[] = [];
  if (_.has(d, '当前立场')) result.push({ label: '立场', value: d.当前立场 });
  if (_.has(d, '对user态度')) result.push({ label: '态度', value: d.对user态度 });
  if (_.has(d, '好感')) result.push({ label: '好感', value: d.好感 });
  if (_.has(d, '当前是否现身')) result.push({ label: '现身', value: d.当前是否现身 ? '已现身' : '未现身' });
  if (_.has(d, '当前干涉状态')) result.push({ label: '干涉', value: d.当前干涉状态 });
  if (_.has(d, '是否已介入本轮')) result.push({ label: '本轮', value: d.是否已介入本轮 ? '已介入' : '未介入' });
  if (_.has(d, '是否掌握关键情报')) result.push({ label: '情报', value: d.是否掌握关键情报 ? '掌握' : '未知' });
  return result.slice(0, 5);
}
</script>

<style scoped>
.status-shell {
  position: relative;
  width: 100%;
  margin: 0 auto;
  color: #f7f1f4;
  isolation: isolate;
}

.status-card {
  position: relative;
  width: 100%;
  border-radius: 32px;
  overflow: hidden;
  isolation: isolate;
  background:
    radial-gradient(circle at 50% 0%, rgba(224, 90, 114, 0.12) 0%, rgba(224, 90, 114, 0) 28%),
    radial-gradient(circle at 12% 12%, rgba(212, 175, 55, 0.06) 0%, rgba(212, 175, 55, 0) 22%),
    linear-gradient(180deg, rgba(38, 28, 37, 0.82) 0%, rgba(23, 18, 28, 0.94) 100%);
  border: 1px solid rgba(224, 90, 114, 0.18);
  box-shadow:
    0 20px 50px -10px rgba(0, 0, 0, 0.2),
    inset 0 1px 2px rgba(255, 255, 255, 0.05),
    0 32px 64px -30px rgba(0, 0, 0, 0.72);
  backdrop-filter: blur(40px) saturate(120%);
  -webkit-backdrop-filter: blur(40px) saturate(120%);
  transition:
    background 0.7s ease,
    border-color 0.7s ease,
    box-shadow 0.7s ease,
    transform 0.25s ease;
}

.status-card:hover {
  box-shadow:
    0 20px 50px -10px rgba(0, 0, 0, 0.24),
    inset 0 1px 2px rgba(255, 255, 255, 0.06),
    0 36px 72px -30px rgba(0, 0, 0, 0.78);
}

.status-ambience {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.status-ambience-primary {
  background:
    radial-gradient(circle at 18% 14%, rgba(224, 90, 114, 0.16) 0%, rgba(224, 90, 114, 0) 28%),
    radial-gradient(circle at 82% 18%, rgba(212, 175, 55, 0.08) 0%, rgba(212, 175, 55, 0) 24%),
    radial-gradient(circle at 50% 112%, rgba(224, 90, 114, 0.1) 0%, rgba(224, 90, 114, 0) 34%);
  opacity: 0.95;
}

.status-ambience-secondary {
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.04) 0%,
    rgba(255, 255, 255, 0) 18%,
    rgba(0, 0, 0, 0.14) 100%
  );
  mix-blend-mode: screen;
  opacity: 0.38;
}

.status-noise {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image:
    radial-gradient(rgba(255, 255, 255, 0.08) 0.6px, transparent 0.6px),
    radial-gradient(rgba(255, 255, 255, 0.04) 0.8px, transparent 0.8px);
  background-size:
    14px 14px,
    24px 24px;
  background-position:
    0 0,
    7px 11px;
  opacity: 0.14;
  mix-blend-mode: soft-light;
}

.hero-bar {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 18px;
  align-items: center;
  padding: 20px 24px 18px;
  border-bottom: 1px solid rgba(224, 90, 114, 0.12);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.01) 0%, rgba(255, 255, 255, 0) 100%);
}

.hero-bar,
.status-strip,
.panel-body {
  position: relative;
  z-index: 1;
}

.hero-side {
  min-width: 0;
}

.hero-side-right {
  text-align: right;
}

.micro-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.micro-row-right {
  justify-content: flex-end;
}

.micro-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  box-shadow: 0 0 12px currentColor;
}

.micro-dot-accent {
  color: #e05a72;
  background: #e05a72;
}

.micro-dot-gold {
  color: #d4af37;
  background: #d4af37;
}

.micro-text {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.28em;
  color: #9e8f97;
}

.hero-title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: 0.02em;
}

.hero-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
  font-size: 11px;
  font-weight: 600;
  color: #aa98a1;
}

.hero-route {
  color: #dd5976;
}

.hero-divider {
  width: 1px;
  height: 12px;
  background: rgba(255, 255, 255, 0.14);
}

.hero-date {
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.hero-time {
  margin-top: 8px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.22em;
  color: #d4af37;
}

.totem-button {
  position: relative;
  width: 88px;
  height: 88px;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.totem-glow {
  position: absolute;
  inset: 6px;
  border-radius: 999px;
  background: radial-gradient(
    circle,
    rgba(224, 90, 114, 0.3) 0%,
    rgba(224, 90, 114, 0.1) 34%,
    rgba(224, 90, 114, 0) 74%
  );
  filter: blur(12px);
}

.totem-shell {
  position: absolute;
  inset: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.totem-svg {
  width: 64px;
  height: 64px;
  overflow: visible;
  filter: drop-shadow(0 0 16px rgba(224, 90, 114, 0.18));
}

.totem-pulse {
  opacity: 0.95;
}

.totem-wool {
  fill: #050505;
  stroke: rgba(217, 70, 90, 0.3);
  stroke-width: 1;
}

.totem-face-fill {
  fill: #f5f5f5;
}

.totem-eye-fill {
  fill: #000;
}

.totem-blush {
  fill: #d9465a;
  opacity: 0.2;
}

.totem-horn {
  fill: none;
  stroke: #d9465a;
  stroke-width: 1;
  opacity: 0.5;
}

.hero-inline-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.hero-inline-chips-left {
  justify-content: flex-start;
}

.hero-inline-chips-right {
  justify-content: flex-end;
}

.status-chip {
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 11px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.status-chip.normal {
  background: rgba(255, 255, 255, 0.04);
}

.status-chip.danger {
  background: rgba(194, 59, 78, 0.18);
  border-color: rgba(224, 90, 114, 0.25);
}

.status-chip.info {
  background: rgba(212, 175, 55, 0.12);
  border-color: rgba(212, 175, 55, 0.18);
}

.panel-body {
  padding: 18px 22px 22px;
}

.info-card-button {
  width: 100%;
  text-align: left;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    background 0.2s ease,
    opacity 0.2s ease;
}

.info-card-button:hover:not(:disabled) {
  transform: translateY(-1px);
  border-color: rgba(224, 90, 114, 0.28);
  background: rgba(224, 90, 114, 0.08);
}

.info-card-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.tab-bar {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 20px;
  padding: 10px;
  border-radius: 22px;
  border: 1px solid rgba(224, 90, 114, 0.1);
  background: linear-gradient(180deg, rgba(45, 33, 43, 0.72) 0%, rgba(35, 26, 33, 0.82) 100%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.02),
    0 12px 24px -24px rgba(224, 90, 114, 0.24);
}

.tab-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 15px 10px;
  border: 0;
  border-radius: 18px;
  background: transparent;
  color: #aea0a8;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.2em;
  cursor: pointer;
  transition:
    color 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease,
    transform 0.2s ease;
}

.tab-button.active {
  color: #f8f4f6;
  background: linear-gradient(180deg, rgba(92, 41, 60, 0.78) 0%, rgba(69, 29, 46, 0.72) 100%);
  box-shadow:
    inset 0 -2px 0 #e05a72,
    0 14px 26px -16px rgba(224, 90, 114, 0.58);
}

.tab-icon {
  font-size: 14px;
  line-height: 1;
  opacity: 0.9;
}

.panel-section {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.panel-fade-enter-active,
.panel-fade-leave-active {
  transition:
    opacity 0.26s ease,
    transform 0.26s ease,
    filter 0.26s ease;
}

.panel-fade-enter-from,
.panel-fade-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.985);
  filter: blur(4px);
}

.overview-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section-block {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.section-heading {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.28em;
  color: #b8a8af;
}

.section-heading-mark {
  width: 4px;
  height: 14px;
  border-radius: 999px;
  background: #e05a72;
  box-shadow: 0 0 10px rgba(224, 90, 114, 0.36);
}

.section-heading-mark-danger {
  background: #d65a72;
}

.section-heading-mark-gold {
  background: #d4af37;
  box-shadow: 0 0 10px rgba(212, 175, 55, 0.28);
}

.identity-panel {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  padding: 12px;
  border-radius: 26px;
  background: rgba(46, 33, 41, 0.62);
  border: 1px solid rgba(224, 90, 114, 0.16);
}

.identity-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 80px;
  padding: 12px 10px;
  border-radius: 18px;
  background: rgba(26, 18, 25, 0.72);
  border: 1px solid rgba(224, 90, 114, 0.12);
}

.identity-label {
  font-size: 10px;
  color: #9f9198;
  font-weight: 700;
  letter-spacing: 0.22em;
}

.identity-value {
  font-size: 16px;
  font-weight: 800;
  color: #f8f4f6;
}

.identity-value-gold {
  color: #e1bf55;
}

.identity-value-danger {
  color: #ef778f;
}

.overview-dual-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.phenomenon-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.phenomenon-card {
  display: flex;
  flex-direction: column;
  min-height: 112px;
  padding: 16px;
  border-radius: 24px;
  background: rgba(46, 33, 41, 0.6);
  border: 1px solid rgba(224, 90, 114, 0.14);
}

.phenomenon-card-button {
  width: 100%;
  text-align: left;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    background 0.2s ease,
    opacity 0.2s ease;
}

.phenomenon-card-button:hover:not(:disabled) {
  transform: translateY(-1px);
  border-color: rgba(224, 90, 114, 0.28);
  background: rgba(224, 90, 114, 0.08);
}

.phenomenon-card-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.phenomenon-card.active-danger {
  background: rgba(54, 34, 43, 0.75);
}

.phenomenon-card.active-gold {
  background: rgba(52, 41, 28, 0.56);
  border-color: rgba(212, 175, 55, 0.18);
}

.phenomenon-icon {
  font-size: 20px;
  margin-bottom: 16px;
}

.phenomenon-name {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 6px;
}

.phenomenon-note {
  font-size: 11px;
  color: #a3929a;
  letter-spacing: 0.08em;
}

.memory-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 126px;
  padding: 18px;
  border-radius: 24px;
  background: rgba(46, 33, 41, 0.6);
  border: 1px solid rgba(224, 90, 114, 0.14);
}

.memory-preview-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.memory-preview-chip {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 42px;
  padding: 10px 14px;
  border-radius: 16px;
  border: 1px solid rgba(224, 90, 114, 0.12);
  background: rgba(31, 22, 29, 0.62);
  color: #f0e6ea;
  font-size: 12px;
  font-weight: 600;
  text-align: left;
}

.memory-preview-icon {
  color: #d4af37;
}

.memory-preview-empty {
  padding: 8px 2px;
  font-size: 12px;
  color: #a3929a;
  font-style: italic;
}

.memory-panel-footer {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  align-self: flex-start;
  min-height: 34px;
  margin-top: auto;
  padding: 0 14px;
  border: 1px solid rgba(212, 175, 55, 0.22);
  border-radius: 999px;
  background: rgba(212, 175, 55, 0.08);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: #d4af37;
  cursor: pointer;
  transition:
    color 0.2s ease,
    transform 0.2s ease,
    text-shadow 0.2s ease,
    background 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.memory-panel-footer:hover {
  color: #f6cf62;
  background: rgba(212, 175, 55, 0.14);
  border-color: rgba(212, 175, 55, 0.32);
  text-shadow: 0 0 12px rgba(212, 175, 55, 0.24);
  box-shadow: 0 10px 20px -16px rgba(212, 175, 55, 0.45);
}

.memory-panel-footer:active {
  transform: translateY(1px);
}

.memory-panel-footer-label {
  line-height: 1;
}

.overview-status-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 14px;
}

.compact-memory-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.memory-single-tab-wrap {
  margin-top: 4px;
}

.memory-single-tab {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 18px;
  border: 1px solid rgba(224, 90, 114, 0.14);
  background: linear-gradient(180deg, rgba(44, 32, 40, 0.78) 0%, rgba(31, 24, 31, 0.82) 100%);
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    background 0.2s ease,
    box-shadow 0.2s ease;
}

.memory-single-tab:hover {
  transform: translateY(-1px);
  border-color: rgba(224, 90, 114, 0.22);
  box-shadow: 0 14px 22px -20px rgba(224, 90, 114, 0.24);
}

.memory-single-tab-main {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.memory-single-tab-title {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: #f3e9ed;
}

.memory-single-tab-summary {
  font-size: 12px;
  line-height: 1.6;
  color: #b8a9b0;
}

.memory-single-tab-arrow {
  flex-shrink: 0;
  font-size: 14px;
  color: #d7aeb8;
  transition: transform 0.2s ease;
}

.memory-single-tab-arrow.expanded {
  transform: rotate(180deg);
}

.compact-memory-summary {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(224, 90, 114, 0.12);
}

.compact-memory-text {
  line-height: 1.8;
  white-space: normal;
}

.memory-card-button.active {
  border-color: rgba(224, 90, 114, 0.32);
  background: rgba(224, 90, 114, 0.08);
  box-shadow: inset 0 -2px 0 rgba(224, 90, 114, 0.7);
}

.memory-detail-panel {
  margin-top: 14px;
  border-top: 1px solid rgba(224, 90, 114, 0.12);
  padding-top: 12px;
  display: grid;
  gap: 8px;
}

.memory-detail-panel-expanded {
  margin-top: 12px;
  padding-top: 14px;
  gap: 10px;
}

.memory-detail-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 34px;
  padding: 0 12px;
  margin-right: 8px;
  border: 1px solid rgba(224, 90, 114, 0.12);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.03);
  color: #bdaeb5;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition:
    color 0.2s ease,
    background 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease;
}

.memory-detail-chip:hover {
  transform: translateY(-1px);
  border-color: rgba(224, 90, 114, 0.2);
  color: #f0e6ea;
}

.memory-detail-chip.active {
  border-color: rgba(224, 90, 114, 0.3);
  background: rgba(224, 90, 114, 0.1);
  color: #fff1f5;
}

.memory-detail-content {
  margin-top: 4px;
  display: grid;
  gap: 8px;
}

.memory-key-explainer-arrow {
  flex-shrink: 0;
  color: #d7aeb8;
  transition: transform 0.2s ease;
}

.memory-key-explainer-arrow.expanded {
  transform: rotate(180deg);
}

.memory-key-explainer-body {
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid rgba(224, 90, 114, 0.1);
  background: rgba(48, 36, 43, 0.42);
  color: #d5c8ce;
  font-size: 12px;
  line-height: 1.8;
}

.memory-key-list-panel {
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid rgba(212, 175, 55, 0.1);
  background: rgba(54, 42, 31, 0.3);
  display: grid;
  gap: 10px;
}

.memory-key-list-group {
  display: grid;
  gap: 8px;
}

.memory-key-list-title {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: #d8c482;
}

.memory-key-list-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.memory-key-tag {
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid rgba(212, 175, 55, 0.16);
  background: rgba(255, 255, 255, 0.04);
  color: #f4e7b9;
  font-size: 11px;
  line-height: 1.4;
}

.memory-detail-toggle {
  margin-top: 14px;
  border-top: 1px solid rgba(224, 90, 114, 0.12);
  padding-top: 12px;
}

.memory-detail-summary {
  cursor: pointer;
  color: #f3de97;
  font-size: 13px;
  font-weight: 600;
  list-style: none;
  user-select: none;
}

.memory-detail-summary::-webkit-details-marker {
  display: none;
}

.memory-detail-summary::before {
  content: '▸';
  margin-right: 8px;
  color: rgba(243, 222, 151, 0.9);
}

.memory-detail-toggle[open] .memory-detail-summary::before {
  content: '▾';
}

.memory-detail-body {
  margin-top: 12px;
  display: grid;
  gap: 12px;
}

.gold-pill {
  background: rgba(212, 175, 55, 0.14);
  border-color: rgba(212, 175, 55, 0.24);
  color: #f3de97;
}

.scene-section {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.scene-stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.scene-current-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 20px 22px;
  overflow: hidden;
  border-radius: 28px;
  border: 1px solid rgba(224, 90, 114, 0.18);
  background:
    radial-gradient(circle at 10% 20%, rgba(224, 90, 114, 0.18) 0%, rgba(224, 90, 114, 0) 34%),
    radial-gradient(circle at 86% 24%, rgba(212, 175, 55, 0.1) 0%, rgba(212, 175, 55, 0) 30%),
    linear-gradient(180deg, rgba(57, 40, 49, 0.9) 0%, rgba(32, 24, 32, 0.92) 100%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 24px 40px -28px rgba(224, 90, 114, 0.26),
    0 28px 48px -34px rgba(0, 0, 0, 0.56);
  transition:
    transform 0.25s ease,
    border-color 0.25s ease,
    box-shadow 0.25s ease,
    background 0.25s ease,
    filter 0.25s ease;
}

.scene-current-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    120deg,
    rgba(255, 255, 255, 0.04) 0%,
    rgba(255, 255, 255, 0) 42%,
    rgba(224, 90, 114, 0.08) 100%
  );
  pointer-events: none;
}

.scene-current-card::after {
  content: '';
  position: absolute;
  inset: 1px;
  border-radius: 27px;
  border: 1px solid rgba(255, 255, 255, 0.03);
  pointer-events: none;
}

.scene-current-card:hover {
  transform: translateY(-3px);
  filter: brightness(1.03);
  border-color: rgba(224, 90, 114, 0.28);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    0 30px 42px -24px rgba(224, 90, 114, 0.34),
    0 0 20px rgba(224, 90, 114, 0.08);
}

.scene-current-aura {
  position: absolute;
  right: -34px;
  bottom: -42px;
  width: 180px;
  height: 180px;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(224, 90, 114, 0.16) 0%, rgba(224, 90, 114, 0) 72%);
  pointer-events: none;
}

.scene-pin {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background:
    radial-gradient(circle at 30% 28%, rgba(255, 255, 255, 0.14) 0%, rgba(255, 255, 255, 0) 48%),
    linear-gradient(180deg, rgba(60, 43, 52, 0.96) 0%, rgba(33, 25, 31, 0.96) 100%);
  color: #b7a7b0;
  font-size: 22px;
  flex-shrink: 0;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    0 16px 24px -20px rgba(0, 0, 0, 0.48);
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease,
    color 0.25s ease,
    border-color 0.25s ease;
}

.scene-current-card:hover .scene-pin,
.scene-mini-card:hover .scene-mini-pin {
  transform: scale(1.06);
}

.scene-pin-danger {
  color: #e86d85;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    0 14px 24px -18px rgba(224, 90, 114, 0.3),
    0 0 12px rgba(224, 90, 114, 0.08);
}

.scene-current-main {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.scene-current-kicker {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.26em;
  color: #de93a3;
}

.scene-current-name {
  font-size: 20px;
  font-weight: 800;
  color: #f8f4f6;
  letter-spacing: 0.01em;
  text-shadow: 0 0 16px rgba(255, 255, 255, 0.05);
}

.scene-current-subtitle {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  min-height: 28px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid rgba(212, 175, 55, 0.16);
  background: rgba(212, 175, 55, 0.08);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.22em;
  color: #d7b95d;
}

.scene-current-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.scene-current-summary-chip {
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(255, 255, 255, 0.035);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: #d6c9cf;
}

.scene-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.scene-mini-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  overflow: hidden;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: linear-gradient(180deg, rgba(39, 29, 37, 0.82) 0%, rgba(29, 22, 29, 0.82) 100%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.02),
    0 16px 24px -22px rgba(0, 0, 0, 0.4);
  transition:
    transform 0.25s ease,
    border-color 0.25s ease,
    box-shadow 0.25s ease,
    background 0.25s ease,
    filter 0.25s ease;
}

.scene-mini-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    120deg,
    rgba(224, 90, 114, 0.08) 0%,
    rgba(224, 90, 114, 0) 48%,
    rgba(255, 255, 255, 0.02) 100%
  );
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.22s ease;
}

.scene-mini-card:hover {
  transform: translateY(-2px);
  filter: brightness(1.03);
  border-color: rgba(224, 90, 114, 0.18);
  background: linear-gradient(180deg, rgba(47, 34, 43, 0.88) 0%, rgba(33, 25, 32, 0.88) 100%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.03),
    0 18px 28px -22px rgba(224, 90, 114, 0.22);
}

.scene-mini-card:hover::before {
  opacity: 1;
}

.scene-mini-card-abyss {
  border-color: rgba(255, 255, 255, 0.07);
  background:
    radial-gradient(circle at 0% 20%, rgba(224, 90, 114, 0.05) 0%, rgba(224, 90, 114, 0) 34%),
    linear-gradient(180deg, rgba(39, 29, 37, 0.84) 0%, rgba(29, 22, 29, 0.84) 100%);
}

.scene-mini-card-village {
  border-color: rgba(224, 90, 114, 0.1);
}

.scene-mini-card-forbidden {
  border-color: rgba(255, 255, 255, 0.08);
  background:
    radial-gradient(circle at 0% 20%, rgba(212, 175, 55, 0.06) 0%, rgba(212, 175, 55, 0) 34%),
    linear-gradient(180deg, rgba(40, 31, 36, 0.84) 0%, rgba(29, 23, 28, 0.84) 100%);
}

.scene-mini-card-banquet {
  border-color: rgba(224, 90, 114, 0.1);
  background:
    radial-gradient(circle at 0% 20%, rgba(224, 90, 114, 0.06) 0%, rgba(224, 90, 114, 0) 34%),
    linear-gradient(180deg, rgba(40, 30, 38, 0.84) 0%, rgba(29, 22, 31, 0.84) 100%);
}

.scene-mini-pin {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: linear-gradient(180deg, rgba(48, 35, 44, 0.9) 0%, rgba(35, 26, 33, 0.92) 100%);
  color: #9f929a;
  font-size: 16px;
  flex-shrink: 0;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
  transition:
    color 0.25s ease,
    box-shadow 0.25s ease,
    border-color 0.25s ease;
}

.scene-mini-card:hover .scene-mini-pin {
  color: #e7dbe0;
  border-color: rgba(224, 90, 114, 0.14);
  box-shadow: 0 0 12px rgba(224, 90, 114, 0.12);
}

.scene-mini-name {
  position: relative;
  z-index: 1;
  font-size: 13px;
  font-weight: 700;
  color: #f1eaed;
}

.scene-mini-note {
  position: relative;
  z-index: 1;
  margin-top: 4px;
  font-size: 10px;
  color: #9f9199;
  letter-spacing: 0.12em;
}

.scene-info-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
}

.scene-info-grid .info-card {
  background:
    radial-gradient(circle at 90% 14%, rgba(212, 175, 55, 0.08) 0%, rgba(212, 175, 55, 0) 28%),
    linear-gradient(180deg, rgba(42, 30, 39, 0.84) 0%, rgba(29, 22, 30, 0.84) 100%);
  border-color: rgba(212, 175, 55, 0.12);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.03),
    0 18px 30px -24px rgba(212, 175, 55, 0.16);
}

.scene-banquet-card {
  position: relative;
  overflow: hidden;
}

.scene-banquet-card::before {
  content: '';
  position: absolute;
  right: -42px;
  top: -52px;
  width: 180px;
  height: 180px;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(224, 90, 114, 0.08) 0%, rgba(224, 90, 114, 0) 70%);
  pointer-events: none;
}

.scene-info-grid .card-title {
  margin-bottom: 4px;
  color: #d7c089;
  letter-spacing: 0.16em;
}

.scene-banquet-head {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.scene-banquet-subtitle {
  font-size: 11px;
  color: #b6a3ab;
}

.scene-banquet-state-badge {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
}

.scene-banquet-state-badge.is-opened {
  border-color: rgba(212, 175, 55, 0.18);
  background: rgba(212, 175, 55, 0.08);
  color: #e7d39c;
}

.scene-banquet-state-badge.is-idle {
  border-color: rgba(224, 90, 114, 0.12);
  background: rgba(224, 90, 114, 0.06);
  color: #e4c5cd;
}

.scene-info-grid .card-tags {
  gap: 8px;
}

.banquet-status-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  align-items: stretch;
}

.banquet-status-card {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 6px;
  min-height: 66px;
  padding: 10px 12px;
  border-radius: 16px;
  border: 1px solid rgba(212, 175, 55, 0.14);
  background: linear-gradient(180deg, rgba(56, 42, 31, 0.42) 0%, rgba(38, 29, 33, 0.7) 100%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.03),
    0 12px 20px -20px rgba(212, 175, 55, 0.24);
}

.banquet-status-card-round {
  border-color: rgba(212, 175, 55, 0.16);
}

.banquet-status-card.is-opened {
  border-color: rgba(212, 175, 55, 0.22);
  background: linear-gradient(180deg, rgba(88, 63, 34, 0.5) 0%, rgba(48, 35, 37, 0.74) 100%);
}

.banquet-status-card.is-idle {
  border-color: rgba(224, 90, 114, 0.12);
  background: linear-gradient(180deg, rgba(50, 38, 43, 0.46) 0%, rgba(35, 27, 33, 0.7) 100%);
}

.banquet-status-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
  color: #b9a8a0;
}

.banquet-status-value {
  font-size: 13px;
  line-height: 1.4;
  font-weight: 700;
  color: #f2e6c2;
}

.banquet-status-card.is-idle .banquet-status-value {
  color: #e8d8de;
}

.scene-info-grid .feast-pill {
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(168, 121, 255, 0.16);
  border-color: rgba(168, 121, 255, 0.26);
  color: #e9dfff;
  box-shadow: 0 10px 18px -18px rgba(168, 121, 255, 0.36);
}

.info-card {
  padding: 15px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.035);
  border: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.03),
    0 16px 28px -24px rgba(224, 90, 114, 0.24);
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease;
}

.info-card:hover {
  transform: translateY(-2px);
  border-color: rgba(224, 90, 114, 0.18);
  background: rgba(255, 255, 255, 0.045);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 20px 32px -24px rgba(224, 90, 114, 0.32);
}

.info-card.wide {
  grid-column: 1 / -1;
}

.card-title {
  font-size: 11px;
  color: #bcaab2;
  margin-bottom: 8px;
}

.card-value {
  font-size: 18px;
  font-weight: 700;
}

.key-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.key-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.key-subtitle {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: #c8b8bf;
}

.key-pill {
  background: rgba(224, 90, 114, 0.12);
  border-color: rgba(224, 90, 114, 0.22);
}

.truth-pill {
  background: rgba(212, 175, 55, 0.12);
  border-color: rgba(212, 175, 55, 0.2);
}

.feast-pill {
  background: rgba(168, 121, 255, 0.14);
  border-color: rgba(168, 121, 255, 0.22);
}

.character-grid.reference-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  justify-content: start;
  gap: 18px;
}

.character-reference-card {
  position: relative;
  display: flex;
  align-items: flex-start;
  width: 100%;
  gap: 12px;
  padding: 14px 14px 15px;
  border-radius: 24px;
  border: 1px solid rgba(224, 90, 114, 0.14);
  background:
    radial-gradient(circle at 0% 0%, rgba(224, 90, 114, 0.1) 0%, rgba(224, 90, 114, 0) 34%),
    linear-gradient(180deg, rgba(54, 37, 46, 0.82) 0%, rgba(31, 24, 31, 0.92) 100%);
  color: inherit;
  overflow: hidden;
  text-align: left;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.03),
    0 20px 34px -26px rgba(0, 0, 0, 0.5);
  transition:
    transform 0.22s ease,
    border-color 0.22s ease,
    background 0.22s ease,
    box-shadow 0.22s ease,
    filter 0.22s ease;
}

.character-reference-card:hover {
  transform: translateY(-4px);
  filter: brightness(1.04);
  border-color: rgba(224, 90, 114, 0.3);
  background:
    radial-gradient(circle at 0% 0%, rgba(224, 90, 114, 0.16) 0%, rgba(224, 90, 114, 0) 36%),
    linear-gradient(180deg, rgba(67, 44, 56, 0.9) 0%, rgba(38, 29, 37, 0.96) 100%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    0 24px 40px -22px rgba(224, 90, 114, 0.34),
    0 0 0 1px rgba(224, 90, 114, 0.05);
}

.character-reference-card:hover .character-reference-name {
  color: #fff6f8;
}

.character-reference-card:hover .character-reference-location,
.character-reference-card.selected .character-reference-location {
  color: #f1e4e9;
}

.character-reference-card:hover .character-avatar-badge,
.character-reference-card.selected .character-avatar-badge {
  transform: translateY(-1px) scale(1.02);
  box-shadow:
    0 16px 26px -18px rgba(224, 90, 114, 0.36),
    0 0 20px rgba(224, 90, 114, 0.14);
}

.character-reference-card.selected {
  border-color: rgba(224, 90, 114, 0.36);
  background:
    radial-gradient(circle at 0% 0%, rgba(224, 90, 114, 0.2) 0%, rgba(224, 90, 114, 0) 34%),
    linear-gradient(180deg, rgba(73, 46, 58, 0.94) 0%, rgba(44, 30, 38, 0.96) 100%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    0 22px 36px -18px rgba(224, 90, 114, 0.38),
    0 0 24px rgba(224, 90, 114, 0.08);
}

.character-reference-card.is-present-card {
  border-color: rgba(224, 90, 114, 0.2);
}

.character-reference-card.is-absent-card {
  border-color: rgba(255, 255, 255, 0.06);
  background:
    radial-gradient(circle at 0% 0%, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0) 32%),
    linear-gradient(180deg, rgba(48, 45, 50, 0.72) 0%, rgba(30, 29, 34, 0.88) 100%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.02),
    0 16px 26px -24px rgba(0, 0, 0, 0.34);
}

.character-reference-card.is-unseen-card {
  border-color: rgba(188, 176, 189, 0.08);
  background:
    radial-gradient(circle at 0% 0%, rgba(188, 176, 189, 0.05) 0%, rgba(188, 176, 189, 0) 34%),
    linear-gradient(180deg, rgba(44, 42, 48, 0.62) 0%, rgba(25, 25, 29, 0.82) 100%);
  filter: saturate(0.82);
}

.character-reference-card.is-absent-card .character-reference-name {
  color: #ddd5d9;
}

.character-reference-card.is-unseen-card .character-reference-name {
  color: #cec5cb;
}

.character-reference-card.is-absent-card .character-reference-location {
  color: #b3aab0;
}

.character-reference-card.is-unseen-card .character-reference-location {
  color: #a39aa1;
}

.character-reference-card.is-absent-card .character-avatar-badge,
.character-reference-card.is-unseen-card .character-avatar-badge {
  border-color: rgba(255, 255, 255, 0.04);
  background:
    radial-gradient(circle at 30% 28%, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0) 48%),
    linear-gradient(180deg, rgba(84, 81, 87, 0.78) 0%, rgba(53, 51, 57, 0.92) 100%);
}

.character-reference-card.has-residual-aura {
  border-color: rgba(212, 175, 55, 0.24);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.03),
    0 20px 34px -24px rgba(212, 175, 55, 0.22),
    0 0 22px rgba(212, 175, 55, 0.05);
}

.character-reference-card.has-residual-aura::before {
  opacity: 1;
  background: linear-gradient(
    120deg,
    rgba(212, 175, 55, 0.16) 0%,
    rgba(212, 175, 55, 0) 52%,
    rgba(255, 255, 255, 0.03) 100%
  );
}

.character-reference-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    120deg,
    rgba(224, 90, 114, 0.14) 0%,
    rgba(224, 90, 114, 0) 48%,
    rgba(255, 255, 255, 0.03) 100%
  );
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.22s ease;
}

.character-reference-card::after {
  content: '';
  position: absolute;
  inset: 1px;
  border-radius: 25px;
  border: 1px solid rgba(255, 255, 255, 0.03);
  opacity: 0.95;
  pointer-events: none;
}

.character-reference-card:hover::before,
.character-reference-card.selected::before {
  opacity: 1;
}

.character-reference-aura {
  position: absolute;
  inset: auto auto -28px -18px;
  width: 96px;
  height: 96px;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(224, 90, 114, 0.16) 0%, rgba(224, 90, 114, 0) 72%);
  opacity: 0.78;
  pointer-events: none;
}

.character-reference-card.is-absent-card .character-reference-aura {
  background: radial-gradient(circle, rgba(172, 164, 171, 0.1) 0%, rgba(172, 164, 171, 0) 72%);
}

.character-reference-card.is-unseen-card .character-reference-aura {
  background: radial-gradient(circle, rgba(149, 141, 149, 0.08) 0%, rgba(149, 141, 149, 0) 72%);
}

.character-residual-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid rgba(212, 175, 55, 0.26);
  background: rgba(54, 41, 25, 0.8);
  box-shadow: 0 12px 20px -18px rgba(212, 175, 55, 0.44);
}

.character-residual-badge-ring {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: #f1d885;
  box-shadow: 0 0 10px rgba(212, 175, 55, 0.55);
}

.character-residual-badge-text {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.16em;
  color: #f4df98;
}

.character-avatar-badge {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  overflow: hidden;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background:
    radial-gradient(circle at 30% 28%, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0) 48%),
    linear-gradient(180deg, rgba(86, 60, 73, 0.9) 0%, rgba(43, 31, 39, 0.94) 100%);
  font-size: 15px;
  font-weight: 800;
  color: #f7eff3;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    0 12px 20px -18px rgba(0, 0, 0, 0.55);
  transition:
    transform 0.22s ease,
    box-shadow 0.22s ease,
    border-color 0.22s ease,
    background 0.22s ease;
}

.character-avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.character-reference-main {
  position: relative;
  z-index: 1;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 7px;
  min-width: 0;
}

.compact-reference-main {
  gap: 7px;
}

.character-reference-headline {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.compact-reference-headline {
  gap: 10px;
}

.character-reference-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 15px;
  line-height: 1.2;
  font-weight: 800;
  letter-spacing: 0.02em;
  color: #f0e7eb;
}

.character-state-pill {
  flex-shrink: 0;
  padding: 3px 8px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 10px;
  line-height: 1;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: #eadfe3;
  background: rgba(255, 255, 255, 0.05);
}

.character-state-pill.present {
  border-color: rgba(224, 90, 114, 0.28);
  background: rgba(117, 31, 54, 0.28);
  color: #ffd4dd;
}

.character-state-pill.absent {
  border-color: rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  color: #d5ccd1;
}

.character-state-pill.unseen {
  border-color: rgba(188, 176, 189, 0.12);
  background: rgba(148, 140, 148, 0.1);
  color: #c4bac1;
}

.character-reference-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  font-size: 10px;
  color: #8f8189;
  letter-spacing: 0.08em;
  white-space: nowrap;
  transition: color 0.2s ease;
}

.compact-reference-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  font-size: 12px;
  line-height: 1.35;
  letter-spacing: 0;
  white-space: normal;
}

.compact-reference-meta > span {
  overflow: visible;
  text-overflow: clip;
}

.character-reference-kicker {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.16em;
  color: #9b8b93;
}

.character-reference-location {
  color: #dbcfd4;
  font-size: 12px;
  line-height: 1.35;
}

.absent-section {
  padding: 16px 18px 4px;
  border-top: 1px solid rgba(224, 90, 114, 0.08);
  border-radius: 22px;
  background: linear-gradient(180deg, rgba(42, 30, 39, 0.54) 0%, rgba(31, 23, 31, 0.72) 100%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.02),
    0 18px 32px -28px rgba(224, 90, 114, 0.24);
}

.section-head-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 4px 2px 6px;
}

.section-tip {
  font-size: 10px;
  color: #91838c;
  letter-spacing: 0.12em;
  opacity: 0.9;
}

.section-heading-small {
  font-size: 11px;
}

.section-heading-mark-muted {
  background: rgba(255, 255, 255, 0.24);
  box-shadow: none;
}

.absent-chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.absent-chip {
  padding: 8px 12px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(32, 24, 31, 0.62);
  color: #b8aab1;
  font-size: 12px;
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    background 0.2s ease,
    color 0.2s ease,
    box-shadow 0.2s ease;
}

.absent-chip:hover {
  transform: translateY(-1px);
  border-color: rgba(224, 90, 114, 0.18);
  background: rgba(47, 32, 41, 0.8);
  color: #f2e8ec;
  box-shadow: 0 12px 20px -18px rgba(224, 90, 114, 0.3);
}

.character-detail-overlay {
  position: fixed;
  inset: 0;
  z-index: 120;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px 12px;
  background: rgba(0, 0, 0, 0.52);
  backdrop-filter: blur(8px);
}

.character-detail-modal {
  position: relative;
  width: min(100%, 440px);
  max-height: min(calc(100vh - 36px), 720px);
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  border-radius: 28px;
  border: 1px solid rgba(224, 90, 114, 0.18);
  background:
    radial-gradient(circle at 18% 0%, rgba(224, 90, 114, 0.14) 0%, rgba(224, 90, 114, 0) 30%),
    linear-gradient(180deg, rgba(35, 26, 33, 0.99) 0%, rgba(20, 16, 23, 1) 100%);
  box-shadow:
    0 28px 56px -24px rgba(0, 0, 0, 0.46),
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 0 0 1px rgba(224, 90, 114, 0.04);
}

.character-detail-modal::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.04) 0%,
    rgba(255, 255, 255, 0) 18%,
    rgba(0, 0, 0, 0.08) 100%
  );
}

.character-detail-modal::-webkit-scrollbar {
  width: 0;
  height: 0;
}

.detail-close {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  background: rgba(48, 37, 45, 0.74);
  color: #eadddf;
  font-size: 18px;
  line-height: 1;
  transition:
    transform 0.18s ease,
    background 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    color 0.18s ease;
}

.detail-close:hover {
  transform: translateY(-1px);
  border-color: rgba(224, 90, 114, 0.24);
  background: rgba(68, 44, 56, 0.9);
  color: #fff6f8;
  box-shadow: 0 14px 24px -20px rgba(224, 90, 114, 0.42);
}

.detail-modal-body {
  position: relative;
  z-index: 1;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-layout-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 10px;
  align-items: start;
}

.detail-portrait-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  border-radius: 18px;
  border: 1px solid rgba(224, 90, 114, 0.14);
  background:
    radial-gradient(circle at 86% 16%, rgba(212, 175, 55, 0.08) 0%, rgba(212, 175, 55, 0) 26%),
    linear-gradient(180deg, rgba(41, 30, 38, 0.86) 0%, rgba(26, 20, 27, 0.86) 100%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.03),
    0 16px 24px -22px rgba(0, 0, 0, 0.4);
}

.detail-portrait-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.detail-portrait-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.16em;
  color: #e2d4da;
}

.detail-portrait-tip {
  font-size: 10px;
  color: #b39fa8;
  letter-spacing: 0.08em;
}

.detail-portrait-frame {
  position: relative;
  overflow: hidden;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(23, 18, 24, 0.9);
  aspect-ratio: 3 / 4;
}

.detail-portrait-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.detail-portrait-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 18px;
  text-align: center;
  background:
    linear-gradient(180deg, rgba(54, 39, 47, 0.34) 0%, rgba(30, 24, 29, 0.48) 100%),
    repeating-linear-gradient(
      -45deg,
      rgba(255, 255, 255, 0.02) 0,
      rgba(255, 255, 255, 0.02) 10px,
      rgba(255, 255, 255, 0.01) 10px,
      rgba(255, 255, 255, 0.01) 20px
    );
}

.detail-portrait-placeholder-title {
  font-size: 14px;
  font-weight: 700;
  color: #f2e9ed;
  letter-spacing: 0.08em;
}

.detail-portrait-placeholder-text {
  font-size: 11px;
  line-height: 1.6;
  color: #b8a7af;
}

.detail-layout-main {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}

.detail-layout-side {
  min-width: 0;
}

.detail-modal-hero {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  overflow: hidden;
  border-radius: 18px;
  border: 1px solid rgba(224, 90, 114, 0.16);
  background:
    radial-gradient(circle at 14% 18%, rgba(224, 90, 114, 0.2) 0%, rgba(224, 90, 114, 0) 34%),
    radial-gradient(circle at 88% 18%, rgba(212, 175, 55, 0.09) 0%, rgba(212, 175, 55, 0) 28%),
    linear-gradient(180deg, rgba(56, 40, 49, 0.9) 0%, rgba(31, 22, 30, 0.86) 100%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 16px 24px -22px rgba(224, 90, 114, 0.3);
}

.detail-modal-hero-glow {
  position: absolute;
  inset: auto -12% -42% auto;
  width: 180px;
  height: 180px;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(224, 90, 114, 0.18) 0%, rgba(224, 90, 114, 0) 72%);
  pointer-events: none;
}

.detail-modal-hero-copy {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.detail-modal-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.detail-modal-avatar {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 62px;
  height: 62px;
  overflow: hidden;
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.14) 0%, rgba(255, 255, 255, 0.05) 100%);
  font-size: 24px;
  font-weight: 800;
}

.detail-modal-avatar-large {
  width: 50px;
  height: 50px;
  border-radius: 16px;
  font-size: 20px;
  color: #fff7fa;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    0 14px 20px -16px rgba(224, 90, 114, 0.4);
}

.detail-avatar-image {
  border-radius: inherit;
}

.detail-flag {
  font-size: 10px;
  color: #e05a72;
  letter-spacing: 0.28em;
  font-weight: 700;
}

.detail-title {
  margin-top: 2px;
  font-size: 18px;
  font-weight: 800;
  line-height: 1.1;
}

.detail-subtitle {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
  font-size: 10px;
  color: #d8c9cf;
  letter-spacing: 0.08em;
}

.detail-subtitle-divider {
  width: 5px;
  height: 5px;
  border-radius: 999px;
  background: rgba(212, 175, 55, 0.56);
  flex-shrink: 0;
}

.detail-resonance-banner {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: 10px;
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid rgba(212, 175, 55, 0.18);
  background: linear-gradient(180deg, rgba(72, 55, 34, 0.58) 0%, rgba(45, 33, 40, 0.76) 100%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 16px 24px -22px rgba(212, 175, 55, 0.26);
}

.detail-resonance-label {
  font-size: 11px;
  letter-spacing: 0.14em;
  color: #d4bd79;
}

.detail-resonance-value {
  min-width: 28px;
  text-align: center;
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(212, 175, 55, 0.12);
  border: 1px solid rgba(212, 175, 55, 0.22);
  color: #f3de97;
  font-size: 12px;
  font-weight: 700;
}

.detail-role-banner {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid rgba(212, 175, 55, 0.16);
  background: linear-gradient(180deg, rgba(64, 47, 34, 0.52) 0%, rgba(42, 31, 39, 0.72) 100%);
  font-size: 12px;
  color: #f1e5bf;
  box-shadow: 0 14px 22px -20px rgba(212, 175, 55, 0.24);
}

.detail-extra-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.detail-residual-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 14px 16px;
  border-radius: 20px;
  border: 1px solid rgba(212, 175, 55, 0.14);
  background: linear-gradient(180deg, rgba(56, 42, 28, 0.24) 0%, rgba(36, 29, 31, 0.62) 100%);
}

.detail-residual-title {
  font-size: 11px;
  letter-spacing: 0.16em;
  color: #cbb891;
}

.detail-residual-value {
  min-width: 44px;
  text-align: center;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(212, 175, 55, 0.12);
  border: 1px solid rgba(212, 175, 55, 0.22);
  color: #f3de97;
  font-size: 13px;
  font-weight: 700;
}

.detail-quote {
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid rgba(224, 90, 114, 0.12);
  background: rgba(48, 36, 43, 0.58);
  color: #ddd1d6;
  font-size: 12px;
  line-height: 1.7;
  font-style: italic;
}

.detail-grid.reference-detail-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-height: 56px;
  padding: 8px 10px;
  border-radius: 14px;
  border: 1px solid rgba(224, 90, 114, 0.12);
  background: rgba(33, 25, 31, 0.74);
}

.detail-label {
  font-size: 10px;
  color: #a6979e;
  letter-spacing: 0.16em;
}

.detail-value {
  font-size: 13px;
  font-weight: 700;
  color: #fff;
}

.detail-layout-side .reference-detail-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.attribute-row,
.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.attribute-pill {
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 10px;
  background: rgba(212, 175, 55, 0.12);
  border: 1px solid rgba(212, 175, 55, 0.18);
  color: #f2df9a;
}

.empty-text {
  font-size: 12px;
  color: #a9949d;
}

@media (max-width: 720px) {
  .hero-bar {
    grid-template-columns: 1fr;
    text-align: left;
  }

  .hero-side-right {
    text-align: left;
  }

  .micro-row-right {
    justify-content: flex-start;
  }

  .totem-button {
    justify-self: center;
  }

  .identity-panel,
  .overview-status-grid,
  .overview-dual-grid,
  .phenomenon-grid,
  .clue-grid,
  .detail-grid.reference-detail-grid {
    grid-template-columns: 1fr;
  }

  .character-grid.reference-grid {
    grid-template-columns: repeat(auto-fill, minmax(184px, 1fr));
    justify-content: center;
    gap: 14px;
  }

  .hero-inline-chips-right {
    justify-content: flex-start;
  }

  .section-head-row {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
