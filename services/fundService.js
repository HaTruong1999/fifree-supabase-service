import supabase from "../config/supabaseClient.js";

export const getFunds = async () => {
  const { data, error } = await supabase.from("funds").select("*").order("stt", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
};

export const getFundsPortfolioStats = async () => {
  const { data, error } = await supabase.rpc("count_stocks_in_portfolio");

  if (error) throw new Error(error.message);
  return data;
};

export const addFund = async (user_id, amount, type) => {
  const { data, error } = await supabase.from("funds").insert([{ user_id, amount, type }]);

  if (error) throw new Error(error.message);
  return data;
};
