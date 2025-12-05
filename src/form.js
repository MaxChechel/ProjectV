import { initFormTypeSize } from "./formTypeSize.js";
import { initFormCursor } from "./formCursor.js";
import { initFormValidation } from "./formValidation.js";
import { initFormSubmit } from "./formSubmit.js";

export const initForm = () => {
  // Initialize dynamic font size for form inputs
  initFormTypeSize();

  // Initialize custom SVG cursor for form input
  initFormCursor();

  // Initialize email validation
  initFormValidation();

  // Initialize form submission handler
  initFormSubmit();
};
