import apiClient from '@/services/api'
import { useAuthStore } from '@/stores/authStore'
import { useGameStore } from '@/stores/gameStore'
import type { GameState } from '@/types/gameState'

/**
 * Service for making API calls related to game actions,
 * such as creating/joining a game, starting the game,
 * answering prompts, voting, etc.
 */
export const gameService = {
  /**
   * Get data for entire session
   */
  async getAsync() {
    const response = (await apiClient.get<GameState>('')).data
    const gameStore = useGameStore()
    gameStore.setState(response)
  },

  // Create a new game
  async createAsync() {
    const response = (await apiClient.post('create')).data

    const authStore = useAuthStore()
    authStore.setToken(response.token)

    const gameStore = useGameStore()
    gameStore.gameState.isHost = true
    gameStore.gameState.userId = response.hostId
    gameStore.gameState.gameCode = response.gameCode
  },

  /**
   * Start the game
   */
  async startAsync() {
    await apiClient.post('start', {})
  },

  /**
   * Move the game into the next state
   */
  async nextAsync() {
    await apiClient.post('next')
  },

  /**
   * Join an existing game using the game code and player's name
   */
  async joinAsync(newGameCode: string, playerName: string) {
    const response = (await apiClient.post('join', { gameCode: newGameCode, name: playerName }))
      .data

    const authStore = useAuthStore()
    authStore.setToken(response.token)

    const gameStore = useGameStore()
    gameStore.gameState.gameCode = newGameCode
    gameStore.gameState.userId = response.playerId
  },

  /**
   * Answer a prompt using the existing response ID and the player's answer
   */
  async answerAsync(responseId: number, answer: string) {
    await apiClient.post('answer', { responseId, answer })
  },

  /**
   * Vote for a response by its ID
   */
  async voteAsync(responseId: number) {
    await apiClient.post('vote', { responseId })
  },
}
