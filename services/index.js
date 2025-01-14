export const getPeriods = (start_date, end_date) => {
  const startDate = start_date ? new Date(start_date) : new Date("2024/01/30");
  const startMonth = startDate.getMonth() + 1;
  const startYear = startDate.getFullYear();

  const endDate = end_date ? new Date(end_date) : new Date();
  const currentMonth = endDate.getMonth() + 1;
  const currentYear = endDate.getFullYear();

  let resutlData = [];

  for (let year = startYear; year <= currentYear; year++) {
    for (let month = startMonth; month <= 12; month++) {
      if (year === currentYear && month > currentMonth) {
        return resutlData;
      }
      resutlData.push(`${month}/${year}`);
    }
  }

  return resutlData;
};
