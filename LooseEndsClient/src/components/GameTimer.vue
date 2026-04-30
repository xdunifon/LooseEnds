<script setup lang="ts">
import { useGameTimer } from '@/composables/useGameTimer'
import { ProgressBar } from 'primevue'
import { onMounted } from 'vue'

defineEmits(['timeUp'])

const props = defineProps<{
  duration: number
  date: Date | string
}>()

const { secondsRemaining, startTimer, percentageTimeRemaining } = useGameTimer(
  props.duration,
  props.date,
)

onMounted(() => {
  startTimer()
})
</script>

<template>
  <ProgressBar :value="percentageTimeRemaining">{{ secondsRemaining }}</ProgressBar>
</template>
