<script lang="ts" setup>
import type { GuitarNote } from "~/model/data";
import {
  SelectionInjectionKey,
  type SelectionState,
} from "../state/selection-state";
import { TieAddInjectionKey, type TieAddState } from "./state/tie-add-state";
import { EditingInjectionKey, type EditingState } from "../state/editing-state";
import {
  CellHoverInjectionKey,
  type CellHoverEvents,
} from "../state/cell-hover-events";

const props = withDefaults(
  defineProps<{
    data?: GuitarNote;
    string: number;
    position: number;
    tuning: Midi;
    frets: number;
    startFocused?: boolean;
    blockingColor?: string;
    hovering?: boolean;
  }>(),
  {
    data: undefined,
    blockingColor: "white",
  },
);

const emit = defineEmits<{
  noteChange: [data: GuitarNote];
  noteDelete: [];
  // TODO: remove if unused
  focus: [];
  blur: [];
}>();

const { editingNote, setEditing } = inject(EditingInjectionKey) as EditingState;
const { hover } = inject(CellHoverInjectionKey) as CellHoverEvents;

const input = ref<HTMLInputElement>();

function focus() {
  input.value!.focus();
  input.value!.select();
  setEditing(props.string, props.position);
  emit("focus");
}

const isEditing = computed(
  () =>
    editingNote?.position === props.position &&
    editingNote?.string === props.string,
);

defineExpose({ focus });

function onBlur(e: Event) {
  emit("blur");
}

const noteText = computed(() => {
  if (props.data) {
    if (props.data.note === "muted") {
      return "⨯";
    }
    return (props.data.note - props.tuning) as Midi;
  }
  return "";
});

const hasNote = computed(() => noteText.value !== "");

function onInput(e: Event) {
  const target = e.target as HTMLInputElement;
  const trimmed = target.value.trim();
  if (trimmed == "") {
    emit("noteDelete");
    return;
  }
  if (["m", "M", "x", "X"].includes(trimmed)) {
    emit("noteChange", { note: "muted" });
  }
  const num = parseInt(target.value);
  if (Number.isInteger(num)) {
    if (num < 1 || num > props.frets) {
      target.value = `${noteText.value}`;
      return;
    }
    emit("noteChange", { note: (props.tuning + num) as Midi });
    return;
  }
  target.value = `${noteText.value}`;
}

onMounted(() => {
  if (props.startFocused) {
    focus();
  }
});

function onClick(e: MouseEvent) {
  focus();
}

// function onSideMouseDown(e: MouseEvent) {
//   tieAdd.start(props.string, props.position, props.data!.midi!);
//   e.stopImmediatePropagation();
// }
</script>

<template>
  <div
    class="note-input"
    :class="{ hovering, editing: isEditing, 'has-note': hasNote }"
    @mouseover="hover(string, position)"
  >
    <span class="input-bg">{{ noteText }}</span>
    <!-- <div class="input-hover" /> -->
    <input
      ref="input"
      :value="noteText"
      type="text"
      inputmode="numeric"
      pattern="[0-9]{1,2}"
      @input="onInput"
      @blur="onBlur"
      @click="onClick"
      @keyup="(e) => e.stopPropagation()"
    />
  </div>
</template>

<style scoped>
.note-input {
  /* Font size set by parent, Stack */
  display: grid;
  justify-items: center;
  align-items: center; /*comment this if you want other centering*/
}

input {
  all: unset;
  height: var(--cell-height);
}

.input-bg,
input,
.input-hover {
  grid-area: 1 / 1;
  /* grid-area: 1 / 2; */
  /* font-size: var(--note-font-size); */
  text-align: center; /*comment this if you want other centering*/
}

input {
  /* width: var(--cell-height); */
  width: 100%;
  max-width: var(--cell-height);
}

/* .editing input {
  width: var(--cell-height);
} */

.input-bg {
  width: min-content;
  pointer-events: none;
  color: transparent;
  background-color: v-bind(blockingColor);
}

/* .hovering:not(.editing) > input,
.hovering:not(.has-note) > input { */
.hovering > input {
  background-color: var(--note-hover-color);
}
</style>
