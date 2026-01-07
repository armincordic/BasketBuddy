import { supabase } from "./supabaseClient";

export async function signUpNewUser(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error) throw error;
  return data;
}
