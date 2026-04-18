import { gameService } from '@/services/gameService'
import { useGameStore } from '@/stores/gameStore'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'

export const PageState = {
  Waiting: 'Waiting',
  Prompting: 'Prompting',
  Voting: 'Voting',
}

export function usePlayerPage() {
  const gameStore = useGameStore()
  const { gameCode } = storeToRefs(gameStore)

  const answer = ref('')
  const state = computed(() => {
    if (!gameStore.activeRound) return PageState.Waiting

    if (
      gameStore.activeRound.answerDueUtc &&
      !gameStore.activeRound.promptingCompleted &&
      gameStore.playerPrompt &&
      !gameStore.playerPrompt.answer &&
      gameStore.playerPrompt.prompt
    )
      return PageState.Prompting

    if (gameStore.activeRound.votingDueUtc && !gameStore.activeRound.votingCompleted)
      return PageState.Voting

    return PageState.Waiting
  })

  const onAnswer = async () => {
    if (!gameStore.playerResponse) return
    if (!answer.value.trim()) return
    await gameService.answerAsync(gameStore.playerResponse.responseId, answer.value)
  }

  return {
    answer,
    gameCode,
    state,

    onAnswer,
  }
}
