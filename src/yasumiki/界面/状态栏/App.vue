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
            <span class="status-chip" :class="dreamStabilityPercent <= 40 ? 'danger' : 'normal'">
              精神稳定度 {{ dreamStabilityPercent }}%
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
                  <button
                    class="phenomenon-card phenomenon-card-button"
                    type="button"
                    :disabled="!loopResetAvailable || loopResetPending"
                    @click="triggerLoopReset"
                  >
                    <div class="phenomenon-icon">⟳</div>
                    <div class="phenomenon-name">轮回重置</div>
                    <div class="phenomenon-note">
                      {{ loopResetPending ? '执行中…' : loopResetConfirmOpen ? '下方确认后执行' : '重新开局' }}
                    </div>
                  </button>
                  <div class="phenomenon-card phenomenon-card-note">
                    <div class="phenomenon-name">轮回说明</div>
                    <div class="phenomenon-note">会开启新一轮：永久解锁、跨轮残留和部分真相会保留；本轮身份、宴会分配与现场状态会重置，并回到最近时间点。</div>
                  </div>
                </div>
                <div v-if="loopResetConfirmOpen" class="loop-reset-confirm">
                  <div class="loop-reset-confirm-text">
                    确认后会把当前轮的现场状态重置到开局，但保留跨轮积累。
                  </div>
                  <div class="loop-reset-confirm-actions">
                    <button type="button" class="loop-reset-confirm-button loop-reset-confirm-button-cancel" @click="cancelLoopReset">
                      取消
                    </button>
                    <button
                      type="button"
                      class="loop-reset-confirm-button loop-reset-confirm-button-confirm"
                      :disabled="loopResetPending"
                      @click="confirmLoopReset"
                    >
                      {{ loopResetPending ? '执行中…' : '确认重置' }}
                    </button>
                  </div>
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
                <span class="section-tip">点击上方名册展开详情，再点一次即可收起</span>
              </div>

              <div class="character-roster-shell">
                <div v-for="(row, rowIndex) in rosterRows" :key="`roster-row-${rowIndex}`" class="character-roster-row">
                  <button
                    v-for="char in row"
                    :key="char.name"
                    type="button"
                    class="character-roster-button"
                    :class="[
                      `state-${getRosterState(char)}`,
                      {
                        selected: currentCharacter?.name === char.name,
                        'has-residual-aura': hasImportantResidualAura(char),
                      },
                    ]"
                    :aria-label="`${char.name}，${getPresenceText(char.detail)}`"
                    :title="`${char.name}｜${getPresenceText(char.detail)}`"
                    @click="toggleCharacterDetail(char)"
                  >
                    <span class="character-roster-status-dot"></span>
                    <span class="character-roster-name">{{ getRosterShortName(char.name) }}</span>
                  </button>
                </div>
              </div>
            </div>

            <div v-if="currentCharacter" class="character-inline-detail">
              <div class="character-detail-modal character-detail-inline-modal">
                <div class="detail-modal-body">
                  <div class="detail-modal-hero">
                    <div class="detail-modal-hero-glow"></div>
                    <div class="detail-modal-avatar detail-modal-avatar-large">
                      <span>{{ getAvatarText(currentCharacter.name) }}</span>
                    </div>
                    <div class="detail-modal-hero-copy">
                      <div class="detail-flag">角色启示</div>
                      <div class="detail-title">{{ currentCharacter.name }}</div>
                      <div class="detail-subtitle">
                        <span>{{ getRoleText(currentCharacter.detail) }}</span>
                        <span class="detail-subtitle-divider"></span>
                        <span>{{ getPresenceText(currentCharacter.detail) }}</span>
                      </div>
                    </div>
                  </div>

                  <div v-if="shouldShowPortrait(currentCharacter)" class="detail-portrait-card">
                    <div class="detail-portrait-head">
                      <span class="detail-portrait-label">立绘槽</span>
                      <span v-if="hasPortraitBackFace(currentCharacter.name)" class="detail-portrait-tip">点击切换立绘</span>
                      <span v-else class="detail-portrait-tip">常态立绘</span>
                    </div>
                    <div class="detail-portrait-toolbar">
                      <span class="detail-portrait-face-badge">
                        {{ isPortraitFlipped(currentCharacter.name) ? '另一面' : '常态' }}
                      </span>
                    </div>
                    <button
                      type="button"
                      class="detail-portrait-frame detail-portrait-button"
                      :class="{ interactive: hasPortraitBackFace(currentCharacter.name), swapping: portraitSwapState[currentCharacter.name] }"
                      :disabled="!hasPortraitBackFace(currentCharacter.name)"
                      @click="togglePortraitFace(currentCharacter.name)"
                    >
                      <img
                        v-if="getCurrentPortraitUrl(currentCharacter.name)"
                        :key="`${currentCharacter.name}-${getCurrentPortraitFace(currentCharacter.name)}`"
                        :src="getCurrentPortraitUrl(currentCharacter.name)"
                        :alt="`${currentCharacter.name}${isPortraitFlipped(currentCharacter.name) ? '另一面' : '常态'}立绘`"
                        class="detail-portrait-image detail-portrait-image-switch"
                      />
                      <div v-else class="detail-portrait-placeholder">
                        <span class="detail-portrait-placeholder-title">常态立绘预留</span>
                        <span class="detail-portrait-placeholder-text">在角色立绘映射里填入 normal 图床 URL 后显示</span>
                      </div>
                    </button>
                  </div>

                  <div class="detail-layout-row">
                    <div class="detail-layout-main">
                      <div v-if="hasImportantResidualAura(currentCharacter)" class="detail-resonance-banner">
                        <span class="detail-resonance-label">残留共鸣</span>
                        <span class="detail-resonance-value">{{
                          getResidualRelationValue(currentCharacter.name)
                        }}</span>
                      </div>

                      <div class="detail-role-banner">所在地点：{{ getLocationText(currentCharacter.detail) }}</div>

                      <div
                        v-if="getResidualRelationValue(currentCharacter.name) !== null"
                        class="detail-residual-card"
                      >
                        <div class="detail-residual-title">轮回后残留好感</div>
                        <div class="detail-residual-value">{{ getResidualRelationValue(currentCharacter.name) }}</div>
                      </div>

                      <div class="detail-quote">“{{ getCharacterThought(currentCharacter) }}”</div>
                    </div>

                    <div class="detail-layout-side">
                      <div class="detail-grid reference-detail-grid compact-detail-grid">
                        <div class="detail-item">
                          <span class="detail-label">在场状态</span>
                          <span class="detail-value">{{ getPresenceText(currentCharacter.detail) }}</span>
                        </div>
                        <div class="detail-item">
                          <span class="detail-label">所在地点</span>
                          <span class="detail-value">{{ getLocationText(currentCharacter.detail) }}</span>
                        </div>
                        <div
                          v-for="attribute in getAttributes(currentCharacter)"
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

            <div v-else class="character-inline-placeholder">
              <div class="character-inline-placeholder-title">角色详情已收起</div>
              <div class="character-inline-placeholder-text">点上方任意角色缩略按钮，即可在这里展开对应详情。</div>
            </div>

          </section>

          <section v-else-if="activeTab === 'clues'" key="clues" class="panel-section clue-grid">
            <div class="info-card wide">
              <div class="card-title">永久解锁进度</div>
              <div class="memory-merged-panel">
                <div class="memory-summary-card">
                  <div class="memory-single-tab-main">
                    <span class="memory-single-tab-title">永久进度</span>
                    <span class="memory-single-tab-summary">{{ memorySummaryText }}</span>
                  </div>
                  <div class="memory-summary-badges">
                    <span class="memory-summary-badge">角色 Key {{ roleKeys.length }}</span>
                    <span class="memory-summary-badge">真相 / 路线 {{ routeAndTruthKeys.length }}</span>
                  </div>
                </div>
                <div class="memory-detail-panel memory-detail-panel-expanded memory-detail-panel-merged">
                  <div class="memory-key-explainer-body">
                    这些 Key 用来记录你已经拿到的核心真相、剧情节点和路线进度。
                  </div>
                  <div class="memory-key-list-panel">
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
            </div>
          </section>

          <section v-else-if="activeTab === 'banquet'" key="banquet" class="panel-section banquet-section">
            <div class="section-head-row">
              <h3 class="section-heading">
                <span class="section-heading-mark section-heading-mark-gold"></span>
                宴会情报
              </h3>
            </div>

            <div class="scene-banquet-section">
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
                </div>
              </div>

              <div class="scene-grid">
                <div
                  v-for="node in geoLocationCards"
                  :key="node.name"
                  :class="[
                    'scene-mini-card',
                    `scene-mini-card-${node.tone}`,
                    'group-card-hover',
                    { 'scene-mini-card-active': scene.当前地点 === node.name },
                  ]"
                >
                  <div class="scene-mini-pin">⌖</div>
                  <div>
                    <div class="scene-mini-name">{{ node.name }}</div>
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

