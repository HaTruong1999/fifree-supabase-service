import supabase from "../config/supabaseClient.js";
import { getPeriods } from "./index.js";

export const getFundsPortfolio = async () => {
  const { data, error } = await supabase.from("funds-portfolio").select("*");

  if (error) throw new Error(error.message);
  return data;
};

export const getFundsPortfolioStatsByMonth = async (category = "quantity", startDate, endDate, search_stock) => {
  const periods = getPeriods(startDate, endDate);

  const search_stock_code_string = search_stock
    ? search_stock.length === 2
      ? `${search_stock}%`
      : search_stock.length === 1
      ? `${search_stock}%%`
      : search_stock
    : "";
  const query_search = search_stock_code_string ? `WHERE fp.stock_code ILIKE '${search_stock_code_string}'` : "";

  const stringPeriods = periods
    .map((p) => `SUM(CASE WHEN fp.period = '${p}' THEN ${category} ELSE 0 END) AS "${p}"`)
    .join(",");

  const stringQuery = `
  WITH active_funds AS (
    SELECT fund_code
    FROM Funds
    WHERE status = true
  )
  SELECT 
    fp.stock_code, 
    fp.fund_code, 
    ${stringPeriods}
  FROM funds_portfolio fp
  JOIN active_funds f ON fp.fund_code = f.fund_code
  ${query_search}
  GROUP BY fp.stock_code, fp.fund_code
  ORDER BY fp.stock_code`;

  const { data, error } = await supabase.rpc("execute_sql", { query: stringQuery });

  if (error) throw new Error(error.message);
  return data;
};

export const getFundsPortfolioGroupByStock = async (category = "quantity", startDate, endDate, search_stock) => {
  const periods = getPeriods(startDate, endDate);

  const search_stock_code_string = search_stock
    ? search_stock.length === 2
      ? `${search_stock}%`
      : search_stock.length === 1
      ? `${search_stock}%%`
      : search_stock
    : "";
  const query_search = search_stock_code_string ? `WHERE fp.stock_code ILIKE '${search_stock_code_string}'` : "";

  const stringPeriods = periods
    .map((p) => `SUM(CASE WHEN fp.period = '${p}' THEN ${category} ELSE 0 END) AS "${p}"`)
    .join(",");

  const stringQuery = `
  WITH active_funds AS (
    SELECT fund_code
    FROM Funds
    WHERE status = true
  )
  SELECT 
    fp.stock_code, 
    STRING_AGG(DISTINCT fp.fund_code, ', ') AS fund_code, 
    ${stringPeriods}
  FROM funds_portfolio fp
  JOIN active_funds f ON fp.fund_code = f.fund_code
  ${query_search}
  GROUP BY fp.stock_code
  ORDER BY fp.stock_code`;

  const { data, error } = await supabase.rpc("execute_sql", { query: stringQuery });

  if (error) throw new Error(error.message);
  return data;
};

export const getFundsPortfolioByMonth = async (period, fund_code, search_stock) => {
  let res;

  if (fund_code && search_stock) {
    res = await supabase
      .from("funds_portfolio")
      .select("*")
      .eq("period", period)
      .eq("fund_code", fund_code)
      .ilike("stock_code", search_stock);
  } else if (fund_code && !search_stock) {
    res = await supabase.from("funds_portfolio").select("*").eq("period", period).eq("fund_code", fund_code);
  } else if (!fund_code && search_stock) {
    res = await supabase.from("funds_portfolio").select("*").eq("period", period).ilike("stock_code", search_stock);
  } else {
    res = await supabase.from("funds_portfolio").select("*").eq("period", period);
  }

  const { data, error } = res;

  if (error) throw new Error(error.message);
  return data;
};

export const getFundsPortfolioByMonthGroupByStock = async (period, search_stock) => {
  const search_stock_code_string = search_stock
    ? search_stock.length === 2
      ? `AND fp.stock_code ILIKE  '${search_stock}%'`
      : search_stock.length === 1
      ? `AND fp.stock_code ILIKE '${search_stock}%%'`
      : `AND fp.stock_code ILIKE '${search_stock}'`
    : "";

  const query_search = `WHERE fp.period = '${period}' ${search_stock_code_string}`;

  const stringQuery = `
  WITH active_funds AS (
    SELECT fund_code
    FROM Funds
    WHERE status = true
  )
  SELECT 
    stock_code, 
    SUM(quantity) AS total_quantity, 
    SUM(value) AS total_value, 
    array_to_string(array_agg(DISTINCT fund_code), ', ') AS fund_code
  FROM funds_portfolio fp
  ${query_search}
  GROUP BY fp.stock_code`;

  const { data, error } = await supabase.rpc("execute_sql", { query: stringQuery });

  if (error) throw new Error(error.message);
  return data;
};

export const addListFundsPortfolio = async (arrayInput) => {
  const { data, error } = await supabase.from("funds_portfolio").insert(arrayInput);

  if (error) throw new Error(error.message);
  return data;
};
