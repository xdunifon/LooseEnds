import type { VoteOption } from '@/types/voteOption'

export type Prompt = {
  id: number
  prompt: string
  voteDueUtc: string
  isCompleted: boolean
  voteOptions: VoteOption[]
}
