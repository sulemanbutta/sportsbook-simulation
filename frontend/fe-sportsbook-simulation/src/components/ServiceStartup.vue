<script setup>
import { computed } from 'vue';

const props = defineProps({
  show: Boolean,
  attempt: { type: Number, default: 0 },
  maxAttempts: { type: Number, default: 3 },
  message: { type: String, default: 'Starting services...' }
});

const progress = computed(() => {
  if (props.attempt === 0) return 10;
  return Math.min(90, (props.attempt / props.maxAttempts) * 80 + 10);
});

const estimatedTime = computed(() => {
  const remaining = props.maxAttempts - props.attempt;
  if (remaining <= 1) return '5-10 seconds';
  if (remaining === 2) return '10-15 seconds';
  return '15-20 seconds';
});
</script>

<template>
  <v-overlay
    v-model="show"
    persistent
    class="d-flex align-center justify-center"
  >
    <v-card
      class="pa-6 text-center"
      max-width="400"
      elevation="8"
    >
      <div class="mb-4">
        <v-progress-circular
          :model-value="progress"
          :size="60"
          :width="6"
          color="primary"
          class="mb-4"
        >
          {{ Math.round(progress) }}%
        </v-progress-circular>
      </div>

      <v-card-title class="text-h6 mb-2">
        🚀 Starting Services
      </v-card-title>

      <v-card-text>
        <p class="text-body-1 mb-3">{{ message }}</p>

        <v-progress-linear
          :model-value="progress"
          color="primary"
          height="8"
          rounded
          class="mb-3"
        ></v-progress-linear>

        <p class="text-body-2 text-medium-emphasis mb-3">
          This happens when services haven't been used recently.<br>
          Thank you for your patience!
        </p>

        <v-chip
          color="primary"
          variant="tonal"
          size="small"
        >
          Estimated time: {{ estimatedTime }}
        </v-chip>
      </v-card-text>
    </v-card>
  </v-overlay>
</template>
