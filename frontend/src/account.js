import { signUpNewUser } from "./auth";
import { signIn } from "./auth";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("signin-form");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = e.target.email.value;
    const password = e.target.password.value;

    try {
      await signIn(email, password);
      alert("Successfully signed in.");
      window.location.href = "/search.html";
    } catch (err) {
      alert(err.message);
    }
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("signup-form");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = e.target.email.value;
    const password = e.target.password.value;

    try {
      await signUpNewUser(email, password);
      alert("If this email is not already registered, you’ll receive a confirmation email shortly.");
      window.location.href = "/index.html";
    } catch (err) {
      alert(err.message);
    }
  });
});
