<script setup lang="ts">
import { Button } from 'primevue'
import GameTimer from '@/components/GameTimer.vue'
import { HostState, useHostPage } from '@/pages/composables/useHostPage'
import GameCard from '@/components/GameCard.vue'

const { players, gameCode, dueDate, state, data, actions } = useHostPage()
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
    <div v-else-if="state == HostState.Voting">
      <p>Voting</p>
      <p>{{ data.prompt.value }}</p>
      <GameCard
        v-for="option in data.voteOptions.value"
        :key="option.playerId"
        :content="option.answer ?? ''"
      />
      <GameTimer v-if="dueDate" :date="dueDate" @time-up="actions.moveNext" />
    </div>

    <!-- Leaderboard -->
    <div v-else-if="state == HostState.Leaderboard">
      <p>Leaderboard</p>
      <p v-for="player in players" :key="player.id">{{ player.name }}: {{ player.points }}</p>
    </div>

    <!-- Lobby -->
    <div v-else>Lobby</div>
  </div>
</template>
