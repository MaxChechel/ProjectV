// Form submission handler
// Watches for Webflow form success message and triggers final scroll sequence

import { initScrollImagesInfinite } from "./scrollImagesInfinite.js";

export const initFormSubmit = () => {
  const successMessage = document.querySelector(".form_success");

  if (!successMessage) {
    console.warn("Form success message not found");
    return;
  }

  // Create mutation observer to watch for display style changes
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (
        mutation.type === "attributes" &&
        mutation.attributeName === "style"
      ) {
        const displayStyle = window.getComputedStyle(successMessage).display;

        // Check if success message is now visible
        if (displayStyle === "block") {
          console.log("Form submitted! Starting final scroll sequence...");
          handleFormSuccess();
        }
      }
    });
  });

  // Start observing the success message for style attribute changes
  observer.observe(successMessage, {
    attributes: true,
    attributeFilter: ["style"],
  });

  // Handle form success
  const handleFormSuccess = () => {
    // Destroy initial scroll animation and its observer to prevent conflicts
    if (window.scrollImagesAnimation) {
      window.scrollImagesAnimation.destroy();
      window.scrollImagesAnimation = null;
    }

    // Remove initial scroll component from DOM
    const initialScrollComponent = document.querySelector(
      ".scroll_images_component"
    );
    if (initialScrollComponent) {
      gsap.to(initialScrollComponent, {
        opacity: 0,
        duration: 0.5,
        onComplete: () => {
          initialScrollComponent.remove();
        },
      });
    }

    // Show and initialize final infinite scroll sequence
    setTimeout(() => {
      const finalScrollComponent = document.querySelector(
        ".scroll_images_final"
      );
      if (finalScrollComponent) {
        // Add is-diff class to form container
        const formContainer = document.querySelector(".form_container");
        if (formContainer) {
          formContainer.classList.add("is-diff");
        }

        // Fade in the component
        gsap.to(finalScrollComponent, {
          opacity: 1,
          duration: 0.5,
        });

        // Initialize infinite scroll - starts at 0
        const finalScrollAnimation = initScrollImagesInfinite();

        // Auto-play intro animation - animate from 0 to 7
        const introAnimation = finalScrollAnimation.animateToTime(
          3, // Target time
          2 // Duration: 2 seconds for smooth intro
        );

        // Animation completes - user can now scroll infinitely
        introAnimation.then(() => {
          finalScrollAnimation.enableScroll();
        });
      }
    }, 600);
  };
};