type TabId = 'overview' | 'present' | 'clues' | 'banquet' | 'scene';
type Attribute = { label: string; value: string | number | boolean };
type AnyCharacter = {
  name: string;
  type: 'female' | 'male';
  detail: Record<string, any>;
};
type CharacterWithPresence = AnyCharacter & { isPresent: boolean };

const tabs: { id: TabId; label: string }[] = [
  { id: 'overview', label: '现世' },
  { id: 'present', label: '众生' },
  { id: 'clues', label: '记忆' },
  { id: 'banquet', label: '宴会' },
  { id: 'scene', label: '地缘' },
];

const activeTab = ref<TabId>('overview');
const collapsed = ref(true);
const selectedCharacter = ref<CharacterWithPresence | null>(null);

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
const allCharacterList = computed<CharacterWithPresence[]>(() =>
  (store.mergedCharacters ?? [])
    .map((char, index) => ({ char, index }))
    .sort((left, right) => Number(right.char.isPresent) - Number(left.char.isPresent) || left.index - right.index)
    .map(({ char }) => char),
);
const rosterShortNameMap = computed<Record<string, string>>(() => {
  const used = new Set<string>();
  const map: Record<string, string> = {};

  for (const char of allCharacterList.value) {
    const chars = Array.from(char.name);
    const candidates: string[] = [];

    if (chars.length <= 2) {
      candidates.push(char.name);
    } else if (chars.length === 3) {
      candidates.push(chars.slice(0, 2).join(''), chars.slice(1).join(''), `${chars[0]}${chars[2]}`);
    } else {
      candidates.push(chars.slice(-2).join(''), chars.slice(0, 2).join(''), `${chars[0]}${chars.at(-1) ?? ''}`);
    }

    candidates.push(chars[0] ?? char.name);

    const shortName = candidates.find(candidate => candidate && !used.has(candidate)) ?? candidates[0] ?? char.name;
    used.add(shortName);
    map[char.name] = shortName;
  }

  return map;
});
const rosterRows = computed<CharacterWithPresence[][]>(() => {
  const rows: CharacterWithPresence[][] = [];
  const source = allCharacterList.value;
  const rowSize = 8;
  for (let index = 0; index < source.length; index += rowSize) {
    rows.push(source.slice(index, index + rowSize));
  }
  return rows;
});
const currentCharacter = computed<CharacterWithPresence | null>(() => {
  if (selectedCharacter.value?.name) {
    return allCharacterList.value.find(char => char.name === selectedCharacter.value?.name) ?? null;
  }
  return null;
});

