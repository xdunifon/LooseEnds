import { computed, ref } from 'vue'

export const useGameTimer = (duration: number, date: Date | string) => {
  const secondsRemaining = ref(0)
  let timer: number | undefined

  const startTimerWithDuration = (duration: number) => {
    if (timer) timer = undefined
    secondsRemaining.value = duration

    timer = setInterval(() => {
      if (secondsRemaining.value > 0) {
        secondsRemaining.value -= 1
      }
    }, 1000)
  }

  const startTimerWithDate = (date: Date) => {
    const secondsUntilDate = Math.floor((date.getTime() - new Date().getTime()) / 1000)
    startTimerWithDuration(secondsUntilDate)
  }

  const startTimer = () => {
    if (date) {
      const cleanedDate = typeof date !== 'string' ? date : new Date(date)
      startTimerWithDate(cleanedDate)
    } else {
      startTimerWithDuration(duration)
    }
  }

  const percentageTimeRemaining = computed(() => (secondsRemaining.value / 60) * 100)

  return {
    secondsRemaining,
    percentageTimeRemaining,
    startTimer,
  }
}
