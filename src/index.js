import { initScrollImages } from "./scrollImages.js";
import { initScrollImagesInfinite } from "./scrollImagesInfinite.js";
import { initLoader } from "./loader.js";
import { grainBg } from "./grain.js";
import { initForm } from "./form.js";

window.scrollImagesAnimation = null;
window.scrollImagesInfiniteAnimation = null;

window.addEventListener("DOMContentLoaded", async () => {
  const currentYear = new Date().getFullYear();
  document.querySelectorAll("#current-year").forEach((el) => {
    el.textContent = currentYear;
  });
  grainBg();

  window.scrollImagesAnimation = initScrollImages({
    initialPreloadCount: 10,
    fadeOutStart: 0.99,
  });

  window.scrollImagesInfiniteAnimation = initScrollImagesInfinite();

  const initialAssetsPromise =
    window.scrollImagesAnimation.preloadInitialAssets();

  // Pass assets promise to loader so it waits at 99%
  const loaderPromise = initLoader(initialAssetsPromise);

  await loaderPromise;

  const introAnimation = window.scrollImagesAnimation.animateToProgress(
    0.08, // Animate to 8% progress
    3.0, // Duration: 3 seconds
    0.03 // Minimum scroll position: 3% (users can scroll back to here but not below)
  );

  introAnimation.then(() => {
    window.scrollImagesAnimation.enableScroll();
  });

  initForm();
});
