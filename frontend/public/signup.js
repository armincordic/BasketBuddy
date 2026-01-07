import { signUpNewUser } from "./public/auth.js";

document
  .getElementById("signup-form")
  .addEventListener("submit", async (e) => {
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
