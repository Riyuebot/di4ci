<template>
  <div class="status-shell">
    <div class="status-card">
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
          <div class="hero-time">{{ world.当前时间段 || '未知时段' }}</div>
        </div>
      </header>

      <div class="status-strip">
        <span class="status-chip" :class="world.是否起雾 ? 'danger' : 'normal'">
          {{ world.是否起雾 ? '起雾' : '未起雾' }}
        </span>
        <span class="status-chip" :class="world.是否处于宴会阶段 ? 'danger' : 'normal'">
          {{ world.是否处于宴会阶段 ? '宴会中' : '非宴会中' }}
        </span>
        <span class="status-chip info">{{ scene.当前地点 || '未知地点' }}</span>
      </div>

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

        <section v-if="activeTab === 'overview'" class="panel-section overview-section">
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
                记忆残片
              </h3>
              <div class="memory-panel">
                <div class="memory-preview-list">
                  <button v-for="item in memoryPreview" :key="item" type="button" class="memory-preview-chip">
                    <span class="memory-preview-icon">◌</span>
                    <span>{{ item }}</span>
                  </button>
                  <div v-if="!memoryPreview.length" class="memory-preview-empty">记忆的丝线尚未交织...</div>
                </div>
                <button class="memory-panel-footer" type="button" @click="activeTab = 'clues'">
                  <span>追溯完整记忆</span>
                  <span class="memory-panel-footer-arrow">→</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        <section v-else-if="activeTab === 'present'" class="panel-section">
          <div class="section-block">
            <div class="section-head-row">
              <h3 class="section-heading">
                <span class="section-heading-mark section-heading-mark-danger"></span>
                在场众生（{{ presentList.length }}）
              </h3>
              <span class="section-tip">点击凝视角色深处</span>
            </div>

            <div class="character-grid reference-grid">
              <button
                v-for="char in presentList"
                :key="char.name"
                type="button"
                class="character-reference-card"
                :class="{ selected: selectedCharacter?.name === char.name }"
                @click="selectedCharacter = selectedCharacter?.name === char.name ? null : char"
              >
                <div class="character-avatar-badge">{{ getAvatarText(char.name) }}</div>
                <div class="character-reference-main">
                  <div class="character-reference-headline">
                    <span class="character-reference-name">{{ char.name }}</span>
                    <span class="character-reference-signal" :class="getSignalClass(char.detail)"></span>
                  </div>
                  <div class="character-reference-role">{{ getRoleText(char.detail) }}</div>
                </div>
              </button>
            </div>
          </div>

          <div v-if="absentList.length" class="section-block absent-section">
            <h3 class="section-heading section-heading-small">
              <span class="section-heading-mark section-heading-mark-muted"></span>
              离散者（{{ absentList.length }}）
            </h3>
            <div class="absent-chip-list">
              <button
                v-for="char in absentList"
                :key="char.name"
                type="button"
                class="absent-chip"
                @click="selectedCharacter = selectedCharacter?.name === char.name ? null : char"
              >
                {{ char.name }}
              </button>
            </div>
          </div>

          <div v-if="selectedCharacter" class="character-detail-overlay" @click="selectedCharacter = null">
            <div class="character-detail-modal" @click.stop>
              <button class="detail-close" type="button" aria-label="关闭角色详情" @click="selectedCharacter = null">
                ×
              </button>
              <div class="detail-modal-body">
                <div class="detail-modal-header">
                  <div class="detail-modal-avatar">{{ getAvatarText(selectedCharacter.name) }}</div>
                  <div>
                    <div class="detail-flag">角色启示</div>
                    <div class="detail-title">{{ selectedCharacter.name }}</div>
                  </div>
                </div>

                <div class="detail-role-banner">身份：{{ getRoleText(selectedCharacter.detail) }}</div>

                <div class="detail-quote">“{{ getCharacterQuote(selectedCharacter) }}”</div>

                <div class="detail-grid reference-detail-grid">
                  <div class="detail-item">
                    <span class="detail-label">在场状态</span>
                    <span class="detail-value">{{ getPresenceText(selectedCharacter.detail) }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">所在地点</span>
                    <span class="detail-value">{{ getLocationText(selectedCharacter.detail) }}</span>
                  </div>
                  <div v-for="attribute in getAttributes(selectedCharacter)" :key="attribute.label" class="detail-item">
                    <span class="detail-label">{{ attribute.label }}</span>
                    <span class="detail-value">{{ attribute.value }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section v-else class="panel-section clue-grid">
          <div class="info-card">
            <div class="card-title">已解锁线索</div>
            <div class="card-value">{{ clueCount }}</div>
          </div>
          <div class="info-card">
            <div class="card-title">已解锁真相</div>
            <div class="card-value">{{ truthCount }}</div>
          </div>
          <div class="info-card wide">
            <div class="card-title">线索回收节点</div>
            <div class="card-tags">
              <span v-for="node in recallNodes" :key="node" class="attribute-pill">
                {{ node }}
              </span>
              <span v-if="!recallNodes.length" class="empty-text">暂无</span>
            </div>
          </div>
          <div class="info-card wide key-card">
            <div class="card-title">关键剧情 Key</div>
            <div class="key-section">
              <div class="key-subtitle">角色核心 Key</div>
              <div class="card-tags">
                <span v-for="key in roleKeys" :key="key" class="attribute-pill key-pill">
                  {{ key }}
                </span>
                <span v-if="!roleKeys.length" class="empty-text">暂无</span>
              </div>
            </div>
            <div class="key-section">
              <div class="key-subtitle">路线 / 真相 Key</div>
              <div class="card-tags">
                <span v-for="key in routeAndTruthKeys" :key="key" class="attribute-pill truth-pill">
                  {{ key }}
                </span>
                <span v-if="!routeAndTruthKeys.length" class="empty-text">暂无</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useDataStore } from './store';

type TabId = 'overview' | 'present' | 'clues';
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
];

