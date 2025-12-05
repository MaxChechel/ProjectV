// Simple email validation for form

export const initFormValidation = () => {
  const formInput = document.querySelector(".form_input");
  const submitWrapper = document.querySelector(".form_submit_wrapper");

  if (!formInput || !submitWrapper) return;

  // Simple email regex pattern - requires at least 2 chars in domain extension
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  const validateEmail = () => {
    const email = formInput.value.trim();
    const isValid = emailPattern.test(email);

    if (isValid) {
      submitWrapper.classList.add("is-active");
    } else {
      submitWrapper.classList.remove("is-active");
    }
  };

  // Validate on input
  formInput.addEventListener("input", validateEmail);

  // Validate on paste
  formInput.addEventListener("paste", () => {
    setTimeout(validateEmail, 10);
  });

  // Initial validation
  validateEmail();
};
