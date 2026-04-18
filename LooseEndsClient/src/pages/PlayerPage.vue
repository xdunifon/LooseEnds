<script setup>
import PromptInput from '@/components/PromptInput.vue'
import { PageState, usePlayerPage } from '@/pages/composables/usePlayerPage'

const { answer, gameCode, state, onAnswer } = usePlayerPage()
</script>

<template>
  <div>
    <div>
      <p>PlayerPage</p>
      <p>{{ gameCode }}</p>
    </div>

    <PromptInput v-if="state === PageState.Prompting" @submit="onAnswer" v-model="answer" />
  </div>
</template>
