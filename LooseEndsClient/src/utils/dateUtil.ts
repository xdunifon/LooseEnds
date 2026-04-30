export function getDateDiffSeconds(targetDate: Date, startDate: Date | undefined) {
  let start = new Date()
  if (startDate) {
    start = startDate
  }

  return (targetDate.getTime() - start.getTime()) / 1000
}
