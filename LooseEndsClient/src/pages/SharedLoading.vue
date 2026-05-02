<script setup lang="ts">
import ProgressSpinner from 'primevue/progressspinner'
</script>

<template>
  <div class="relative flex items-center justify-center h-screen">
    <ProgressSpinner
      class="absolute top-[-10%]"
      style="width: 100px; height: 100px"
      strokeWidth="8"
      fill="transparent"
      animationDuration=".5s"
      aria-label="Loading"
    />
  </div>
</template>
