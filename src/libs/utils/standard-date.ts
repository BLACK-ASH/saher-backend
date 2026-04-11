
export const standardDateString = (date: Date | string | number) => {
  return new Date(date).toLocaleDateString("en_CA")
}
