import type { Player } from '@/types/player'

export type VoteOption = {
  responseId: number
  playerId: string
  answer: string | null
  votedPlayerIds: string[]
}
