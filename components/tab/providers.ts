import type { InjectionKey } from "vue";

export const VisualizationStateKey = Symbol() as InjectionKey<VisualizationState>;

type VisualizationState = {
  isExpanded(tabStart: number, notches: number, column: number): boolean
  setExpanded(tabStart: number, notches: number, value: boolean, start: number, num?: number): void
  toggleExpanded(tabStart: number, notches: number, start: number, num?: number): void
  clear(): void
};

export function createVisualizationState(): VisualizationState {
  const expanded = reactive<Set<string>>(new Set());
  const key = (tabStart: number, notches: number, column: number) => `${tabStart},${notches},${column}`;

  function isExpanded(tabStart: number, notches: number, column: number) {
    return expanded.has(key(tabStart, notches, column));
  }

  function setExpanded(tabStart: number, notches: number, value: boolean, start: number, num = 1) {
    for (let i = start; i < start + num; i++) {
      const k = key(tabStart, notches, i);
      if (value) {
        expanded.add(k);
        continue;
      }
      expanded.delete(k);
    }
  }

  function toggleExpanded(tabStart: number, notches: number, start: number, num = 1) {
    for (let i = start; i < start + num; i++) {
      const k = key(tabStart, notches, i);
      if (expanded.has(k)) {
        expanded.delete(k);
        continue;
      }
      expanded.add(k);
    }
  }

  function clear() {
    expanded.clear();
  }

  return { isExpanded, setExpanded, toggleExpanded, clear };
}