<template>
  <div class="status-shell">
    <div class="status-card">
      <header class="top-bar">
        <div class="chapter-group">
          <div class="label-row">
            <span class="dot dot-accent"></span>
            <span class="micro-label">当前章节</span>
          </div>
          <div class="chapter-title">{{ world.当前章节 || '未定章节' }}</div>
          <div class="meta-line">
            <span class="route-pill">{{ world.当前路线 || '未定路线' }}</span>
            <span class="divider">·</span>
            <span>第 {{ world.当前轮回编号 || 1 }} 轮</span>
          </div>
        </div>

        <button class="sheep-button" type="button" @click="collapsed = !collapsed">
          <span class="sheep-core">咩</span>
        </button>

        <div class="time-group">
          <div class="label-row right">
            <span class="micro-label">时空坐标</span>
            <span class="dot dot-gold"></span>
          </div>
          <div class="date-text">{{ world.当前日期 || '未知日期' }}</div>
          <div class="time-text">{{ world.当前时间段 || '未知时段' }}</div>
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
            {{ tab.label }}
          </button>
        </nav>

        <section v-if="activeTab === 'overview'" class="panel-section overview-grid">
          <div class="info-card">
            <div class="card-title">地点</div>
            <div class="card-value">{{ scene.当前地点 || '未知地点' }}</div>
          </div>
          <div class="info-card">
            <div class="card-title">在场人数</div>
            <div class="card-value">{{ presentList.length }}</div>
          </div>
          <div class="info-card">
            <div class="card-title">缺席人数</div>
            <div class="card-value">{{ absentList.length }}</div>
          </div>
          <div class="info-card">
            <div class="card-title">宴会参与</div>
            <div class="card-value">{{ feastList.length }}</div>
          </div>
        </section>

        <section v-else-if="activeTab === 'present'" class="panel-section">
          <div class="character-grid">
            <button
              v-for="char in presentList"
              :key="char.name"
              type="button"
              class="character-card"
              :class="{ selected: selectedCharacter?.name === char.name }"
              @click="selectedCharacter = selectedCharacter?.name === char.name ? null : char"
            >
              <div class="character-head">
                <div class="character-name">{{ char.name }}</div>
                <div class="character-role">{{ getRoleText(char.detail) }}</div>
              </div>
              <div class="character-line">状态：{{ getPresenceText(char.detail) }}</div>
              <div class="character-line">地点：{{ getLocationText(char.detail) }}</div>
              <div class="attribute-row">
                <span v-for="attribute in getAttributes(char)" :key="attribute.label" class="attribute-pill">
                  {{ attribute.label }} {{ attribute.value }}
                </span>
              </div>
            </button>
          </div>

          <div v-if="selectedCharacter" class="character-detail">
            <div class="detail-title">{{ selectedCharacter.name }}</div>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">在场状态</span>
                <span class="detail-value">{{ getPresenceText(selectedCharacter.detail) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">所在地点</span>
                <span class="detail-value">{{ getLocationText(selectedCharacter.detail) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">功能身份</span>
                <span class="detail-value">{{ getRoleText(selectedCharacter.detail) }}</span>
              </div>
              <div v-for="attribute in getAttributes(selectedCharacter)" :key="attribute.label" class="detail-item">
                <span class="detail-label">{{ attribute.label }}</span>
                <span class="detail-value">{{ attribute.value }}</span>
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

const tabs: { id: TabId; label: string }[] = [
  { id: 'overview', label: '概览' },
  { id: 'present', label: '在场' },
  { id: 'clues', label: '线索' },
];

const activeTab = ref<TabId>('overview');
const collapsed = ref(false);
const selectedCharacter = ref<AnyCharacter | null>(null);

const store = useDataStore();
const world = computed(() => store.world ?? {});
const scene = computed(() => store.scene ?? {});
const clues = computed(() => store.clues ?? {});
const presentList = computed<AnyCharacter[]>(() => store.presentCharacters ?? []);
const absentList = computed<AnyCharacter[]>(() => store.absentCharacters ?? []);
const feastList = computed<string[]>(() => _.get(scene.value, '当前宴会参与角色列表', []));
const clueCount = computed(() => (_.get(clues.value, '已解锁线索列表', []) as string[]).length);
const truthCount = computed(() => (_.get(clues.value, '已解锁真相列表', []) as string[]).length);
const recallNodes = computed(() => _.get(clues.value, '已触发线索回收节点列表', []) as string[]);

function getPresenceText(detail: Record<string, any>) {
  return detail.当前在场状态 ?? '未知';
}

function getLocationText(detail: Record<string, any>) {
  return detail.当前所在地点 ?? '未知';
}

function getRoleText(detail: Record<string, any>) {
  return detail.本轮功能身份 ?? '未分配';
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
  border-radius: 28px;
  overflow: hidden;
  background: linear-gradient(180deg, rgba(32, 22, 34, 0.95) 0%, rgba(22, 16, 24, 0.96) 100%);
  border: 1px solid rgba(224, 90, 114, 0.22);
  box-shadow: 0 20px 40px -20px rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(16px);
}

.top-bar {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 12px;
  align-items: center;
  padding: 16px 18px 12px;
  border-bottom: 1px solid rgba(224, 90, 114, 0.12);
}

.chapter-group,
.time-group {
  min-width: 0;
}

.time-group {
  text-align: right;
}

.label-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.label-row.right {
  justify-content: flex-end;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
}

.dot-accent {
  background: #e05a72;
}

.dot-gold {
  background: #d4af37;
}

.micro-label {
  font-size: 10px;
  letter-spacing: 0.2em;
  color: #bcaab2;
}

.chapter-title,
.date-text {
  font-size: 18px;
  font-weight: 600;
}

.meta-line,
.time-text {
  margin-top: 2px;
  font-size: 11px;
  color: #c3aeb4;
}

.route-pill {
  color: #e98a9b;
}

.divider {
  opacity: 0.4;
  margin: 0 4px;
}

.sheep-button {
  width: 48px;
  height: 48px;
  border: 1px solid rgba(224, 90, 114, 0.25);
  border-radius: 999px;
  background: radial-gradient(circle, rgba(224, 90, 114, 0.22) 0%, rgba(224, 90, 114, 0.05) 70%);
  color: #fff;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    border-color 0.2s ease;
}

.sheep-button:hover {
  transform: scale(1.04);
  border-color: rgba(224, 90, 114, 0.45);
}

.sheep-core {
  font-size: 18px;
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
  padding: 14px 18px 18px;
}

.tab-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
}

.tab-button {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.03);
  color: #c5b2b8;
  cursor: pointer;
}

.tab-button.active {
  background: rgba(224, 90, 114, 0.14);
  color: #fff;
  border-color: rgba(224, 90, 114, 0.24);
}

.panel-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.overview-grid,
.clue-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.info-card {
  padding: 14px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.035);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.info-card.wide {
  grid-column: 1 / -1;
}

.card-title {
  font-size: 11px;
  color: #bcaab2;
  margin-bottom: 6px;
}

.card-value {
  font-size: 16px;
  font-weight: 600;
}

.character-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
}

.character-card {
  text-align: left;
  padding: 12px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  color: inherit;
  cursor: pointer;
}

.character-card.selected {
  border-color: rgba(224, 90, 114, 0.4);
  background: rgba(224, 90, 114, 0.08);
}

.character-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 8px;
}

.character-name {
  font-size: 14px;
  font-weight: 600;
}

.character-role,
.character-line {
  font-size: 11px;
  color: #c5b2b8;
}

.character-line {
  margin-bottom: 4px;
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

.character-detail {
  padding: 14px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.035);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.detail-title {
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 10px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-label {
  font-size: 10px;
  color: #bcaab2;
}

.detail-value {
  font-size: 13px;
  color: #fff;
}

.empty-text {
  font-size: 12px;
  color: #a9949d;
}

@media (max-width: 720px) {
  .top-bar {
    grid-template-columns: 1fr;
    text-align: left;
  }

  .time-group {
    text-align: left;
  }

  .label-row.right {
    justify-content: flex-start;
  }

  .sheep-button {
    justify-self: start;
  }

  .overview-grid,
  .clue-grid,
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