const activeTab = ref<TabId>('overview');
const collapsed = ref(false);
const selectedCharacter = ref<AnyCharacter | null>(null);

const store = useDataStore();
const world = computed(() => store.world ?? {});
const scene = computed(() => store.scene ?? {});
const clues = computed(() => store.clues ?? {});
const protagonist = computed(
  () => _.get(store.data, 'value.主角', _.get(store.data, '主角', {})) as Record<string, any>,
);
const presentList = computed<AnyCharacter[]>(() => store.presentCharacters ?? []);
const absentList = computed<AnyCharacter[]>(() => store.absentCharacters ?? []);
const feastList = computed<string[]>(() => _.get(scene.value, '当前宴会参与角色列表', []));
const clueCount = computed(() => (_.get(clues.value, '已解锁线索列表', []) as string[]).length);
const truthCount = computed(() => (_.get(clues.value, '已解锁真相列表', []) as string[]).length);
const recallNodes = computed(() => _.get(clues.value, '已触发线索回收节点列表', []) as string[]);
const roleKeys = computed(() => _.get(store.data, 'value.永久Key.已获得角色核心Key列表', []) as string[]);
const routeAndTruthKeys = computed(() => {
  const routeKeys = _.get(store.data, 'value.永久Key.已获得路线Key列表', []) as string[];
  const truthKeys = _.get(store.data, 'value.永久Key.已获得真相Key列表', []) as string[];
  return [...routeKeys, ...truthKeys];
});
const memoryPreview = computed(() => {
  const cluesList = (_.get(clues.value, '已解锁线索列表', []) as string[]).slice(0, 2);
  const truthList = (_.get(clues.value, '已解锁真相列表', []) as string[]).slice(0, 2);
  return [...cluesList, ...truthList].slice(0, 2);
});
const identityBlessing = computed(() => _.get(protagonist.value, '本轮功能身份', '未分配'));
const identityCamp = computed(() => _.get(protagonist.value, '当前阵营', '未知'));
const identityStatus = computed(() => _.get(protagonist.value, '当前状态', '清醒'));

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

