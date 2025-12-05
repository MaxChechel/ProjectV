// Scroll Images Animation Component
// Handles scroll-based image transitions with text animations

// Browser detection utility
const detectBrowser = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
  const isIOS =
    /ipad|iphone|ipod/.test(userAgent) ||
    (userAgent.includes("mac") && "ontouchend" in document);
  return { isSafari, isIOS, shouldUseMp4: isSafari || isIOS };
};

// Preload images helper
const preloadImages = (sources) => {
  return Promise.all(
    sources.map((src) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => {
          console.warn(`Failed to preload image: ${src}`);
          resolve();
        };
        img.src = src;
      });
    })
  );
};

// Preload videos helper
const preloadVideo = (videoElement) => {
  return new Promise((resolve) => {
    // Resolve when enough data is loaded
    if (videoElement.readyState >= 3) {
      resolve(videoElement);
    } else {
      videoElement.addEventListener(
        "canplaythrough",
        () => resolve(videoElement),
        { once: true }
      );
      // Fallback timeout
      setTimeout(() => resolve(videoElement), 5000);
    }
  });
};

export const initScrollImages = (config = {}) => {
  // Default configuration
  const defaultConfig = {
    componentSelector: ".scroll_images_component",
    imagesWrapperSelector: ".scroll_images_wrapper .scroll_image",
    imageSelector: ".scroll_image",
    headingsSelector: ".scroll_images_text_item",
    mediaSelector: ".scroll_images_media img, .scroll_images_media video",
    headingAnimationProgress: [10, 20, 50, 70, 90],
    staggerTime: 2.5,
    animationDuration: 2,
    initialIncr: 0,
    initialPreloadCount: 5, // Preload first 5 assets during loader
    scrollSensitivity: {
      wheel: 1000,
      touch: 500,
    },
    deltaToConfig: {
      duration: 2.5, // Faster deceleration (was 2.5)
      ease: "power2.out",
    },
    fadeOutStart: 0.95, // Start fading at 95% progress
  };

  // Merge config with defaults
  const settings = { ...defaultConfig, ...config };

  // Animation state
  let incr = settings.initialIncr;
  let zIndex = 0;
  let newIndex = 0;
  const delta = { value: 0 };
  let isScrollEnabled = false; // Control scroll availability

  // Get DOM elements - scope to specific component
  const scrollImagesComponent = document.querySelector(
    settings.componentSelector
  );

  if (!scrollImagesComponent) {
    console.warn("Scroll images component not found");
    return;
  }

  // Query elements within the component only
  const realImages = scrollImagesComponent.querySelectorAll(
    ".scroll_images_wrapper .scroll_image"
  );
  const headings = scrollImagesComponent.querySelectorAll(
    ".scroll_images_text_item"
  );

  if (!realImages.length) {
    console.warn("No scroll images found in component");
    return;
  }

  // Collect ALL media (images and videos) from wrapper
  const medias = [];

  realImages.forEach((element) => {
    if (element.tagName === "IMG") {
      const src = element.getAttribute("src");
      if (src) {
        medias.push({ type: "image", src, element });
      }
    } else if (element.tagName === "VIDEO") {
      medias.push({ type: "video", element });
    }
  });

  if (!medias.length) {
    console.warn("No media sources found");
    return;
  }

  console.log(
    `Found ${medias.length} media items:`,
    medias.map((m) => m.type)
  );

  console.log(
    `Found ${medias.length} media items:`,
    medias.map((m) => m.type)
  );

  // Detect browser for video format handling
  const { shouldUseMp4 } = detectBrowser();

  // Initialize video sources from data attributes and set correct format
  realImages.forEach((element) => {
    if (element.tagName === "VIDEO") {
      const sources = element.querySelectorAll("source");
      sources.forEach((source) => {
        const type = source.getAttribute("type");
        const dataSrc = source.getAttribute("data-src");

        // Remove incorrect format immediately
        if (shouldUseMp4 && type === "video/webm") {
          source.remove();
        } else if (!shouldUseMp4 && type === "video/mp4") {
          source.remove();
        } else if (dataSrc) {
          // Keep the source but don't set src yet (prevents loading)
          source.removeAttribute("src");
        }
      });
    }
  });

  // PHASE 1: Preload first N assets (during loader)
  const preloadInitialAssets = async () => {
    const initialAssets = medias.slice(0, settings.initialPreloadCount);
    const imageAssets = initialAssets.filter((m) => m.type === "image");

    if (imageAssets.length > 0) {
      const imageSources = imageAssets.map((m) => m.src);
      await preloadImages(imageSources);
      console.log(`✓ Preloaded first ${imageAssets.length} images`);
    }

    // IMMEDIATELY start loading remaining assets (don't wait for loader to end)
    console.log("🚀 Starting to load remaining assets in background...");
    preloadRemainingAssets();

    return true;
  };

  // PHASE 2: Load remaining assets (starts automatically after Phase 1)
  const preloadRemainingAssets = async () => {
    const remainingAssets = medias.slice(settings.initialPreloadCount);

    // Load all remaining images (in parallel, they're smaller)
    const imageAssets = remainingAssets.filter((m) => m.type === "image");
    if (imageAssets.length > 0) {
      const imageSources = imageAssets.map((m) => m.src);
      preloadImages(imageSources).then(() => {
        console.log(`✓ Preloaded ${imageAssets.length} remaining images`);
      });
    }

    // Load videos SEQUENTIALLY (one at a time)
    const videoAssets = medias.filter((m) => m.type === "video");
    if (videoAssets.length > 0) {
      console.log(`📹 Loading ${videoAssets.length} videos sequentially...`);

      // Sequential loading function
      const loadVideoSequentially = async (index) => {
        if (index >= videoAssets.length) {
          console.log(`✓ All ${videoAssets.length} videos preloaded`);
          return;
        }

        const v = videoAssets[index];
        console.log(`📹 Loading video ${index + 1}/${videoAssets.length}`);

        // Check if data-src is on video element itself
        const videoDataSrc = v.element.getAttribute("data-src");
        if (videoDataSrc) {
          v.element.setAttribute("src", videoDataSrc);
        } else {
          // Or activate source tags
          const sources = v.element.querySelectorAll("source[data-src]");
          sources.forEach((source) => {
            const dataSrc = source.getAttribute("data-src");
            if (dataSrc) {
              source.setAttribute("src", dataSrc);
            }
          });
        }

        // Enable preload and load
        v.element.preload = "auto";
        v.element.load();

        // Wait for this video to load before starting next
        await preloadVideo(v.element);
        console.log(`✓ Video ${index + 1}/${videoAssets.length} ready`);

        // Load next video
        await loadVideoSequentially(index + 1);
      };

      // Start sequential loading
      loadVideoSequentially(0);
    }
  };

  // Set data-index for all elements and configure videos
  realImages.forEach((element, index) => {
    element.setAttribute("data-index", index);

    // Ensure videos have correct attributes but DON'T load yet
    if (element.tagName === "VIDEO") {
      element.muted = true;
      element.playsInline = true;
      element.loop = true;
      element.preload = "none"; // Don't load until we're ready
    }
  });

  // Play initial video if the first element is a video (and activate sources first)
  if (realImages.length > 0 && realImages[0].tagName === "VIDEO") {
    // Check if data-src is on video element itself
    const videoDataSrc = realImages[0].getAttribute("data-src");
    if (videoDataSrc) {
      realImages[0].setAttribute("src", videoDataSrc);
    } else {
      // Or activate source tags
      const sources = realImages[0].querySelectorAll("source[data-src]");
      sources.forEach((source) => {
        const dataSrc = source.getAttribute("data-src");
        if (dataSrc) {
          source.setAttribute("src", dataSrc);
        }
      });
    }

    realImages[0].preload = "auto";
    realImages[0].load();
    // Don't set currentTime - let it start naturally or resume
    realImages[0]
      .play()
      .catch((e) => console.warn("Initial video play failed:", e));
  }

  // Set initial state for form wrapper (hidden)
  const formWrapper = document.querySelector(".form_container");
  if (formWrapper) {
    gsap.set(formWrapper, { opacity: 0 });
  }

  // Calculate total animation duration based on number of media items
  const totalDuration =
    (medias.length - 1) * settings.staggerTime + settings.animationDuration;

  // Create timeline
  const tl = gsap.timeline({
    paused: true,
  });

  // Animate all scroll images/videos
  tl.to(realImages, {
    scale: 1.005,
    ease: "power1.inOut",
    duration: settings.animationDuration,
    stagger: {
      each: settings.staggerTime,
      onStart() {
        const el = this.targets()[0];
        const currentIndex = parseInt(el.getAttribute("data-index"));

        // Bring current element to front
        zIndex++;
        el.style.zIndex = zIndex;

        // Videos will resume from where they were paused
        // No currentTime reset - handled by updateVideoPlayback()
      },
    },
  }).time(incr);

  // Set initial state for all headings
  gsap.set(headings, { opacity: 0, y: 30 });

  // Function to update headings based on incr value
  const updateHeadingsBasedOnIncr = () => {
    headings.forEach((heading, index) => {
      if (index < settings.headingAnimationProgress.length) {
        const progressValue = settings.headingAnimationProgress[index];
        const triggerTime = (progressValue / 100) * totalDuration;
        const fadeOutTime = triggerTime + 1.5; // Duration heading stays visible

        // Calculate opacity and position based on incr
        if (incr >= triggerTime && incr < fadeOutTime) {
          // Fade in phase
          const fadeInProgress = Math.min((incr - triggerTime) / 0.6, 1);
          gsap.set(heading, {
            opacity: fadeInProgress,
            y: 30 - fadeInProgress * 30,
          });
        } else if (incr >= fadeOutTime && incr < fadeOutTime + 0.6) {
          // Fade out phase
          const fadeOutProgress = (incr - fadeOutTime) / 0.6;
          gsap.set(heading, {
            opacity: 1 - fadeOutProgress,
            y: -30 * fadeOutProgress,
          });
        } else if (incr < triggerTime) {
          // Before trigger
          gsap.set(heading, { opacity: 0, y: 30 });
        } else {
          // After fade out
          gsap.set(heading, { opacity: 0, y: -30 });
        }
      }
    });
  };

  // Initial update
  updateHeadingsBasedOnIncr();

  // Function to update video playback based on current timeline position
  const updateVideoPlayback = () => {
    realImages.forEach((el, index) => {
      if (el.tagName === "VIDEO") {
        const startTime = index * settings.staggerTime;
        // Video should play until the NEXT element finishes scaling up
        // That means: current start + stagger (to reach next) + animationDuration (next scales)
        const endTime =
          startTime + settings.staggerTime + settings.animationDuration;

        const shouldBeActive = incr >= startTime && incr < endTime;

        if (shouldBeActive) {
          // Video should be playing - check every frame
          if (el.paused) {
            el.play().catch((e) => {
              // Silently fail and retry on next frame if needed
            });
          }
        } else {
          // Video should be paused
          if (!el.paused) {
            el.pause();
          }
        }
      }
    });
  };

  // Setup delta animation
  const deltaTo = gsap.quickTo(delta, "value", {
    duration: settings.deltaToConfig.duration,
    ease: settings.deltaToConfig.ease,
    onUpdate: () => {
      incr += delta.value;

      // Clamp incr to stay within timeline bounds
      incr = Math.max(0, Math.min(incr, totalDuration));

      tl.time(incr);

      // Animate headings based on incr value
      updateHeadingsBasedOnIncr();

      // Update video playback based on timeline position
      updateVideoPlayback();

      // Fade out component when animation reaches the end
      const progress = incr / totalDuration;
      if (progress >= settings.fadeOutStart) {
        const fadeProgress =
          (progress - settings.fadeOutStart) / (1 - settings.fadeOutStart);
        gsap.set(scrollImagesComponent, {
          opacity: 1 - fadeProgress,
        });
      } else {
        gsap.set(scrollImagesComponent, { opacity: 1 });
      }

      // Show form_wrapper when animation is complete
      //const formWrapper = document.querySelector(".form_wrapper");
      if (formWrapper) {
        if (progress >= 1) {
          // Animation complete - show form
          gsap.to(formWrapper, { opacity: 1, pointerEvents: "auto" });
        } else {
          // Animation not complete - hide form
          gsap.to(formWrapper, { opacity: 0, pointerEvents: "none" });
        }
      }
    },
  });

  // Create scroll observer
  const scrollObserver = Observer.create({
    target: window,
    type: "wheel,touch",
    onChange: (e) => {
      // Ignore scroll events if scroll is disabled
      if (!isScrollEnabled) return;

      const divider =
        e.event.type === "touchmove"
          ? settings.scrollSensitivity.touch
          : settings.scrollSensitivity.wheel;
      deltaTo(e.deltaY / divider);
    },
    onStop: () => {
      if (!isScrollEnabled) return;
      deltaTo(0);
    },
  });

  // Return API for external control if needed
  return {
    preloadInitialAssets, // Call during loader
    preloadRemainingAssets, // Call after loader finishes
    getProgress: () => incr / totalDuration,
    getTotalDuration: () => totalDuration,
    getCurrentTime: () => incr,
    enableScroll: () => {
      isScrollEnabled = true;
    },
    disableScroll: () => {
      isScrollEnabled = false;
    },
    // Animate to specific progress (0-1)
    animateToProgress: (targetProgress, duration = 2) => {
      const targetTime = targetProgress * totalDuration;
      return gsap.to(
        { value: incr },
        {
          value: targetTime,
          duration: duration,
          ease: "power2.out",
          onUpdate: function () {
            incr = this.targets()[0].value;
            tl.time(incr);
            updateHeadingsBasedOnIncr();
          },
        }
      );
    },
    destroy: () => {
      tl.kill();
      if (scrollObserver) {
        scrollObserver.kill();
      }
    },
  };
};
