export const timeDifference = (
  start: Date | string,
  end: Date | string,
): { seconds: number; minutes: number; hours: number } => {
  start = new Date(start);
  end = new Date(end);
  const diff = end.valueOf() - start.valueOf();
  return {
    seconds: diff / 1000,
    minutes: diff / (1000 * 60),
    hours: diff / (1000 * 60 * 60),
  };
};
