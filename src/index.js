import { initScrollImages } from "./scrollImages.js";
import { initScrollImagesInfinite } from "./scrollImagesInfinite.js";
import { initLoader } from "./loader.js";
import { grainBg } from "./grain.js";
import { initForm } from "./form.js";

// Store animations globally
window.scrollImagesAnimation = null;
window.scrollImagesInfiniteAnimation = null;

// Wait for required dependencies to load
const waitForDependencies = () => {
  return new Promise((resolve) => {
    const checkDependencies = () => {
      const hasGsap = typeof gsap !== "undefined";
      const hasObserver = typeof Observer !== "undefined";
      const hasGrained = typeof grained !== "undefined";

      console.log("Checking dependencies:", {
        gsap: hasGsap,
        Observer: hasObserver,
        grained: hasGrained,
      });

      if (hasGsap && hasObserver && hasGrained) {
        console.log("✓ All dependencies loaded!");
        resolve();
      } else {
        console.log("⏳ Waiting for dependencies...");
        setTimeout(checkDependencies, 100);
      }
    };
    checkDependencies();
  });
};

// Sequence: Loader first, then ScrollImages
window.addEventListener("DOMContentLoaded", async () => {
  // Wait for GSAP, Observer, and Grained to be available
  await waitForDependencies();
  grainBg();

  // 1. Initialize scroll images component (returns API with preload methods)
  window.scrollImagesAnimation = initScrollImages({
    headingAnimationProgress: [10, 20, 50, 70, 90],
    initialPreloadCount: 5, // Preload first 5 assets during loader
    fadeOutStart: 0.95,
  });

  // 2. Initialize infinite scroll (images will load naturally when needed)
  window.scrollImagesInfiniteAnimation = initScrollImagesInfinite();

  // 3. PHASE 1: Preload first 5 assets during loader
  // (This will auto-trigger Phase 2 after first 5 images are loaded)
  const loaderPromise = initLoader();
  const initialAssetsPromise =
    window.scrollImagesAnimation.preloadInitialAssets();

  // Wait for both loader and initial assets to complete
  await Promise.all([loaderPromise, initialAssetsPromise]);
  console.log("✓ Loader finished & first 5 assets ready");
  console.log("✓ Videos and remaining images already loading in background");

  // 4. Auto-play from 0% to 3% to show initial animation
  const introAnimation = window.scrollImagesAnimation.animateToProgress(
    0.03,
    1.5
  ); // 3% over 1.5 seconds

  // 5. Enable scroll after intro animation completes
  introAnimation.then(() => {
    window.scrollImagesAnimation.enableScroll();
    console.log("🚀 Scroll enabled! User can now interact.");
  });

  console.log("🎬 ScrollImages initialized and playing intro!");

  // Initialize form functionality
  initForm();
});
