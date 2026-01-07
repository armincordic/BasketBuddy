import { supabase } from "./supabaseClient.js";


export async function signUpNewUser(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });

    if (error) {
        console.error("Signup error:", error.message);
        throw error;
    }
    return data;
  
}