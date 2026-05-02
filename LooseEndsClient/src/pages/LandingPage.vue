<script setup lang="ts">
import { ref } from 'vue'
import { gameService } from '@/services/gameService'
import { useGameStore } from '@/stores/gameStore'
import { Button, InputText } from 'primevue'
import { useAuthStore } from '@/stores/authStore'

const gameStore = useGameStore()
const authStore = useAuthStore()

const showReconnect = ref(authStore.token !== null)

// Creating
const create = async () => {
  await gameService.createAsync()
  await gameStore.initSignalR()
}

// Joining
const gameCodeForm = ref('')
const playerName = ref('')
const join = async () => {
  await gameService.joinAsync(gameCodeForm.value, playerName.value)
  await gameStore.initSignalR()
}

const rejoin = async (rejoined: boolean) => {
  if (rejoined) {
    await gameService.getAsync()
    await gameStore.initSignalR()
  } else {
    authStore.clearToken()
  }
  showReconnect.value = false
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <p>Landing Page</p>
    <div v-if="showReconnect">
      <p>Rejoin previous game?</p>
      <Button label="Yes" @click="rejoin(true)" />
      <Button label="No" @click="rejoin(false)" />
    </div>
    <div v-else class="flex flex-col gap-4">
      <InputText v-model="gameCodeForm" label="Game Code" placeholder="Enter game code" />
      <InputText v-model="playerName" label="Player name" placeholder="Enter your name" />
      <Button label="Join Game" @click="join" />
      <Button label="Create game" @click="create" />
    </div>
  </div>
</template>
