// Infinite Scroll Images Animation Component
// Based on scrollImages.js but with infinite looping via repeat: -1

// Utility method
const mod = (n, m) => ((n % m) + m) % m;

export const initScrollImagesInfinite = (config = {}) => {
  // Default configuration
  const defaultConfig = {
    componentSelector: ".scroll_images_final",
    scrollSensitivity: {
      wheel: 1000,
      touch: 500,
    },
  };

  // Merge config with defaults
  const cfg = { ...defaultConfig, ...config };

  // Animation state - exactly like in the example
  let incr = 0; // Start from 0, will animate to reveal
  let zIndex = 0;
  let newIndex = 0;
  const settings = { delta: 0 };
  let isScrollEnabled = false; // Control scroll availability

  // Get DOM elements
  const scrollImagesComponent = document.querySelector(cfg.componentSelector);

  if (!scrollImagesComponent) {
    console.warn("Scroll images component not found");
    return;
  }

  const realImages = scrollImagesComponent.querySelectorAll(
    ".scroll_images_wrapper .scroll_image"
  );

  if (!realImages.length) {
    console.warn("No scroll images found in component");
    return;
  }

  // Collect media sources
  const medias = [];
  scrollImagesComponent
    .querySelectorAll(".scroll_images_media img")
    .forEach((img) => {
      medias.push(img.getAttribute("src"));
    });

  if (!medias.length) {
    console.warn("No media sources found");
    return;
  }

  // Initialize images - set data-index and src
  realImages.forEach((image) => {
    image.setAttribute("data-index", zIndex);
    image.setAttribute("src", medias[zIndex % medias.length]);
    zIndex++;
  });

  const deltaTo = gsap.quickTo(settings, "delta", {
    duration: 2,
    ease: "power1",
    onUpdate: () => {
      incr += settings.delta; // Add the current delta value
      tl.time(incr); // Update the progression of the timeline
    },
  });

  // Create timeline
  const tl = gsap.timeline({
    paused: true,
  });

  // Animate images
  tl.to(realImages, {
    scale: 1.005,
    ease: "expo.inOut",
    duration: 20, // Fixed duration like in example
    stagger: {
      each: 2, // 1 * 8 images = 8 = duration
      repeat: -1, // Infinite repetition
      onRepeat() {
        const el = this.targets()[0];
        const movingForward = settings.delta >= 0; // Direction detection

        // Update the global zIndex
        zIndex += movingForward ? 1 : -1;

        // If moving forward: use the zIndex directly
        // If moving backward: decrease its z-index by 8 to send it to the back
        el.style.zIndex = movingForward
          ? zIndex
          : zIndex - (realImages.length - 1);

        // Select the reference element and calculate the new index
        // If moving forward: take the previous element (or last one if at the beginning)
        // If moving backward: take the next element (or first one if at the end)
        const referenceEl = movingForward
          ? el.previousElementSibling || realImages[realImages.length - 1]
          : el.nextElementSibling || realImages[0];

        // Use the mod function to ensure the index stays within the image array limits
        newIndex = mod(
          parseInt(referenceEl.getAttribute("data-index")) +
            (movingForward ? 1 : -1),
          medias.length
        );

        // Update attributes
        // Store the index for future calculations
        el.setAttribute("data-index", newIndex);
        el.setAttribute("src", medias[newIndex]);
      },
    },
  }).time(incr); // Set the progress to the value of "incr"

  // Create scroll observer - exactly like in the example
  Observer.create({
    target: window, // The element on which we listen for events (here, the window)
    type: "wheel,touch", // Listens for both scroll (wheel) and touch (swipe) events
    onChange: (e) => {
      // Ignore scroll events if scroll is disabled
      if (!isScrollEnabled) return;

      // If it's a touch movement ("touchmove"), the divider is smaller to adjust sensitivity
      const divider = e.event.type === "touchmove" ? 500 : 1000;
      deltaTo(e.deltaY / divider);
    },
    onStop: () => {
      if (!isScrollEnabled) return;
      // When the user stops scrolling, reset deltaTo to 0
      deltaTo(0);
    },
  });

  // Return API for external control if needed
  return {
    getProgress: () => incr,
    getCurrentTime: () => incr,
    enableScroll: () => {
      isScrollEnabled = true;
    },
    disableScroll: () => {
      isScrollEnabled = false;
    },
    // Animate to specific time value
    animateToTime: (targetTime, duration = 2) => {
      return gsap.to(
        { value: incr },
        {
          value: targetTime,
          duration: duration,
          ease: "power2.out",
          onUpdate: function () {
            incr = this.targets()[0].value;
            tl.time(incr);
          },
        }
      );
    },
    destroy: () => {
      tl.kill();
    },
  };
};
