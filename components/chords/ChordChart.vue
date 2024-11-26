<script setup lang="ts">
import type { ChordNote, NoteStack } from "~/model/data";

const props = withDefaults(
  defineProps<{
    strings?: number;
    notes: NoteStack<ChordNote>;
    tuning: Midi[];
  }>(),
  {
    strings: 6,
  },
);

const emit = defineEmits<{
  updateString: [string: number, data: ChordNote];
  muteString: [string: number];
}>();

const fingering = computed(() => {
  const fingering: {
    [string: number]: ChordNote & { fret: number };
  } = {};

  for (const [string, note] of props.notes.entries()) {
    const fret = note.note - props.tuning[string];
    fingering[string] = { ...note, fret };
  }
  return fingering;
});

const cellWidth = 24; // relative to a border width of 1
const cellRatio = 4 / 3; // height / width
const cellHeight = cellWidth * cellRatio;
const topEndHeight = cellHeight / 4;
const noteRadius = cellWidth / 3;

const frets = computed(() =>
  Object.values(fingering.value)
    .map(({ fret }) => fret)
    .sort(),
);

const lastFret = computed(() => frets.value.at(-1) ?? 0);
const firstFret = computed(() => frets.value[0] ?? 0);

const fretStart = computed(() => (lastFret.value <= 4 ? 1 : firstFret.value));

const numFrets = computed(() =>
  fretStart.value ? Math.max(4, lastFret.value - fretStart.value + 1) : 4,
);

function incrementWindow() {
  windowStart.value++;
}

function decrementWindow() {
  if (windowStart.value - 1 >= 1) windowStart.value--;
}

const windowStart = ref(fretStart.value);
const windowEnd = computed(() => windowStart.value + numFrets.value - 1);

// const fretLabelWidth = computed(() => (windowStart.value === 0 ? 0 : cellWidth));
const gridStartX = computed(() => cellWidth);
const gridStartY = computed(() => cellHeight);
const gridEndX = computed(
  () => gridStartX.value + (props.strings - 1) * cellWidth,
);
const gridEndY = computed(() => gridStartY.value + numFrets.value * cellHeight);

const totalWidth = computed(() => gridEndX.value + cellWidth / 2);
const totalHeight = computed(
  () => cellHeight * (numFrets.value + 0.5) + gridStartY.value,
);

const viewBox = computed(() => `0 0 ${totalWidth.value} ${totalHeight.value}`);

// const fingerLabels = computed(() => new Array({length: numFrets}, i =>
function setFret(string: number, fret: number | false) {
  const note = props.notes.get(string);
  if (fret === false) {
    emit("muteString", string);
    return;
  }
  emit("updateString", string, {
    ...note,
    note: (props.tuning[string] + fret) as Midi,
  });
}

function onInput(e: Event) {
  const target = e.target as HTMLInputElement;
  const value = target.value;
  if (value.trim() == "") {
    return;
  }
  const num = parseInt(value);
  if (Number.isInteger(num) && num >= 1 && num < 99) {
    windowStart.value = num;
    return;
  }
  target.value = `${windowStart.value}`;
}

function onInputBlur(e: Event) {
  const target = e.target as HTMLInputElement;
  target.value = `${windowStart.value}`;
}

function onInputClick(e: Event) {
  const target = e.target as HTMLInputElement;
  target.select();
}
</script>

