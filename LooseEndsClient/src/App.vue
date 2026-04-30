<script setup lang="ts">
import { useGameStore } from '@/stores/gameStore'
import LandingPage from '@/pages/LandingPage.vue'
import PlayerPage from '@/pages/PlayerPage.vue'
import HostPage from '@/pages/HostPage.vue'

const gameStore = useGameStore()
</script>

<template>
  <LandingPage v-if="!gameStore.gameCode" />
  <HostPage v-else-if="gameStore.isHost" />
  <PlayerPage v-else />
</template>
