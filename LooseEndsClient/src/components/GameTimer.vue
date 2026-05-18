<script setup lang="ts">
import { useGameTimer } from '@/composables/useGameTimer'
import { ProgressBar } from 'primevue'
import { onMounted, watch } from 'vue'

const emits = defineEmits(['timeUp'])

const props = defineProps<{
  duration?: number
  date?: Date | string
}>()

const { secondsRemaining, startTimer, percentageTimeRemaining } = useGameTimer(
  props.duration,
  props.date,
)

watch(secondsRemaining, (newVal) => {
  if (newVal <= 0) {
    emits('timeUp')
  }
})

onMounted(() => {
  startTimer()
})
</script>

<template>
  <ProgressBar :value="percentageTimeRemaining">{{ secondsRemaining }}</ProgressBar>
</template>
