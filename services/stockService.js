import supabase from "../config/supabaseClient.js";

export const getStockFollowing = async () => {
  const { data, error } = await supabase.from("stock_following").select("*").order("index", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
};
