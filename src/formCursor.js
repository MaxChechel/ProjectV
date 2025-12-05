// Custom animated cursor caret for form input

export const initFormCursor = () => {
  const formInput = document.querySelector(".form_input");

  if (!formInput) return;

  const inputParent = formInput.parentElement;
  inputParent.style.position = "relative";

  // Get submit wrapper element
  const submitWrapper = document.querySelector(".form_submit_wrapper");

  // Create cursor SVG
  const cursorDiv = document.createElement("div");
  cursorDiv.className = "form_cursor";
  cursorDiv.innerHTML = `
    <svg width="100%" height="100%" viewBox="0 0 44 272" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21.6074 8.48883V263.489" stroke="currentColor"/>
      <path d="M0.107422 0.488831C0.507422 0.574762 14.6074 5.85797 21.6074 8.48883L43.1074 0.488831" stroke="currentColor"/>
      <path d="M0.107422 271.489C0.507422 271.403 14.6074 266.12 21.6074 263.489L43.1074 271.489" stroke="currentColor"/>
    </svg>
  `;

  // Style the cursor
  cursorDiv.style.position = "absolute";
  cursorDiv.style.pointerEvents = "none";
  cursorDiv.style.top = "50%";
  cursorDiv.style.transform = "translate(-50%, -50%)";
  cursorDiv.style.transition = "left 0.05s ease-out";
  cursorDiv.style.height = "80%";

  inputParent.appendChild(cursorDiv);

  // Hide native caret
  formInput.style.caretColor = "transparent";

  // Create canvas for accurate text measurement
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  // Update cursor position
  const updateCursorPosition = () => {
    // Wait for selection to be updated
    requestAnimationFrame(() => {
      // Get current styles
      const styles = window.getComputedStyle(formInput);
      const fontSize = styles.fontSize;
      const fontFamily = styles.fontFamily;
      const fontWeight = styles.fontWeight;

      // Set canvas font to match input
      ctx.font = `${fontWeight} ${fontSize} ${fontFamily}`;

      // Get cursor position (where user clicked or typed)
      const cursorPos =
        formInput.selectionStart !== null
          ? formInput.selectionStart
          : formInput.value.length;
      const textBeforeCursor = formInput.value.substring(0, cursorPos);

      // Measure text width up to cursor position
      const textWidth = ctx.measureText(textBeforeCursor).width;

      // Get input position
      const inputRect = formInput.getBoundingClientRect();
      const parentRect = inputParent.getBoundingClientRect();
      const inputPaddingLeft = parseFloat(styles.paddingLeft) || 0;

      // Calculate cursor position
      const leftOffset =
        inputRect.left - parentRect.left + inputPaddingLeft + textWidth;
      cursorDiv.style.left = `${leftOffset}px`;

      console.log("Cursor:", {
        cursorPos,
        text: textBeforeCursor,
        textWidth,
        leftOffset,
      });
    });
  };

  // Blinking animation
  let blinkTimeline = gsap.timeline({ repeat: -1 });
  blinkTimeline
    .to(cursorDiv, { opacity: 0, duration: 0.5, ease: "steps(1)" })
    .to(cursorDiv, { opacity: 1, duration: 0.5, ease: "steps(1)" });

  // Show cursor on focus, hide on blur
  formInput.addEventListener("focus", () => {
    cursorDiv.style.opacity = "1";
    blinkTimeline.play();
    updateCursorPosition();
  });

  formInput.addEventListener("blur", () => {
    cursorDiv.style.opacity = "0";
    blinkTimeline.pause();
  });

  // Update position on input and cursor movement
  formInput.addEventListener("input", () => {
    updateCursorPosition();

    // Update submit wrapper width based on input length
    if (submitWrapper) {
      if (formInput.value.length >= 1) {
        gsap.to(submitWrapper, {
          width: "100%",
          duration: 0.3,
          ease: "power2.out",
        });
      } else {
        gsap.to(submitWrapper, {
          width: "",
          duration: 0.3,
          ease: "power2.out",
        });
      }
    }
  });
  formInput.addEventListener("click", updateCursorPosition);
  formInput.addEventListener("keyup", updateCursorPosition);
  formInput.addEventListener("keydown", updateCursorPosition);
  formInput.addEventListener("mouseup", updateCursorPosition);

  // Handle arrow keys and selection changes
  formInput.addEventListener("select", updateCursorPosition);
  formInput.addEventListener("selectionchange", updateCursorPosition);

  // Initial position
  if (document.activeElement === formInput) {
    cursorDiv.style.opacity = "1";
    blinkTimeline.play();
    updateCursorPosition();
  } else {
    cursorDiv.style.opacity = "0";
    blinkTimeline.pause();
  }
};
