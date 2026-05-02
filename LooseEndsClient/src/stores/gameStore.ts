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

export const useGameStore = defineStore('game', () => {
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

  const setState = (gameStateResponse: GameState) => {
    gameState.value = gameStateResponse
  }

  const initSignalR = async () => {
    await signalRService.startAsync()
    await signalRService.sendAsync(events.joinSession)

    signalRService.on(events.gameStarted, async (dto: GameState) => {
      console.log(events.gameStarted, dto)

      gameState.value = dto

      if (gameState.value.isHost) {
        await gameService.nextAsync()
      }
    })

    signalRService.on(events.gameOver, (dto: { playerId: string; name: string; score: number }) => {
      console.log(events.gameOver, dto)

      // Mark final round completed and end entire game
      // Show final leaderboard + player winner
    })

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

    signalRService.on(events.votingEnded, () => {
      console.log(events.votingEnded)

      if (!activeRound.value) {
        throw new Error(`Active round not found in event: ${events.votingEnded}`)
      }

      activeRound.value.activeVotingPromptId = null
      activeRound.value.votingCompleted = true
    })

    signalRService.on(events.roundEnded, () => {
      console.log(events.roundEnded)

      // Make change to show leaderboard?
    })

    if (gameState.value.isHost) {
      signalRService.on(events.playerJoined, (dto: Player) => {
        console.log(events.playerJoined, dto)

        gameState.value.players.push(dto)
      })

      signalRService.on(events.playerSubmitted, (playerId: string) => {
        console.log(events.playerSubmitted, playerId)

        if (activeRound.value) {
          activeRound.value
        }
        // get active round, find prompt with plaerId, set submitted?
        // If all players submitted, send out next()
      })

      signalRService.on(events.playerVoted, (playerId: string) => {
        console.log(events.playerVoted, playerId)

        // get active voting prompt, find player with this id, set submitted?
        // If all players submitted, send out next()
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
