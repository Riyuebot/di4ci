import { SchemaObject } from '@/yasumiki/schema';
import { defineMvuDataStore } from '@util/mvu';
import { defineStore } from 'pinia';
import { computed } from 'vue';

type CharacterRecord = {
  name: string;
  type: 'female' | 'male';
  detail: Record<string, any>;
};

const useMvuStore = defineMvuDataStore(SchemaObject, { type: 'message', message_id: getCurrentMessageId() });

export const useDataStore = defineStore('yasumiki-status-bar', () => {
  const mvuStore = useMvuStore();
  const statData = computed(() => mvuStore.data);

  const world = computed(() => statData.value.世界 ?? {});
  const scene = computed(() => statData.value.场景 ?? {});
  const clues = computed(() => statData.value.线索与真相 ?? {});
  const femaleCharacters = computed(() => statData.value.角色?.女性角色 ?? {});
  const maleCharacters = computed(() => statData.value.角色?.男性角色 ?? {});

  const allCharacters = computed<CharacterRecord[]>(() => {
    const female = Object.entries(femaleCharacters.value).map(([name, detail]) => ({
      name,
      type: 'female' as const,
      detail: (detail ?? {}) as Record<string, any>,
    }));
    const male = Object.entries(maleCharacters.value).map(([name, detail]) => ({
      name,
      type: 'male' as const,
      detail: (detail ?? {}) as Record<string, any>,
    }));
    return [...female, ...male];
  });

  const presentNames = computed(() => new Set<string>((scene.value.在场角色列表 ?? []) as string[]));

  const presentCharacters = computed(() => allCharacters.value.filter(char => presentNames.value.has(char.name)));
  const absentCharacters = computed(() => allCharacters.value.filter(char => !presentNames.value.has(char.name)));

  return {
    data: statData,
    statData,
    world,
    scene,
    clues,
    presentCharacters,
    absentCharacters,
  };
});
