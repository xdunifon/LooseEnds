<script setup lang="ts">
import { useGameStore } from '@/stores/gameStore'
import { Button, InputText } from 'primevue'

const gameStore = useGameStore()
const emits = defineEmits(['submit'])
const answer = defineModel({ required: true, default: '' })
</script>

<template>
  <div>
    <div>{{ gameStore.playerPrompt.prompt }}</div>
    <InputText
      class="w-full"
      v-model="answer"
      label="Answer"
      placeholder="Enter your answer here"
    />
    <Button label="Submit" :disabled="!answer.trim()" @click="emits('submit')" />
  </div>
</template>
