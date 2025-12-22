const detectBrowser = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
  const isIOS =
    /ipad|iphone|ipod/.test(userAgent) ||
    (userAgent.includes("mac") && "ontouchend" in document);
  return { isSafari, isIOS, shouldUseMp4: isSafari || isIOS };
};

const preloadImages = (sources) => {
  return Promise.all(
    sources.map((src) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          // Force image decode to warm up GPU
          if (img.decode) {
            img
              .decode()
              .then(() => resolve(img))
              .catch(() => resolve(img));
          } else {
            resolve(img);
          }
        };
        img.onerror = () => {
          console.warn(`Failed to preload image: ${src}`);
          resolve();
        };
        img.src = src;
      });
    })
  );
};

const preloadVideo = (videoElement) => {
  return new Promise((resolve) => {
    if (videoElement.readyState >= 3) {
      resolve(videoElement);
    } else {
      videoElement.addEventListener(
        "canplaythrough",
        () => resolve(videoElement),
        { once: true }
      );
      setTimeout(() => resolve(videoElement), 5000);
    }
  });
};

export const initScrollImages = (config = {}) => {
  const defaultConfig = {
    componentSelector: ".scroll_images_component",
    imagesWrapperSelector: ".scroll_images_wrapper .scroll_image",
    imageSelector: ".scroll_image",
    headingsSelector: ".scroll_images_text_item",
    mediaSelector: ".scroll_images_media img, .scroll_images_media video",
    headingAnimationProgress: [4, 15, 26, 37, 48, 59, 70, 81, 95],
    staggerTime: 0.8,
    animationDuration: 2,
    initialIncr: 0,
    initialPreloadCount: 5,
    scrollSensitivity: {
      wheel: 1000,
      touch: 200,
    },
    deltaToConfig: {
      duration: 2.5,
      ease: "power2.out",
    },
    fadeOutStart: 0.98,
  };

  const settings = { ...defaultConfig, ...config };

  let incr = settings.initialIncr;
  let minIncr = 0; // Minimum scroll position (set after intro animation)
  let zIndex = 0;
  let newIndex = 0;
  const delta = { value: 0 };
  let isScrollEnabled = false;

  const scrollImagesComponent = document.querySelector(
    settings.componentSelector
  );

  if (!scrollImagesComponent) {
    return;
  }

  const realImages = scrollImagesComponent.querySelectorAll(
    ".scroll_images_wrapper .scroll_image"
  );
  const headings = scrollImagesComponent.querySelectorAll(
    ".scroll_images_text_item"
  );

  if (!realImages.length) {
    return;
  }

  const medias = [];
  const initialImages = []; // Track first 5 images that load immediately

  realImages.forEach((element, index) => {
    if (element.tagName === "IMG") {
      const dataSrc = element.getAttribute("data-src");
      const src = element.getAttribute("src");

      // First 10 images with real src (no data-src) - track them
      if (index < 10 && src && !dataSrc) {
        initialImages.push(element);
        medias.push({ type: "image", src, element });
      }
      // Images with data-src - will be loaded later
      else if (dataSrc) {
        medias.push({ type: "image", src: dataSrc, element });
      }
    } else if (element.tagName === "VIDEO") {
      medias.push({ type: "video", element });
    }
  });

  if (!medias.length) {
    return;
  }

  const { shouldUseMp4 } = detectBrowser();

  // Initialize video sources from data attributes and set correct format
  realImages.forEach((element) => {
    if (element.tagName === "VIDEO") {
      const sources = element.querySelectorAll("source");
      sources.forEach((source) => {
        const type = source.getAttribute("type");
        const dataSrc = source.getAttribute("data-src");

        if (shouldUseMp4 && type === "video/webm") {
          source.remove();
        } else if (!shouldUseMp4 && type === "video/mp4") {
          source.remove();
        } else if (dataSrc) {
          source.removeAttribute("src");
        }
      });
    }
  });

  const preloadInitialAssets = async () => {
    // Wait for the first 10 images (with real src) to load
    if (initialImages.length > 0) {
      await Promise.all(
        initialImages.map((img) => {
          return new Promise((resolve) => {
            if (img.complete) {
              resolve();
            } else {
              img.onload = () => resolve();
              img.onerror = () => resolve(); // Continue even if image fails
            }
          });
        })
      );

      // Force GPU upload by briefly making images visible
      // Make first 10 images visible with tiny opacity to force GPU upload
      initialImages.forEach((img) => {
        img.style.visibility = "visible";
        img.style.opacity = "0.01"; // Nearly invisible but forces GPU upload
        img.style.willChange = "transform";
        // Force a repaint
        void img.offsetHeight;
      });

      // Wait for GPU upload
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Reset opacity and hide all except first
      initialImages.forEach((img, index) => {
        img.style.opacity = "1";
        if (index > 0) {
          img.style.visibility = "hidden";
        }
      });
    }

    // Start loading remaining assets in background AFTER initial ones are ready
    setTimeout(() => preloadRemainingAssets(), 100);

    return true;
  };

  const preloadRemainingAssets = async () => {
    // Start from index 10 (after the initial images)
    const remainingAssets = medias.slice(10);

    const imageAssets = remainingAssets.filter((m) => m.type === "image");
    if (imageAssets.length > 0) {
      // Load remaining images in batches of 5
      const batchSize = 5;
      for (let i = 0; i < imageAssets.length; i += batchSize) {
        const batchAssets = imageAssets.slice(i, i + batchSize);

        // Just set src from data-src - browser will load them
        batchAssets.forEach((asset) => {
          asset.element.setAttribute("src", asset.src);
        });

        // Small delay between batches to prevent overwhelming the browser
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    const videoAssets = medias.filter((m) => m.type === "video");
    if (videoAssets.length > 0) {
      const loadVideoSequentially = async (index) => {
        if (index >= videoAssets.length) {
          return;
        }

        const v = videoAssets[index];

        const videoDataSrc = v.element.getAttribute("data-src");
        if (videoDataSrc) {
          v.element.setAttribute("src", videoDataSrc);
        } else {
          const sources = v.element.querySelectorAll("source[data-src]");
          sources.forEach((source) => {
            const dataSrc = source.getAttribute("data-src");
            if (dataSrc) {
              source.setAttribute("src", dataSrc);
            }
          });
        }

        v.element.preload = "auto";
        v.element.load();

        await preloadVideo(v.element);
        await loadVideoSequentially(index + 1);
      };

      loadVideoSequentially(0);
    }
  };

  realImages.forEach((element, index) => {
    element.setAttribute("data-index", index);

    if (element.tagName === "VIDEO") {
      element.muted = true;
      element.playsInline = true;
      element.loop = true;
      element.preload = "none";
    }

    // Hide all images initially except the first one
    if (index > 0) {
      element.style.visibility = "hidden";
    } else {
      element.style.visibility = "visible"; // Explicitly set first image visible
    }
  });

  if (realImages.length > 0 && realImages[0].tagName === "VIDEO") {
    const videoDataSrc = realImages[0].getAttribute("data-src");
    if (videoDataSrc) {
      realImages[0].setAttribute("src", videoDataSrc);
    } else {
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
    realImages[0].play().catch(() => {});
  }

  const formWrapper = document.querySelector(".form_container");
  if (formWrapper) {
    gsap.set(formWrapper, { opacity: 0 });
  }

  const totalDuration =
    (medias.length - 1) * settings.staggerTime + settings.animationDuration;

  const tl = gsap.timeline({
    paused: true,
  });

  tl.to(realImages, {
    scale: 2.5,
    z: 0.01,
    force3D: true,
    ease: "power1.inOut",
    duration: settings.animationDuration,
    transformOrigin: "center center",
    stagger: {
      each: settings.staggerTime,
      onStart() {
        const el = this.targets()[0];
        const currentIndex = parseInt(el.getAttribute("data-index"));

        zIndex++;
        el.style.zIndex = zIndex;
      },
    },
  }).time(incr);

  gsap.set(headings, { opacity: 0, y: 30 });

  // Function to update headings based on incr value
  const updateHeadingsBasedOnIncr = () => {
    headings.forEach((heading, index) => {
      if (index < settings.headingAnimationProgress.length) {
        const progressValue = settings.headingAnimationProgress[index];
        const triggerTime = (progressValue / 100) * totalDuration;
        const fadeOutTime = triggerTime + 1.7;

        if (incr >= triggerTime && incr < fadeOutTime) {
          const fadeInProgress = Math.min((incr - triggerTime) / 0.4, 1);
          const opacity = fadeInProgress < 0.05 ? 0 : fadeInProgress; // Hard cutoff for Safari
          heading.style.visibility = "visible";
          gsap.set(heading, {
            opacity: opacity,
            y: 30 - fadeInProgress * 30,
          });
        } else if (incr >= fadeOutTime && incr < fadeOutTime + 0.4) {
          // Faster fade out
          const fadeOutProgress = (incr - fadeOutTime) / 0.4;
          const opacity = fadeOutProgress > 0.95 ? 0 : 1 - fadeOutProgress; // Hard cutoff for Safari
          heading.style.visibility = "visible";
          gsap.set(heading, {
            opacity: opacity,
            y: -30 * fadeOutProgress,
          });
        } else if (incr < triggerTime) {
          heading.style.visibility = "hidden"; // Force hide for Safari
          gsap.set(heading, { opacity: 0, y: 30 });
        } else {
          heading.style.visibility = "hidden"; // Force hide for Safari
          gsap.set(heading, { opacity: 0, y: -30 });
        }
      }
    });
  };

  updateHeadingsBasedOnIncr();

  const updateVideoPlayback = () => {
    realImages.forEach((el, index) => {
      if (el.tagName === "VIDEO") {
        const startTime = index * settings.staggerTime;
        const endTime =
          startTime + settings.staggerTime + settings.animationDuration;

        const shouldBeActive = incr >= startTime && incr < endTime;

        if (shouldBeActive) {
          if (el.paused) {
            el.play().catch(() => {});
          }
        } else {
          if (!el.paused) {
            el.pause();
          }
        }
      }
    });
  };

  // Optimize performance by hiding images that are far from current view
  const optimizeVisibility = () => {
    const currentImageIndex = Math.floor(incr / settings.staggerTime);
    const visibleBefore = 4; //
    const visibleAfter = 1; // Keep 1 image after current

    realImages.forEach((el, index) => {
      const relativePosition = index - currentImageIndex;

      // Hide if outside the visible range
      if (
        relativePosition < -visibleBefore ||
        relativePosition > visibleAfter
      ) {
        // Hide and reduce GPU load for distant images
        el.style.visibility = "hidden";
        el.style.willChange = "auto";
      } else {
        el.style.visibility = "visible";
        el.style.willChange = "transform";
      }
    });
  };

  const deltaTo = gsap.quickTo(delta, "value", {
    duration: settings.deltaToConfig.duration,
    ease: settings.deltaToConfig.ease,
    onUpdate: () => {
      incr += delta.value;
      incr = Math.max(minIncr, Math.min(incr, totalDuration));

      tl.time(incr);
      updateHeadingsBasedOnIncr();
      updateVideoPlayback();

      // Only optimize visibility when scroll is enabled (not during intro animation)
      if (isScrollEnabled) {
        optimizeVisibility();
      }

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

      if (formWrapper) {
        if (progress >= 1) {
          gsap.to(formWrapper, {
            opacity: 1,
            pointerEvents: "auto",
            duration: 0.3,
          });
        } else {
          gsap.to(formWrapper, { opacity: 0, pointerEvents: "none" });
        }
      }
    },
  });

  const scrollObserver = Observer.create({
    target: window,
    type: "wheel,touch",
    onChange: (e) => {
      if (!isScrollEnabled) return;

      const isTouchEvent = e.event.type === "touchmove";
      const divider = isTouchEvent
        ? settings.scrollSensitivity.touch
        : settings.scrollSensitivity.wheel;

      const delta = isTouchEvent ? -e.deltaY : e.deltaY;
      deltaTo(delta / divider);
    },
    onStop: () => {
      if (!isScrollEnabled) return;
      deltaTo(0);
    },
  });

  return {
    preloadInitialAssets,
    preloadRemainingAssets,
    getProgress: () => incr / totalDuration,
    getTotalDuration: () => totalDuration,
    getCurrentTime: () => incr,
    enableScroll: () => {
      isScrollEnabled = true;
    },
    disableScroll: () => {
      isScrollEnabled = false;
    },
    animateToProgress: (
      targetProgress,
      duration = 2,
      minimumProgress = null
    ) => {
      const targetTime = targetProgress * totalDuration;

      // Make sure enough images are visible for intro animation
      const targetImageIndex = Math.ceil(targetTime / settings.staggerTime);
      realImages.forEach((el, index) => {
        if (index <= targetImageIndex + 1) {
          el.style.visibility = "visible";
        }
      });

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
          onComplete: function () {
            // Set minimum scroll position after intro animation
            if (minimumProgress !== null) {
              minIncr = minimumProgress * totalDuration;
            }
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
