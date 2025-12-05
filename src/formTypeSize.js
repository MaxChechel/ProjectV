// Dynamic font size for form inputs to fit text to full width
// Measures actual text width and adjusts font-size to fill input width

export const initFormTypeSize = () => {
  const formInputs = document.querySelectorAll(".form_input");

  if (!formInputs.length) return;

  formInputs.forEach((input) => {
    const baseFontSize = 17.5; // placeholder size

    // Create hidden span for measuring text width
    const measureSpan = document.createElement("span");
    measureSpan.id = "form-measure-span";
    measureSpan.style.position = "absolute";
    measureSpan.style.visibility = "hidden";
    measureSpan.style.whiteSpace = "nowrap";
    measureSpan.style.fontFamily = window.getComputedStyle(input).fontFamily;
    document.body.appendChild(measureSpan);

    const updateFontSize = () => {
      const textLength = input.value.length;

      // If empty, use base size
      if (textLength === 0) {
        gsap.to(input, {
          fontSize: `${baseFontSize}vw`,
          duration: 0.3,
          ease: "power2.out",
        });
        return;
      }

      // Get input width
      const inputWidth = input.offsetWidth;

      // Binary search for optimal font size
      let minSize = 1;
      let maxSize = baseFontSize;
      let optimalSize = baseFontSize;

      for (let i = 0; i < 15; i++) {
        const testSize = (minSize + maxSize) / 2;
        measureSpan.style.fontSize = `${testSize}vw`;
        measureSpan.textContent = input.value;

        const textWidth = measureSpan.offsetWidth;

        if (textWidth <= inputWidth * 0.98) {
          // Text fits, try larger
          minSize = testSize;
          optimalSize = testSize;
        } else {
          // Text too wide, try smaller
          maxSize = testSize;
        }
      }

      // Apply with smooth animation
      gsap.to(input, {
        fontSize: `${optimalSize}vw`,
        duration: 0.3,
        ease: "power2.out",
      });
    };

    // Set initial font size
    gsap.set(input, { fontSize: `${baseFontSize}vw` });

    // Update on input
    input.addEventListener("input", updateFontSize);

    // Update on paste
    input.addEventListener("paste", () => {
      setTimeout(updateFontSize, 10);
    });
  });
};
