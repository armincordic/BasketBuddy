import { supabase } from "./supabaseClient";

export async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password
});

if (error) throw error;
return data;
}

export async function signUpNewUser(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error) throw error;
  return data;
}