import type { Player } from '@/types/player'
import type { Round } from '@/types/round'

export type GameState = {
  gameCode: string | null
  dateCreatedUtc: string | null
  isHost: boolean
  userId: string | null
  promptingDuration: number
  votingDuration: number

  players: Player[]
  rounds: Round[]
}
