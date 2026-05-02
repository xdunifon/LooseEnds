import { gameService } from '@/services/gameService'
import { useGameStore } from '@/stores/gameStore'
import { computed } from 'vue'

export const HostState = {
  Lobby: 'Lobby',
  NotStarted: 'NotStarted',
  Prompting: 'Prompting',
  Voting: 'Voting',
  Leaderboard: 'Leaderboard',
}

export function useHostPage() {
  const gameStore = useGameStore()

  /**
   * Host state
   */
  const state = computed<string>(() => {
    if (!gameStore.activeRound) return HostState.NotStarted

    if (gameStore.activeRound.answerDueUtc && !gameStore.activeRound.promptingCompleted)
      return HostState.Prompting

    if (
      gameStore.activeVotingPrompt &&
      gameStore.activeVotingPrompt.voteDueUtc &&
      !gameStore.activeRound.votingCompleted
    )
      return HostState.Voting

    if (gameStore.gameStarted && gameStore.activeRound && gameStore.activeRound.votingCompleted)
      return HostState.Leaderboard

    return HostState.Lobby
  })

  /**
   * Due date is either the answer due date or vote due date, depending on the current state
   */
  const dueDate = computed<string | null>(() => {
    if (state.value === HostState.Prompting) {
      return gameStore.activeRound?.answerDueUtc ?? null
    }
    if (state.value === HostState.Voting) return gameStore.activeVotingPrompt?.voteDueUtc ?? null
    return null
  })

  /**
   * Actions
   */
  const start = async () => gameService.startAsync()
  const moveNext = async () => await gameService.nextAsync()

  /**
   * Return
   */
  return {
    players: gameStore.gameState.players,
    gameCode: gameStore.gameState.gameCode,
    dueDate: dueDate,
    state,
    actions: {
      start,
      moveNext,
    },
  }
}