<template>
  <svg :viewBox>
    <rect
      v-if="windowStart === 1"
      :y="gridStartY - topEndHeight"
      :height="topEndHeight"
      :x="gridStartX - 0.5"
      :width="gridEndX - gridStartX + 1"
      :fill="'black'"
    />

    <line
      v-for="(_, i) in strings"
      :x1="gridStartX + i * cellWidth"
      :x2="gridStartX + i * cellWidth"
      :y1="gridStartY"
      :y2="gridEndY"
      :stroke="'black'"
    />

    <line
      v-for="n in numFrets"
      :x1="gridStartX"
      :x2="gridEndX"
      :y1="gridStartY + n * cellHeight - 0.5"
      :y2="gridStartY + n * cellHeight - 0.5"
      :stroke="'black'"
    />

    <template v-for="(_, x) in strings">
      <template v-for="(f, y) in numFrets">
        <g
          v-if="fingering[strings - x - 1]?.fret !== f + windowStart - 1"
          class="selectable-group"
          @click="setFret(strings - x - 1, f + windowStart - 1)"
        >
          <circle
            class="selectable"
            :cx="gridStartX + x * cellWidth"
            :cy="gridStartY + y * cellHeight + cellHeight / 2"
            :r="noteRadius"
          />
          <rect
            :x="gridStartX + x * cellWidth - cellWidth / 2"
            :y="gridStartY + y * cellHeight"
            :width="cellWidth"
            :height="cellHeight"
            fill="transparent"
          />
        </g>
      </template>
    </template>

    <template v-for="(_, string) in strings">
      <template v-if="fingering[string]">
        <g
          v-if="fingering[string].fret === 0"
          class="open-group"
          @click="setFret(string, false)"
        >
          <circle
            class="open"
            :cx="gridStartX + (strings - string - 1) * cellWidth"
            :cy="gridStartY - cellHeight * 0.65"
            :r="noteRadius"
            fill="transparent"
            stroke="black"
          />
          <rect
            :x="gridStartX + (strings - string - 1.5) * cellWidth"
            :y="gridStartY - cellHeight"
            :width="cellWidth"
            :height="cellHeight"
            fill="transparent"
          />
        </g>
        <template
          v-else-if="
            fingering[string].fret >= windowStart &&
            fingering[string].fret <= windowEnd
          "
        >
          <!--TODO: replace with NoteView-->
          <circle
            class="selected"
            :cx="gridStartX + (strings - string - 1) * cellWidth"
            :cy="
              gridStartY +
              (fingering[string].fret - windowStart) * cellHeight +
              cellHeight / 2
            "
            :r="noteRadius"
            @click="setFret(string, false)"
          />
          <g class="selected-open-group" @click="setFret(string, 0)">
            <circle
              class="open"
              :cx="gridStartX + (strings - string - 1) * cellWidth"
              :cy="gridStartY - cellHeight * 0.65"
              :r="noteRadius"
              fill="transparent"
            />
            <rect
              :x="gridStartX + (strings - string - 1.5) * cellWidth"
              :y="gridStartY - cellHeight"
              :width="cellWidth"
              :height="cellHeight"
              fill="transparent"
            />
          </g>
        </template>
      </template>
      <g v-else class="muted-group" @click="setFret(string, 0)">
        <text
          class="muted"
          text-anchor="middle"
          :x="gridStartX + (strings - +string - 1) * cellWidth"
          :y="gridStartY - cellHeight / 2"
        >
          &Cross;
        </text>
        />
        <rect
          :x="gridStartX + (strings - string - 1.5) * cellWidth"
          :y="gridStartY - cellHeight"
          :width="cellWidth"
          :height="cellHeight"
          fill="transparent"
        />
      </g>
    </template>

    <template v-if="windowStart !== 1">
      <text
        v-for="(n, i) in numFrets"
        text-anchor="middle"
        :x="cellWidth / 2 - 1"
        :y="gridStartY + n * cellHeight - cellWidth / 2"
        fill="gray"
        font-family="sans-serif"
        :font-size="cellWidth / 2"
      >
        {{ windowStart + i }}
      </text>
    </template>

    <text
      v-if="windowStart > 1"
      class="arrow"
      text-anchor="middle"
      :x="cellWidth / 2"
      :y="gridStartY - cellHeight / 3 - 1"
      :transform="`rotate(-90, ${cellWidth * 0.75 - 1} ${gridStartY - cellHeight / 3 - 1})`"
      font-family="sans-serif"
      :font-size="cellHeight / 2"
      fill="gray"
      @click="decrementWindow"
    >
      ⮕
    </text>

    <rect
      class="bottom-edge"
      :x="gridStartX - cellWidth"
      :y="gridEndY"
      :width="gridEndX - gridStartX"
      :height="cellHeight"
      fill="transparent"
      @click="incrementWindow"
    />

    <text
      class="arrow"
      text-anchor="middle"
      :x="cellWidth / 2"
      :y="gridEndY + cellWidth"
      :transform="`rotate(90, ${cellWidth * 0.75 - 1} ${gridEndY + cellWidth / 2})`"
      font-family="sans-serif"
      :font-size="cellHeight / 2"
      fill="gray"
      @click="incrementWindow"
    >
      ⮕
    </text>

    <foreignObject :x="0" :y="gridStartY + 6" :width="22" :height="cellHeight">
      <input
        type="text"
        :value="windowStart"
        inputmode="numeric"
        @input="onInput"
        @blur="onInputBlur"
        @click="onInputClick"
      />
    </foreignObject>
  </svg>
</template>

<style scoped>
svg {
  /* border: 1px solid black; */
  user-select: none;
}

svg:hover input {
  display: inline-block;
}

svg:not(:hover) .arrow {
  fill: transparent;
}

.arrow:hover,
.bottom-edge:hover + .arrow {
  fill: black;
  cursor: pointer;
}

.bottom-edge {
  cursor: pointer;
}

.selectable {
  fill: transparent;
}

.selectable-group:hover .selectable {
  fill: rgb(80, 80, 80);
}

input {
  display: none;
  width: 14px;
  font-size: 12px;
  text-align: center;
}

.open-group:hover {
  opacity: 0.5;
}

.muted-group:hover {
  .muted {
    opacity: 0.5;
  }
}

.selected-open-group:hover .open {
  stroke: rgb(80, 80, 80);
}

.selected:hover {
  fill: gray;
  & + .open-group .open {
    stroke: rgb(80, 80, 80);
  }
}

.open-group rect,
.muted-group rect,
.selected-open-group rect,
.selectable-group rect,
.selected {
  cursor: pointer;
}
</style>
