import { supabase } from "./supabaseClient";

document
    .getElementById("search-form")
    .addEventListener("submit", async (e) => {
        e.preventDefault();

        const term = e.target.term.value;

        const res = await fetch(
        `http://localhost:3000/search?term=${encodeURIComponent(term)}`
        );

        const data = await res.json();

        console.log(data); 

    });

document
    .getElementById("signout-btn")
    .addEventListener("click", async () => {
        await supabase.auth.signOut();
        window.location.href = "./index.html";

    });