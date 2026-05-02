import type { Prompt } from '@/types/prompt'

export type Round = {
  number: number
  answerDueUtc: string
  promptingCompleted: boolean
  activeVotingPromptId: number | null
  votingCompleted: boolean
  prompts: Prompt[]
}
