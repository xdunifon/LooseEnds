import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { signalRService } from '@/services/signalRService'
import { events } from '@/services/signalREvents'
import { gameService } from '@/services/gameService'
import type { GameState } from '@/types/gameState'
import type { VoteOption } from '@/types/voteOption'
import type { Player } from '@/types/player'
import type { Round } from '@/types/round'
import type { Prompt } from '@/types/prompt'
import type { PlayerResponse } from '@/types/playerResponse'
import type { PlayerVote } from '@/types/playerVote'

export const useGameStore = defineStore('game', () => {
  /**
   * Main game state tracker object
   */
  const gameState = ref<GameState>({
    gameCode: null,
    dateCreatedUtc: null,
    isHost: false,
    userId: null,
    promptingDuration: 0,
    votingDuration: 0,
    rounds: [],
    players: [],
  })

  /**
   * COMPUTED HELPERS - these compute commonly used values
   * based on the game state, such as active round, active
   * voting prompt, if game has started, player's prompt
   * and response, etc.
   */
  const gameStarted = computed<boolean>(() =>
    gameState.value.rounds.some((r) => r.answerDueUtc !== null),
  )

  const activeRound = computed<Round | null>(() => {
    const sorted = [...gameState.value.rounds].sort((a, b) => a.number - b.number)
    return sorted.find((r) => r.answerDueUtc && !r.votingCompleted) || null
  })

  const activeVotingPrompt = computed<Prompt | null>(() => {
    if (!activeRound.value || !activeRound.value.activeVotingPromptId) return null

    return (
      activeRound.value.prompts.find((p) => p.id === activeRound.value?.activeVotingPromptId) ??
      null
    )
  })

  const playerPrompt = computed<Prompt | null>(() => {
    if (!activeRound.value) return null

    return (
      activeRound.value.prompts.find((p) =>
        p.voteOptions.some((v) => v.playerId === gameState.value.userId),
      ) ?? null
    )
  })

  const playerResponse = computed<VoteOption | null>(() => {
    if (!playerPrompt.value) return null

    return playerPrompt.value.voteOptions.find((v) => v.playerId === gameState.value.userId) ?? null
  })

  /**
   * Update state, used typically for initial load
   * @param gameStateResponse
   */
  const setState = (gameStateResponse: GameState) => {
    gameState.value = gameStateResponse
  }

  /**
   * SignalR event handlers. These will update the game state
   * based on events from the server, and in some cases trigger
   * additional requests to the server (ex: if host, when
   * gameStarted event is received, send next() request to start
   * first round).
   */
  const initSignalR = async () => {
    await signalRService.startAsync()
    await signalRService.sendAsync(events.joinSession)

    /**
     * Game Started
     */
    signalRService.on(events.gameStarted, async (dto: GameState) => {
      console.log(events.gameStarted, dto)

      // IsHost, UserId needs removed from this response
      gameState.value = { ...dto, isHost: gameState.value.isHost, userId: gameState.value.userId }

      if (gameState.value.isHost) {
        await gameService.nextAsync()
      }
    })

    /**
     * Game Over
     */
    signalRService.on(events.gameOver, (dto: { playerId: string; name: string; score: number }) => {
      console.log(events.gameOver, dto)

      if (!activeRound.value) throw new Error(`Active round not found in event: ${events.gameOver}`)

      activeRound.value.votingCompleted = true
      // Mark final round completed and end entire game
      // Show final leaderboard + player winner
    })

    /**
     * Round Started
     */
    signalRService.on(events.roundStarted, (dto: { number: number; endsAt: string }) => {
      console.log(events.roundStarted, dto)

      const round = gameState.value.rounds.find((r) => r.number === dto.number)
      if (!round) {
        throw new Error(`Round not found in event: ${events.roundStarted}`)
      }

      round.answerDueUtc = dto.endsAt
    })

    signalRService.on(events.promptingEnded, () => {
      console.log(events.promptingEnded)

      if (activeRound.value) {
        activeRound.value.promptingCompleted = true
      }
    })

    /**
     * Voting Started
     */
    signalRService.on(
      events.votingStarted,
      (dto: { number: number; promptId: number; voteDueUtc: string; options: VoteOption[] }) => {
        console.log(events.votingStarted, dto)

        if (activeRound.value) {
          activeRound.value.activeVotingPromptId = dto.promptId
          const prompt = activeRound.value.prompts.find((p) => p.id == dto.promptId)
          if (!prompt) {
            throw new Error(`Prompt not found in event: ${events.votingStarted}`)
          }

          prompt.voteDueUtc = dto.voteDueUtc
          prompt.voteOptions = dto.options
        }
      },
    )

    /**
     * Voting Ended
     */
    signalRService.on(events.votingEnded, () => {
      console.log(events.votingEnded)

      if (!activeRound.value) {
        throw new Error(`Active round not found in event: ${events.votingEnded}`)
      }

      activeRound.value.activeVotingPromptId = null
      activeRound.value.votingCompleted = true
    })

    /**
     * Round Ended
     */
    signalRService.on(events.roundEnded, () => {
      console.log(events.roundEnded)

      // Make change to show leaderboard?
    })

    /**
     * Host only events
     */
    if (gameState.value.isHost) {
      /**
       * Player Joined
       */
      signalRService.on(events.playerJoined, (dto: Player) => {
        console.log(events.playerJoined, dto)

        gameState.value.players.push(dto)
      })

      /**
       * Player Submitted Answer
       */
      signalRService.on(events.playerSubmitted, async (response: PlayerResponse) => {
        console.log(events.playerSubmitted, response)

        const voteOption = activeRound.value?.prompts
          .find((p) => p.voteOptions.some((v) => v.playerId === response.playerId))
          ?.voteOptions.find((v) => v.playerId === response.playerId)

        if (voteOption) {
          voteOption.answer = response.answer
        }

        if (activeRound.value?.prompts.every((p) => p.voteOptions.every((v) => v.answer))) {
          await gameService.nextAsync()
        }
      })

      /**
       * Player Voted
       */
      signalRService.on(events.playerVoted, async (response: PlayerVote) => {
        console.log(events.playerVoted, response)

        const voteOption = activeRound.value?.prompts
          .find((p) => p.voteOptions.some((v) => v.responseId === response.responseId))
          ?.voteOptions.find((v) => v.responseId === response.responseId)
        if (voteOption) {
          voteOption.votedPlayerIds.push(response.playerId)
        }

        const totalCast =
          activeRound.value?.prompts.reduce((sum, p) => {
            return (
              sum + p.voteOptions.reduce((vSum, option) => vSum + option.votedPlayerIds.length, 0)
            )
          }, 0) || 0

        if (totalCast >= gameState.value.players.length) {
          await gameService.nextAsync()
        }
      })
    }
  }

  return {
    gameState,

    activeRound,
    activeVotingPrompt,
    gameStarted,
    playerPrompt,
    playerResponse,

    setState,
    initSignalR,
  }
})
