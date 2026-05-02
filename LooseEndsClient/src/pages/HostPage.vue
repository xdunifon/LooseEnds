<script setup lang="ts">
import { useGameStore } from '@/stores/gameStore'
import { Button } from 'primevue'
import { gameService } from '@/services/gameService'
import GameTimer from '@/components/GameTimer.vue'

const gameStore = useGameStore()

const moveNext = async () => {
  await gameService.nextAsync()
}
</script>

<template>
  <div>
    <div>
      <p>Host Page</p>
      <p>{{ gameStore.gameState.gameCode }}</p>
      <p>Players: {{ gameStore.gameState.players.map((p) => p.name).join(', ') }}</p>
    </div>

    <Button v-if="!gameStore.activeRound" label="Start Game" @click="gameService.startAsync" />
    <div
      v-else-if="gameStore.activeRound.answerDueUtc && !gameStore.activeRound.promptingCompleted"
    >
      <p>Prompting</p>
      <GameTimer :date="gameStore.activeRound.answerDueUtc" @time-up="moveNext" />
    </div>
    <div v-else>Prompting completed</div>
  </div>
</template>
