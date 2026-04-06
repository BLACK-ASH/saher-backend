
export const timeDifference = (start: Date, end: Date): { seconds: number, minutes: number, hours: number } => {
  const diff = end.valueOf() - start.valueOf()
  return {
    seconds: diff / (1000),
    minutes: diff / (1000 * 60),
    hours: diff / (1000 * 60 * 60),
  }
}