function getSignalClass(detail: Record<string, any>) {
  const status = getPresenceText(detail);
  if (status === '被隔离' || status === '被关押' || status === '神隐中') return 'warning';
  if (detail.本轮功能身份 && detail.本轮功能身份 !== '未分配') return 'gold';
  return 'danger';
}

function getCharacterQuote(char: AnyCharacter) {
  if (char.type === 'female') {
    return `${char.name} 的气息压得很近，像是把什么没说出口的话一直含在舌尖。`;
  }
  return `${char.name} 看上去还算镇定，但局里的风向显然不会让人真正安心。`;
}

function getAttributes(char: AnyCharacter): Attribute[] {
  const d = char.detail;

  if (char.name === '芹泽千枝实') {
    return [
      { label: '好感', value: d.好感 ?? 0 },
      { label: '信任', value: d.信任 ?? 0 },
      { label: '阶段', value: d.深层关系阶段 ?? '未建立' },
    ];
  }
  if (char.name === '回末李花子') {
    return [
      { label: '好感', value: d.好感 ?? 0 },
      { label: '信赖', value: d.信赖 ?? 0 },
      { label: '阶段', value: d.深层关系阶段 ?? '未建立' },
    ];
  }
  if (char.name === '卷岛春') {
    return [
      { label: '依赖', value: d.依赖 ?? 0 },
      { label: '异常', value: d.异常值 ?? 0 },
      { label: '阶段', value: d.深层关系阶段 ?? '未建立' },
    ];
  }
  if (char.name === '马宫久子') {
    return [
      { label: '好感', value: d.好感 ?? 0 },
      { label: '合作', value: d.合作度 ?? 0 },
      { label: '阶段', value: d.深层关系阶段 ?? '未建立' },
    ];
  }
  if (char.name === '织部香织') {
    return [
      { label: '好感', value: d.好感 ?? 0 },
      { label: '压抑', value: d.压抑值 ?? 0 },
      { label: '阶段', value: d.深层关系阶段 ?? '未建立' },
    ];
  }
  if (char.name === '咩子') {
    return [
      { label: '依赖', value: d.依赖 ?? 0 },
      { label: '特殊', value: d.特殊性 ?? '关键角色' },
    ];
  }

  const result: Attribute[] = [];
  if (_.has(d, '当前立场')) result.push({ label: '立场', value: d.当前立场 });
  if (_.has(d, '对user态度')) result.push({ label: '态度', value: d.对user态度 });
  if (_.has(d, '好感')) result.push({ label: '好感', value: d.好感 });
  if (_.has(d, '是否掌握关键情报')) result.push({ label: '情报', value: d.是否掌握关键情报 ? '掌握' : '未知' });
  return result.slice(0, 3);
}
</script>

<style scoped>
.status-shell {
  width: 100%;
  margin: 0 auto;
  color: #f7f1f4;
}

.status-card {
  width: 100%;
  border-radius: 32px;
  overflow: hidden;
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

.hero-bar {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 18px;
  align-items: center;
  padding: 20px 24px 18px;
  border-bottom: 1px solid rgba(224, 90, 114, 0.12);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.01) 0%, rgba(255, 255, 255, 0) 100%);
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

.status-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 10px 18px 0;
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