function getRosterShortName(name: string) {
  return rosterShortNameMap.value[name] ?? name;
}

function getRosterState(char: CharacterWithPresence) {
  const presence = getPresenceText(char.detail);
  if (presence === '不可见') return 'unseen';
  return char.isPresent ? 'present' : 'absent';
}

function toggleCharacterDetail(char: CharacterWithPresence) {
  if (selectedCharacter.value?.name === char.name) {
    selectedCharacter.value = null;
    return;
  }

  selectedCharacter.value = char;
}
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
const dreamStabilityPercent = computed(() => _.get(crossLoop.value, '神异连续.梦境稳定度', 100));
const loopResetPending = ref(false);
const loopResetConfirmOpen = ref(false);
const loopResetAvailable = computed(() => {
  const target = (window.parent ?? window) as Window & {
    __yasumikiLoopReset?: (() => Promise<void>) | undefined;
  };
  return typeof target.__yasumikiLoopReset === 'function';
});

function getLoopResetTarget() {
  return (window.parent ?? window) as Window & {
    __yasumikiLoopReset?: (() => Promise<void>) | undefined;
  };
}

function triggerLoopReset() {
  const target = getLoopResetTarget();
  if (typeof target.__yasumikiLoopReset !== 'function') {
    toastr.warning('轮回重置入口尚未准备好');
    return;
  }

  if (loopResetPending.value || loopResetConfirmOpen.value) return;
  loopResetConfirmOpen.value = true;
}

