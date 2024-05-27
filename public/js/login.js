const container = document.querySelector(".container");
const loginForm = document.querySelector(".login-form");
const RegisterForm = document.querySelector(".Register-form");
const RegiBtn = document.querySelector(".RegiBtn");
const LoginBtn = document.querySelector(".LoginBtn");
RegiBtn.addEventListener("click", () => {
  RegisterForm.classList.add("active");
  loginForm.classList.add("active");
});
LoginBtn.addEventListener("click", () => {
  RegisterForm.classList.remove("active");
  loginForm.classList.remove("active");
});
