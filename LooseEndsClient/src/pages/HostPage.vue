<script setup lang="ts">
import { Button } from 'primevue'
import GameTimer from '@/components/GameTimer.vue'
import { HostState, useHostPage } from '@/pages/composables/useHostPage'

const { players, gameCode, dueDate, state, actions } = useHostPage()
</script>

<template>
  <div>
    <!-- General Info -->
    <div>
      <p>Host Page</p>
      <p>{{ gameCode }}</p>
      <p>Players: {{ players.map((p) => p.name).join(', ') }}</p>
    </div>

    <!-- Not Started -->
    <Button v-if="state == HostState.NotStarted" label="Start Game" @click="actions.start()" />

    <!-- Prompting -->
    <div v-else-if="state == HostState.Prompting">
      <p>Prompting</p>
      <GameTimer v-if="dueDate" :date="dueDate" @time-up="actions.moveNext" />
    </div>

    <!-- Voting -->
    <div v-else-if="state == HostState.Voting">Voting</div>

    <!-- Leaderboard -->
    <div v-else-if="state == HostState.Leaderboard">Leaderboard</div>

    <!-- Lobby -->
    <div v-else>Lobby</div>
  </div>
</template>
