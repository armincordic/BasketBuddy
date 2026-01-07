import { signUpNewUser } from "./auth";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("signup-form");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = e.target.email.value;
    const password = e.target.password.value;

    try {
      await signUpNewUser(email, password);
      alert("Account created!");
    } catch (err) {
      alert(err.message);
    }
  });
});