function cancelLoopReset() {
  loopResetConfirmOpen.value = false;
}

async function confirmLoopReset() {
  const target = getLoopResetTarget();
  if (typeof target.__yasumikiLoopReset !== 'function') {
    loopResetConfirmOpen.value = false;
    toastr.warning('轮回重置入口尚未准备好');
    return;
  }

  loopResetConfirmOpen.value = false;
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
type GeoLocationTone = 'abyss' | 'village' | 'forbidden' | 'banquet';
type GeoLocationCard = {
  name: string;
  tone: GeoLocationTone;
};
const geoLocationCards = computed<GeoLocationCard[]>(() => [
  { name: '学生公寓', tone: 'village' },
  { name: '村中', tone: 'village' },
  { name: '村中食堂', tone: 'village' },
  { name: '集会堂', tone: 'banquet' },
  { name: '皿永滩', tone: 'abyss' },
  { name: '首吊松', tone: 'abyss' },
  { name: '洋馆', tone: 'banquet' },
  { name: '回末住处', tone: 'forbidden' },
  { name: '休水村落路口', tone: 'forbidden' },
  { name: '休水村落小道', tone: 'forbidden' },
]);
const identityAssignments = computed(() => {
  const record = _.get(banquet.value, '本轮身份分配表', {}) as Record<string, string>;
  return Object.entries(record).map(([label, value]) => ({ label, value }));
});

type PortraitFaceId = 'normal' | 'nsfw';

type PortraitFaces = {
  normal: string;
  nsfw: string;
};

const characterPortraitUrlMap: Partial<Record<string, PortraitFaces>> = {
  芹泽千枝实: { normal: 'https://img.213964.xyz/qzs.png', nsfw: 'https://img.213964.xyz/qzsnsfw.png' },
  回末李花子: { normal: 'https://img.213964.xyz/lihuazi.png', nsfw: 'https://img.213964.xyz/lihuazinsfw.png' },
  马宫久子: { normal: 'https://img.213964.xyz/magongjiuzi.png', nsfw: 'https://img.213964.xyz/magongjiuzinsfw.png' },
  织部香织: { normal: 'https://img.213964.xyz/zhibuxiangzhi.png', nsfw: 'https://img.213964.xyz/zhibuxiangzhinsfw.png' },
  卷岛春: { normal: 'https://img.213964.xyz/chun.png', nsfw: 'https://img.213964.xyz/chunnsfw.png' },
  咩子: { normal: 'https://img.213964.xyz/miezi.png', nsfw: '' },
  美佐峰美辻: { normal: 'https://img.213964.xyz/meizuofeng.png', nsfw: 'https://img.213964.xyz/meizuofengnsfw.png' },
};

const portraitFaceState = ref<Partial<Record<string, PortraitFaceId>>>({});
const portraitSwapState = ref<Partial<Record<string, boolean>>>({});

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

function shouldShowPortrait(char: AnyCharacter) {
  return char.type === 'female' && char.name !== '山胁多惠';
}

function hasPortraitBackFace(name: string) {
  const faces = characterPortraitUrlMap[name];
  if (!faces) return false;
  return Boolean(faces.nsfw?.trim());
}

function getPortraitFaceUrl(name: string, face: PortraitFaceId) {
  const faces = characterPortraitUrlMap[name];
  return faces?.[face]?.trim() ?? '';
}

function isPortraitFlipped(name: string) {
  return portraitFaceState.value[name] === 'nsfw';
}

function getCurrentPortraitFace(name: string): PortraitFaceId {
  return isPortraitFlipped(name) ? 'nsfw' : 'normal';
}

function getCurrentPortraitUrl(name: string) {
  return getPortraitFaceUrl(name, getCurrentPortraitFace(name));
}

function togglePortraitFace(name: string) {
  if (!hasPortraitBackFace(name)) return;
  portraitSwapState.value[name] = true;
  portraitFaceState.value[name] = portraitFaceState.value[name] === 'nsfw' ? 'normal' : 'nsfw';
  window.setTimeout(() => {
    portraitSwapState.value[name] = false;
  }, 220);
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
  const commonFemaleAttributes = [
    { label: '好感', value: d.好感 ?? 0 },
    { label: '信任', value: d.信任 ?? 0 },
    { label: '欲望', value: d.欲望 ?? 0 },
  ];

  if (char.name === '芹泽千枝实') {
    return commonFemaleAttributes;
  }
  if (char.name === '回末李花子') {
    return commonFemaleAttributes;
  }
  if (char.name === '卷岛春') {
    return commonFemaleAttributes;
  }
  if (char.name === '马宫久子') {
    return commonFemaleAttributes;
  }
  if (char.name === '织部香织') {
    return commonFemaleAttributes;
  }
  if (char.name === '咩子') {
    return commonFemaleAttributes;
  }
  if (char.name === '美佐峰美辻') {
    return commonFemaleAttributes;
  }

  const result: Attribute[] = [];
  if (_.has(d, '对user态度')) result.push({ label: '对你的态度', value: d.对user态度 });
  if (_.has(d, '好感')) result.push({ label: '好感', value: d.好感 });
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
  grid-template-columns: repeat(5, minmax(0, 1fr));
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

.loop-reset-confirm {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 20px;
  border: 1px solid rgba(224, 90, 114, 0.18);
  background: rgba(52, 31, 40, 0.76);
}

.loop-reset-confirm-text {
  font-size: 12px;
  line-height: 1.6;
  color: #d9c8cf;
}

.loop-reset-confirm-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
}

.loop-reset-confirm-button {
  min-width: 92px;
  padding: 10px 14px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: #f8f4f6;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    background 0.2s ease,
    opacity 0.2s ease;
}

.loop-reset-confirm-button:hover:not(:disabled) {
  transform: translateY(-1px);
}

.loop-reset-confirm-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.loop-reset-confirm-button-cancel {
  border-color: rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
  color: #cbbbc3;
}

.loop-reset-confirm-button-confirm {
  border-color: rgba(224, 90, 114, 0.28);
  background: rgba(224, 90, 114, 0.14);
  color: #ffe3ea;
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

.memory-merged-panel {
  margin-top: 4px;
  display: grid;
  gap: 12px;
}

.memory-summary-card {
  display: grid;
  gap: 10px;
  padding: 14px 16px;
  border-radius: 18px;
  border: 1px solid rgba(224, 90, 114, 0.14);
  background: linear-gradient(180deg, rgba(44, 32, 40, 0.78) 0%, rgba(31, 24, 31, 0.82) 100%);
  box-shadow: 0 14px 22px -20px rgba(224, 90, 114, 0.18);
}

.memory-summary-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.memory-summary-badge {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid rgba(224, 90, 114, 0.12);
  background: rgba(255, 255, 255, 0.04);
  color: #d7c7ce;
  font-size: 11px;
  font-weight: 700;
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

.compact-memory-text {
  line-height: 1.8;
  white-space: normal;
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

.memory-detail-panel-merged {
  margin-top: 0;
  padding-top: 0;
  border-top: 0;
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

.scene-mini-card-active {
  border-color: rgba(224, 90, 114, 0.26);
  background:
    radial-gradient(circle at 0% 20%, rgba(224, 90, 114, 0.1) 0%, rgba(224, 90, 114, 0) 36%),
    linear-gradient(180deg, rgba(53, 37, 47, 0.9) 0%, rgba(35, 26, 35, 0.9) 100%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 18px 28px -22px rgba(224, 90, 114, 0.26);
}

.scene-mini-card-active::before {
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

.scene-mini-card-active .scene-mini-pin {
  color: #f5e7eb;
  border-color: rgba(224, 90, 114, 0.24);
  box-shadow: 0 0 14px rgba(224, 90, 114, 0.16);
}

.scene-mini-name {
  position: relative;
  z-index: 1;
  font-size: 13px;
  font-weight: 700;
  color: #f1eaed;
}

.scene-banquet-section .info-card {
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

.scene-banquet-section .card-title {
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

.scene-banquet-card .card-tags {
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

.scene-banquet-card .feast-pill {
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

.character-roster-shell {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.character-roster-row {
  display: grid;
  grid-template-columns: repeat(8, minmax(0, 1fr));
  gap: 6px;
}

.character-roster-button {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  padding: 6px 2px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background:
    radial-gradient(circle at 50% 0%, rgba(224, 90, 114, 0.08) 0%, rgba(224, 90, 114, 0) 70%),
    linear-gradient(180deg, rgba(48, 37, 45, 0.9) 0%, rgba(28, 22, 28, 0.96) 100%);
  color: #ece2e7;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    background 0.18s ease,
    color 0.18s ease;
}

.character-roster-button:hover {
  transform: translateY(-1px);
  border-color: rgba(224, 90, 114, 0.18);
}

.character-roster-button.selected {
  border-color: rgba(224, 90, 114, 0.34);
  background:
    radial-gradient(circle at 50% 0%, rgba(224, 90, 114, 0.18) 0%, rgba(224, 90, 114, 0) 72%),
    linear-gradient(180deg, rgba(76, 43, 58, 0.96) 0%, rgba(43, 28, 36, 0.98) 100%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 18px 28px -24px rgba(224, 90, 114, 0.46);
  color: #fff6f8;
}

.character-roster-button.has-residual-aura {
  border-color: rgba(212, 175, 55, 0.28);
}

.character-roster-button.state-present {
  box-shadow: inset 0 0 0 1px rgba(224, 90, 114, 0.08);
}

.character-roster-button.state-absent {
  background:
    radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0) 70%),
    linear-gradient(180deg, rgba(46, 43, 49, 0.88) 0%, rgba(29, 27, 32, 0.96) 100%);
  color: #d4ccd1;
}

.character-roster-button.state-unseen {
  background:
    radial-gradient(circle at 50% 0%, rgba(188, 176, 189, 0.06) 0%, rgba(188, 176, 189, 0) 70%),
    linear-gradient(180deg, rgba(41, 39, 44, 0.84) 0%, rgba(24, 24, 28, 0.94) 100%);
  color: #c7bdc4;
}

.character-roster-status-dot {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.22);
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.18);
}

.character-roster-button.state-present .character-roster-status-dot {
  background: #f17086;
  box-shadow: 0 0 12px rgba(241, 112, 134, 0.44);
}

.character-roster-button.state-absent .character-roster-status-dot {
  background: #a9a0a6;
  box-shadow: 0 0 10px rgba(169, 160, 166, 0.22);
}

.character-roster-button.state-unseen .character-roster-status-dot {
  background: #d4af37;
  box-shadow: 0 0 10px rgba(212, 175, 55, 0.3);
}

.character-roster-name {
  display: block;
  overflow: hidden;
  font-size: 11px;
  line-height: 1.1;
  font-weight: 800;
  letter-spacing: 0.02em;
  text-overflow: clip;
  white-space: nowrap;
}

.character-avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.detail-portrait-toolbar {
  display: flex;
  justify-content: flex-end;
}

.detail-portrait-face-badge {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: #dfd3d8;
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

.character-inline-detail {
  position: relative;
}

.character-inline-placeholder {
  display: grid;
  gap: 8px;
  padding: 14px 16px;
  border-radius: 18px;
  border: 1px dashed rgba(224, 90, 114, 0.18);
  background: rgba(39, 30, 37, 0.56);
  color: #d8ccd1;
}

.character-inline-placeholder-title {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: #f0e5e9;
}

.character-inline-placeholder-text {
  font-size: 12px;
  line-height: 1.65;
  color: #b9a9b1;
}

.character-detail-inline-modal {
  width: 100%;
  max-width: none;
  max-height: none;
  overflow: visible;
  border-radius: 24px;
}

@media (min-width: 721px) {
  .character-detail-modal.character-detail-inline-modal {
    width: 100%;
    max-width: none;
    max-height: none;
    overflow: visible;
  }

  .character-detail-modal.character-detail-inline-modal .detail-modal-body {
    display: grid;
    grid-template-columns: minmax(280px, 340px) minmax(0, 1fr);
    gap: 14px 16px;
    align-items: start;
  }

  .character-detail-modal.character-detail-inline-modal .detail-modal-hero {
    grid-column: 1;
    margin: 0;
  }

  .character-detail-modal.character-detail-inline-modal .detail-portrait-card {
    grid-column: 1;
    margin: 0;
  }

  .character-detail-modal.character-detail-inline-modal .detail-layout-row {
    grid-column: 2;
    grid-row: 1 / span 2;
    gap: 12px;
  }

  .character-detail-modal.character-detail-inline-modal .detail-layout-side .reference-detail-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
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

.detail-portrait-image-switch {
  animation: portraitFadeSwap 0.22s ease;
}

.detail-portrait-button.interactive:active {
  transform: scale(0.985);
}

.detail-portrait-button.swapping .detail-portrait-image-switch {
  filter: saturate(1.02) brightness(1.02);
}

@keyframes portraitFadeSwap {
  0% {
    opacity: 0.4;
    transform: scale(0.985);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.empty-text {
  font-size: 12px;
  color: #a9949d;
}

@media (max-width: 720px) {
  .status-card {
    border-radius: 24px;
  }

  .hero-bar {
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 12px 10px;
    padding: 14px 16px 12px;
    text-align: left;
  }

  .hero-side-left {
    grid-column: 1 / -1;
  }

  .hero-side-right {
    grid-column: 1;
    grid-row: 2;
    text-align: left;
  }

  .micro-row-right {
    justify-content: flex-start;
  }

  .micro-row {
    margin-bottom: 4px;
  }

  .hero-title {
    font-size: 20px;
  }

  .hero-meta {
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 6px;
  }

  .hero-date {
    font-size: 16px;
  }

  .hero-time {
    margin-top: 4px;
    letter-spacing: 0.14em;
  }

  .totem-button {
    grid-column: 2;
    grid-row: 2;
    justify-self: end;
    width: 60px;
    height: 60px;
  }

  .totem-shell {
    inset: 8px;
  }

  .totem-svg {
    width: 44px;
    height: 44px;
  }

  .hero-inline-chips {
    margin-top: 8px;
    gap: 6px;
  }

  .status-chip {
    padding: 5px 8px;
    font-size: 10px;
  }

  .panel-body {
    padding: 14px 16px 16px;
  }

  .tab-bar {
    margin-bottom: 14px;
    padding: 8px;
    gap: 8px;
  }

  .tab-button {
    padding: 12px 6px;
    font-size: 11px;
    letter-spacing: 0.08em;
  }

  .panel-section {
    gap: 14px;
  }

  .overview-section {
    gap: 14px;
  }

  .section-block {
    gap: 8px;
  }

  .overview-status-grid,
  .overview-dual-grid,
  .clue-grid {
    grid-template-columns: 1fr;
  }

  .identity-panel {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
    padding: 8px;
  }

  .identity-card {
    min-height: 72px;
    padding: 10px 6px;
    gap: 6px;
    border-radius: 16px;
  }

  .identity-value {
    font-size: 14px;
  }

  .overview-dual-grid {
    gap: 12px;
  }

  .phenomenon-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .phenomenon-card {
    min-height: 92px;
    padding: 12px;
    border-radius: 18px;
  }

  .loop-reset-confirm {
    padding: 10px 12px;
  }

  .memory-merged-panel {
    gap: 10px;
  }

  .memory-summary-card {
    padding: 12px 14px;
    gap: 8px;
    border-radius: 16px;
  }

  .memory-summary-badges {
    gap: 6px;
  }

  .memory-summary-badge {
    min-height: 28px;
    padding: 0 9px;
    font-size: 10px;
  }

  .character-roster-shell {
    gap: 6px;
  }

  .character-roster-row {
    gap: 5px;
  }

  .character-roster-button {
    min-height: 38px;
    padding: 5px 2px;
    border-radius: 12px;
  }

  .character-roster-status-dot {
    top: 5px;
    right: 5px;
    width: 6px;
    height: 6px;
  }

  .character-roster-name {
    font-size: 10px;
  }

  .character-detail-inline-modal {
    border-radius: 20px;
  }

  .character-inline-placeholder {
    padding: 12px 14px;
    gap: 6px;
    border-radius: 16px;
  }

  .character-inline-placeholder-title {
    font-size: 12px;
  }

  .character-inline-placeholder-text {
    font-size: 11px;
    line-height: 1.5;
  }

  .detail-modal-body {
    padding: 10px;
    gap: 10px;
  }

  .detail-modal-hero {
    gap: 8px;
    padding: 10px;
    border-radius: 16px;
  }

  .detail-modal-avatar-large {
    width: 42px;
    height: 42px;
    border-radius: 14px;
    font-size: 18px;
  }

  .detail-flag {
    font-size: 9px;
    letter-spacing: 0.2em;
  }

  .detail-title {
    font-size: 16px;
  }

  .detail-subtitle {
    margin-top: 4px;
    gap: 6px;
    font-size: 9px;
  }

  .detail-portrait-card {
    padding: 10px;
    gap: 8px;
    border-radius: 16px;
  }

  .detail-layout-main {
    gap: 10px;
  }

  .detail-role-banner {
    padding: 6px 10px;
    font-size: 11px;
  }

  .detail-resonance-banner {
    gap: 8px;
    padding: 6px 10px;
  }

  .detail-resonance-label {
    font-size: 10px;
  }

  .detail-resonance-value {
    min-width: 24px;
    padding: 3px 7px;
    font-size: 11px;
  }

  .detail-residual-card {
    gap: 10px;
    padding: 10px 12px;
    border-radius: 16px;
  }

  .detail-residual-title {
    font-size: 10px;
  }

  .detail-residual-value {
    min-width: 36px;
    padding: 4px 8px;
    font-size: 12px;
  }

  .detail-quote {
    padding: 10px 12px;
    border-radius: 12px;
    font-size: 11px;
    line-height: 1.55;
  }

  .detail-grid.reference-detail-grid,
  .detail-layout-side .reference-detail-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 6px;
  }

  .detail-item {
    min-height: 0;
    padding: 8px 9px;
    border-radius: 12px;
  }

  .detail-label {
    font-size: 9px;
    letter-spacing: 0.12em;
  }

  .detail-value {
    font-size: 12px;
    line-height: 1.2;
  }

  .hero-inline-chips-right {
    justify-content: flex-start;
  }

  .section-head-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .section-tip {
    font-size: 10px;
  }
}

@media (max-width: 480px) {
  .memory-summary-card {
    padding: 10px 12px;
    border-radius: 14px;
  }

  .memory-summary-badge {
    min-height: 24px;
    padding: 0 8px;
    font-size: 9px;
  }

  .character-roster-row {
    gap: 4px;
  }

  .character-roster-button {
    min-height: 34px;
    padding: 4px 1px;
    border-radius: 10px;
  }

  .character-roster-status-dot {
    top: 4px;
    right: 4px;
    width: 5px;
    height: 5px;
  }

  .character-roster-name {
    font-size: 9px;
  }

  .character-detail-inline-modal {
    border-radius: 18px;
  }

  .character-inline-placeholder {
    padding: 10px 12px;
    border-radius: 14px;
  }

  .character-inline-placeholder-title {
    font-size: 11px;
  }

  .character-inline-placeholder-text {
    font-size: 10px;
    line-height: 1.45;
  }

  .detail-modal-body {
    padding: 8px;
    gap: 8px;
  }

  .detail-modal-hero {
    padding: 8px;
    gap: 8px;
    border-radius: 14px;
  }

  .detail-modal-avatar-large {
    width: 38px;
    height: 38px;
    border-radius: 12px;
    font-size: 16px;
  }

  .detail-title {
    font-size: 15px;
  }

  .detail-subtitle {
    gap: 5px;
    font-size: 8px;
  }

  .detail-role-banner {
    padding: 5px 9px;
    font-size: 10px;
  }

  .detail-resonance-banner,
  .detail-residual-card {
    padding: 8px 10px;
  }

  .detail-quote {
    padding: 8px 10px;
    font-size: 10px;
    line-height: 1.45;
  }

  .detail-grid.reference-detail-grid,
  .detail-layout-side .reference-detail-grid {
    gap: 5px;
  }

  .detail-item {
    padding: 7px 8px;
    border-radius: 10px;
  }

  .detail-label {
    font-size: 8px;
  }

  .detail-value {
    font-size: 11px;
  }

  .section-tip {
    display: none;
  }
}
</style>