.tab-bar {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
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
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.overview-section {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.section-block {
  display: flex;
  flex-direction: column;
  gap: 12px;
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
  gap: 14px;
  padding: 14px;
  border-radius: 26px;
  background: rgba(46, 33, 41, 0.62);
  border: 1px solid rgba(224, 90, 114, 0.16);
}

.identity-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 88px;
  padding: 14px 12px;
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
  min-height: 126px;
  padding: 18px;
  border-radius: 24px;
  background: rgba(46, 33, 41, 0.6);
  border: 1px solid rgba(224, 90, 114, 0.14);
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
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
  margin-top: 2px;
  padding: 12px 4px 0;
  border: 0;
  border-top: 1px solid rgba(224, 90, 114, 0.12);
  background: transparent;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.16em;
  color: #d4af37;
  cursor: pointer;
  transition:
    color 0.2s ease,
    transform 0.2s ease,
    text-shadow 0.2s ease;
}

.memory-panel-footer:hover {
  color: #f2c75a;
  text-shadow: 0 0 12px rgba(212, 175, 55, 0.28);
}

.memory-panel-footer:hover .memory-panel-footer-arrow {
  transform: translateX(4px);
}

.memory-panel-footer:active {
  transform: translateY(1px);
}

.memory-panel-footer-arrow {
  font-size: 13px;
  letter-spacing: 0;
  transition: transform 0.2s ease;
}

.clue-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.info-card {
  padding: 16px;
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

.character-grid.reference-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.character-reference-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 20px;
  border: 1px solid rgba(224, 90, 114, 0.16);
  background: rgba(46, 33, 41, 0.56);
  color: inherit;
  text-align: left;
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    background 0.2s ease,
    box-shadow 0.2s ease;
}

.character-reference-card.selected {
  border-color: rgba(224, 90, 114, 0.34);
  background: rgba(59, 37, 48, 0.72);
  box-shadow: 0 12px 24px -16px rgba(224, 90, 114, 0.38);
}

.character-avatar-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.04) 100%);
  font-size: 18px;
  font-weight: 800;
  color: #f5eef2;
}

.character-reference-main {
  min-width: 0;
  flex: 1;
}

.character-reference-headline {
  display: flex;
  align-items: center;
  gap: 10px;
}

.character-reference-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 15px;
  font-weight: 700;
}

.character-reference-signal {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #ef778f;
  box-shadow: 0 0 10px currentColor;
}

.character-reference-signal.gold {
  color: #d4af37;
  background: #d4af37;
}

.character-reference-signal.warning {
  color: #b995ff;
  background: #b995ff;
}

.character-reference-role {
  margin-top: 6px;
  font-size: 11px;
  color: #ab9ca3;
}

.absent-section {
  padding-top: 2px;
  border-top: 1px solid rgba(224, 90, 114, 0.08);
}

.section-head-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.section-tip {
  font-size: 10px;
  color: #91838c;
  letter-spacing: 0.12em;
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
}

.character-detail-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(8px);
}

.character-detail-modal {
  position: relative;
  width: min(100%, 420px);
  max-height: min(84vh, 680px);
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  border-radius: 36px;
  border: 1px solid rgba(224, 90, 114, 0.16);
  background: linear-gradient(180deg, rgba(32, 23, 31, 0.98) 0%, rgba(21, 17, 24, 0.99) 100%);
  box-shadow: 0 40px 80px -20px rgba(0, 0, 0, 0.52);
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
}

.detail-modal-body {
  padding: 22px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-modal-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.detail-modal-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 62px;
  height: 62px;
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.14) 0%, rgba(255, 255, 255, 0.05) 100%);
  font-size: 24px;
  font-weight: 800;
}

.detail-flag {
  font-size: 10px;
  color: #e05a72;
  letter-spacing: 0.28em;
  font-weight: 700;
}

.detail-title {
  margin-top: 6px;
  font-size: 28px;
  font-weight: 800;
  line-height: 1.1;
}

.detail-role-banner {
  display: inline-flex;
  align-items: center;
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid rgba(224, 90, 114, 0.14);
  background: rgba(40, 29, 36, 0.72);
  font-size: 12px;
  color: #efe4e8;
}

.detail-quote {
  padding: 18px 20px;
  border-radius: 20px;
  border: 1px solid rgba(224, 90, 114, 0.12);
  background: rgba(48, 36, 43, 0.58);
  color: #d2c4ca;
  font-size: 13px;
  line-height: 1.8;
  font-style: italic;
}

.detail-grid.reference-detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 92px;
  padding: 14px 16px;
  border-radius: 18px;
  border: 1px solid rgba(224, 90, 114, 0.12);
  background: rgba(33, 25, 31, 0.74);
}

.detail-label {
  font-size: 10px;
  color: #a6979e;
  letter-spacing: 0.16em;
}

.detail-value {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
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
  .overview-dual-grid,
  .phenomenon-grid,
  .clue-grid,
  .detail-grid.reference-detail-grid,
  .character-grid.reference-grid {
    grid-template-columns: 1fr;
  }

  .section-head-row {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
