export const getWeekRange = (date: Date) => {
  const d = new Date(date);

  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;

  const weekStart = new Date(d);
  weekStart.setDate(d.getDate() + diff);
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  return { weekStart, weekEnd };
};
