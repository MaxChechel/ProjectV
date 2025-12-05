// Custom animated cursor for form input
// Creates SVG cursor that follows text input position

export const initFormCursor = () => {
  const formInput = document.querySelector(".form_input");

  if (!formInput) return;

  // Add cursor to input's parent using innerHTML
  const inputParent = formInput.parentElement;
  inputParent.style.position = "relative";

  // Insert SVG directly using innerHTML
  const cursorDiv = document.createElement("div");
  cursorDiv.className = "form_cursor";
  cursorDiv.innerHTML = `
    <svg width="44" height="272" viewBox="0 0 44 272" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21.6074 8.48883V263.489" stroke="currentColor"/>
      <path d="M0.107422 0.488831C0.507422 0.574762 14.6074 5.85797 21.6074 8.48883L43.1074 0.488831" stroke="currentColor"/>
      <path d="M0.107422 271.489C0.507422 271.403 14.6074 266.12 21.6074 263.489L43.1074 271.489" stroke="currentColor"/>
    </svg>
  `;

  cursorDiv.style.position = "absolute";
  cursorDiv.style.top = "50%";
  cursorDiv.style.transform = "translateY(-50%)";
  cursorDiv.style.pointerEvents = "none";
  cursorDiv.style.height = "60%";
  cursorDiv.style.width = "44px";
  cursorDiv.style.zIndex = "10";
  cursorDiv.style.display = "none";

  inputParent.appendChild(cursorDiv);

  const cursorSvg = cursorDiv.querySelector("svg");
  cursorSvg.style.width = "100%";
  cursorSvg.style.height = "100%";

  // Hide default browser cursor
  formInput.style.caretColor = "transparent";

  // Create hidden span for measuring text position
  const measureSpan = document.createElement("span");
  measureSpan.style.position = "absolute";
  measureSpan.style.visibility = "hidden";
  measureSpan.style.whiteSpace = "pre";
  measureSpan.style.fontFamily = window.getComputedStyle(formInput).fontFamily;
  measureSpan.style.fontSize = window.getComputedStyle(formInput).fontSize;
  document.body.appendChild(measureSpan);

  // Update cursor position
  const updateCursorPosition = () => {
    const cursorPosition = formInput.selectionStart || 0;
    const textBeforeCursor = formInput.value.substring(0, cursorPosition);

    // Measure text width - always sync all font properties with input
    const inputStyles = window.getComputedStyle(formInput);
    measureSpan.style.fontSize = inputStyles.fontSize;
    measureSpan.style.fontFamily = inputStyles.fontFamily;
    measureSpan.style.fontWeight = inputStyles.fontWeight;
    measureSpan.style.letterSpacing = inputStyles.letterSpacing;
    measureSpan.textContent = textBeforeCursor || "";

    const textWidth = measureSpan.getBoundingClientRect().width;

    // Get input dimensions
    const paddingLeft = parseFloat(inputStyles.paddingLeft);

    // Position cursor - simple calculation with 44px SVG width
    const cursorX = paddingLeft + textWidth - 22; // Center of 44px SVG

    console.log("Cursor update:", {
      text: textBeforeCursor,
      textWidth,
      paddingLeft,
      cursorX,
      fontSize: inputStyles.fontSize,
    });

    gsap.to(cursorDiv, {
      x: cursorX,
      duration: 0.1,
      ease: "none",
    });
  };

  // Blinking animation
  const blinkCursor = () => {
    gsap.to(cursorSvg, {
      opacity: 0,
      duration: 0.5,
      repeat: -1,
      yoyo: true,
      ease: "steps(1)",
    });
  };

  // Stop blinking when typing
  let blinkAnimation;
  const startBlinking = () => {
    if (blinkAnimation) blinkAnimation.kill();
    gsap.set(cursorDiv, { opacity: 1 });
    blinkAnimation = gsap.to(cursorDiv, {
      opacity: 0,
      duration: 0.5,
      delay: 0.5,
      repeat: -1,
      yoyo: true,
      ease: "steps(1)",
    });
  };

  const stopBlinking = () => {
    if (blinkAnimation) blinkAnimation.kill();
    gsap.set(cursorDiv, { opacity: 1 });
  };

  // Event listeners
  formInput.addEventListener("input", () => {
    updateCursorPosition();
    stopBlinking();
    setTimeout(startBlinking, 500);
  });

  formInput.addEventListener("click", updateCursorPosition);
  formInput.addEventListener("keyup", updateCursorPosition);
  formInput.addEventListener("keydown", updateCursorPosition);

  formInput.addEventListener("focus", () => {
    cursorDiv.style.display = "block";
    gsap.set(cursorDiv, { opacity: 1 });
    updateCursorPosition();
    startBlinking();
  });

  formInput.addEventListener("blur", () => {
    if (blinkAnimation) blinkAnimation.kill();
    cursorDiv.style.display = "none";
  });

  // Initial state - hidden until focus
  cursorDiv.style.display = "none";
};
