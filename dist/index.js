(() => {
  // src/scrollImages.js
  var detectBrowser = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
    const isIOS = /ipad|iphone|ipod/.test(userAgent) || userAgent.includes("mac") && "ontouchend" in document;
    return { isSafari, isIOS, shouldUseMp4: isSafari || isIOS };
  };
  var preloadImages = (sources) => {
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
  var preloadVideo = (videoElement) => {
    return new Promise((resolve) => {
      if (videoElement.readyState >= 3) {
        resolve(videoElement);
      } else {
        videoElement.addEventListener(
          "canplaythrough",
          () => resolve(videoElement),
          { once: true }
        );
        setTimeout(() => resolve(videoElement), 5e3);
      }
    });
  };
  var initScrollImages = (config = {}) => {
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
      initialPreloadCount: 5,
      // Preload first 5 assets during loader
      scrollSensitivity: {
        wheel: 1e3,
        touch: 500
      },
      deltaToConfig: {
        duration: 2.5,
        // Faster deceleration (was 2.5)
        ease: "power2.out"
      },
      fadeOutStart: 0.95
      // Start fading at 95% progress
    };
    const settings = { ...defaultConfig, ...config };
    let incr = settings.initialIncr;
    let zIndex = 0;
    let newIndex = 0;
    const delta = { value: 0 };
    let isScrollEnabled = false;
    const scrollImagesComponent = document.querySelector(
      settings.componentSelector
    );
    if (!scrollImagesComponent) {
      console.warn("Scroll images component not found");
      return;
    }
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
    const { shouldUseMp4 } = detectBrowser();
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
      const initialAssets = medias.slice(0, settings.initialPreloadCount);
      const imageAssets = initialAssets.filter((m) => m.type === "image");
      if (imageAssets.length > 0) {
        const imageSources = imageAssets.map((m) => m.src);
        await preloadImages(imageSources);
        console.log(`\u2713 Preloaded first ${imageAssets.length} images`);
      }
      console.log("\u{1F680} Starting to load remaining assets in background...");
      preloadRemainingAssets();
      return true;
    };
    const preloadRemainingAssets = async () => {
      const remainingAssets = medias.slice(settings.initialPreloadCount);
      const imageAssets = remainingAssets.filter((m) => m.type === "image");
      if (imageAssets.length > 0) {
        const imageSources = imageAssets.map((m) => m.src);
        preloadImages(imageSources).then(() => {
          console.log(`\u2713 Preloaded ${imageAssets.length} remaining images`);
        });
      }
      const videoAssets = medias.filter((m) => m.type === "video");
      if (videoAssets.length > 0) {
        console.log(`\u{1F4F9} Loading ${videoAssets.length} videos sequentially...`);
        const loadVideoSequentially = async (index) => {
          if (index >= videoAssets.length) {
            console.log(`\u2713 All ${videoAssets.length} videos preloaded`);
            return;
          }
          const v = videoAssets[index];
          console.log(`\u{1F4F9} Loading video ${index + 1}/${videoAssets.length}`);
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
          console.log(`\u2713 Video ${index + 1}/${videoAssets.length} ready`);
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
      realImages[0].play().catch((e) => console.warn("Initial video play failed:", e));
    }
    const formWrapper = document.querySelector(".form_container");
    if (formWrapper) {
      gsap.set(formWrapper, { opacity: 0 });
    }
    const totalDuration = (medias.length - 1) * settings.staggerTime + settings.animationDuration;
    const tl = gsap.timeline({
      paused: true
    });
    tl.to(realImages, {
      scale: 1.005,
      ease: "power1.inOut",
      duration: settings.animationDuration,
      stagger: {
        each: settings.staggerTime,
        onStart() {
          const el = this.targets()[0];
          const currentIndex = parseInt(el.getAttribute("data-index"));
          zIndex++;
          el.style.zIndex = zIndex;
        }
      }
    }).time(incr);
    gsap.set(headings, { opacity: 0, y: 30 });
    const updateHeadingsBasedOnIncr = () => {
      headings.forEach((heading, index) => {
        if (index < settings.headingAnimationProgress.length) {
          const progressValue = settings.headingAnimationProgress[index];
          const triggerTime = progressValue / 100 * totalDuration;
          const fadeOutTime = triggerTime + 1.5;
          if (incr >= triggerTime && incr < fadeOutTime) {
            const fadeInProgress = Math.min((incr - triggerTime) / 0.6, 1);
            gsap.set(heading, {
              opacity: fadeInProgress,
              y: 30 - fadeInProgress * 30
            });
          } else if (incr >= fadeOutTime && incr < fadeOutTime + 0.6) {
            const fadeOutProgress = (incr - fadeOutTime) / 0.6;
            gsap.set(heading, {
              opacity: 1 - fadeOutProgress,
              y: -30 * fadeOutProgress
            });
          } else if (incr < triggerTime) {
            gsap.set(heading, { opacity: 0, y: 30 });
          } else {
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
          const endTime = startTime + settings.staggerTime + settings.animationDuration;
          const shouldBeActive = incr >= startTime && incr < endTime;
          if (shouldBeActive) {
            if (el.paused) {
              el.play().catch((e) => {
              });
            }
          } else {
            if (!el.paused) {
              el.pause();
            }
          }
        }
      });
    };
    const deltaTo = gsap.quickTo(delta, "value", {
      duration: settings.deltaToConfig.duration,
      ease: settings.deltaToConfig.ease,
      onUpdate: () => {
        incr += delta.value;
        incr = Math.max(0, Math.min(incr, totalDuration));
        tl.time(incr);
        updateHeadingsBasedOnIncr();
        updateVideoPlayback();
        const progress = incr / totalDuration;
        if (progress >= settings.fadeOutStart) {
          const fadeProgress = (progress - settings.fadeOutStart) / (1 - settings.fadeOutStart);
          gsap.set(scrollImagesComponent, {
            opacity: 1 - fadeProgress
          });
        } else {
          gsap.set(scrollImagesComponent, { opacity: 1 });
        }
        if (formWrapper) {
          if (progress >= 1) {
            gsap.to(formWrapper, { opacity: 1, pointerEvents: "auto" });
          } else {
            gsap.to(formWrapper, { opacity: 0, pointerEvents: "none" });
          }
        }
      }
    });
    const scrollObserver = Observer.create({
      target: window,
      type: "wheel,touch",
      onChange: (e) => {
        if (!isScrollEnabled)
          return;
        const divider = e.event.type === "touchmove" ? settings.scrollSensitivity.touch : settings.scrollSensitivity.wheel;
        deltaTo(e.deltaY / divider);
      },
      onStop: () => {
        if (!isScrollEnabled)
          return;
        deltaTo(0);
      }
    });
    return {
      preloadInitialAssets,
      // Call during loader
      preloadRemainingAssets,
      // Call after loader finishes
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
            duration,
            ease: "power2.out",
            onUpdate: function() {
              incr = this.targets()[0].value;
              tl.time(incr);
              updateHeadingsBasedOnIncr();
            }
          }
        );
      },
      destroy: () => {
        tl.kill();
        if (scrollObserver) {
          scrollObserver.kill();
        }
      }
    };
  };

  // src/scrollImagesInfinite.js
  var mod = (n, m) => (n % m + m) % m;
  var initScrollImagesInfinite = (config = {}) => {
    const defaultConfig = {
      componentSelector: ".scroll_images_final",
      scrollSensitivity: {
        wheel: 1e3,
        touch: 500
      }
    };
    const cfg = { ...defaultConfig, ...config };
    let incr = 0;
    let zIndex = 0;
    let newIndex = 0;
    const settings = { delta: 0 };
    let isScrollEnabled = false;
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
    const medias = [];
    scrollImagesComponent.querySelectorAll(".scroll_images_media img").forEach((img) => {
      medias.push(img.getAttribute("src"));
    });
    if (!medias.length) {
      console.warn("No media sources found");
      return;
    }
    realImages.forEach((image) => {
      image.setAttribute("data-index", zIndex);
      image.setAttribute("src", medias[zIndex % medias.length]);
      zIndex++;
    });
    const deltaTo = gsap.quickTo(settings, "delta", {
      duration: 2,
      ease: "power1",
      onUpdate: () => {
        incr += settings.delta;
        tl.time(incr);
      }
    });
    const tl = gsap.timeline({
      paused: true
    });
    tl.to(realImages, {
      scale: 1.005,
      ease: "expo.inOut",
      duration: 20,
      // Fixed duration like in example
      stagger: {
        each: 2,
        // 1 * 8 images = 8 = duration
        repeat: -1,
        // Infinite repetition
        onRepeat() {
          const el = this.targets()[0];
          const movingForward = settings.delta >= 0;
          zIndex += movingForward ? 1 : -1;
          el.style.zIndex = movingForward ? zIndex : zIndex - (realImages.length - 1);
          const referenceEl = movingForward ? el.previousElementSibling || realImages[realImages.length - 1] : el.nextElementSibling || realImages[0];
          newIndex = mod(
            parseInt(referenceEl.getAttribute("data-index")) + (movingForward ? 1 : -1),
            medias.length
          );
          el.setAttribute("data-index", newIndex);
          el.setAttribute("src", medias[newIndex]);
        }
      }
    }).time(incr);
    Observer.create({
      target: window,
      // The element on which we listen for events (here, the window)
      type: "wheel,touch",
      // Listens for both scroll (wheel) and touch (swipe) events
      onChange: (e) => {
        if (!isScrollEnabled)
          return;
        const divider = e.event.type === "touchmove" ? 500 : 1e3;
        deltaTo(e.deltaY / divider);
      },
      onStop: () => {
        if (!isScrollEnabled)
          return;
        deltaTo(0);
      }
    });
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
            duration,
            ease: "power2.out",
            onUpdate: function() {
              incr = this.targets()[0].value;
              tl.time(incr);
            }
          }
        );
      },
      destroy: () => {
        tl.kill();
      }
    };
  };

  // src/loader.js
  var initLoader = () => {
    const loaderWrapper = document.querySelector(".loader_wrapper");
    const numsWrapper = document.querySelector(".loader_nums_wrap");
    const numsTrack1 = document.querySelector(".loader_num_track.is-1");
    const numsTrack2 = document.querySelector(".loader_num_track.is-2");
    const track2Zero = numsTrack2.querySelector(".loader_num:first-child");
    const track1Numbers = numsTrack1.querySelectorAll(
      ".loader_num:not(:first-child)"
    );
    const track2Numbers = numsTrack2.querySelectorAll(
      ".loader_num:not(:first-child)"
    );
    return new Promise((resolve) => {
      const loaderTl = gsap.timeline({
        delay: 0.5,
        onComplete: () => {
          console.log("\u2705 Loader complete!");
          resolve();
        }
      });
      const loaderStep1 = gsap.timeline();
      loaderStep1.to(numsWrapper, {
        x: loaderWrapper.scrollWidth / 5,
        duration: 0.7,
        ease: "circ.out"
      }).to(
        numsTrack1,
        {
          width: "auto"
        },
        0
      ).to(
        [track1Numbers[0], track2Numbers[0]],
        {
          y: "0%",
          opacity: 1,
          filter: "blur(0px)",
          duration: 0.75,
          ease: "circ.out",
          stagger: 0.1
        },
        "<25%"
      ).to(
        track2Zero,
        {
          y: "-100%",
          opacity: 0,
          filter: "blur(4px)",
          duration: 0.5,
          ease: "circ.out"
        },
        "<0%"
      );
      const loaderStep2 = gsap.timeline();
      loaderStep2.to(numsWrapper, {
        x: loaderWrapper.scrollWidth / 1.75,
        duration: 1.4,
        ease: "circ.out"
      }).to(
        [track1Numbers[0], track2Numbers[0]],
        {
          y: "-100%",
          opacity: 0,
          filter: "blur(4px)",
          duration: 0.5,
          ease: "circ.out",
          stagger: 0.1
        },
        "<0%"
      ).to(
        [track1Numbers[1], track2Numbers[1]],
        {
          y: "0%",
          opacity: 1,
          filter: "blur(0px)",
          duration: 0.75,
          ease: "circ.out",
          stagger: 0.1
        },
        "<0%"
      );
      const loaderStep3 = gsap.timeline();
      loaderStep3.to(numsWrapper, {
        x: () => loaderWrapper.scrollWidth - numsWrapper.scrollWidth,
        duration: 0.8,
        ease: "circ.out"
      }).to(
        [track1Numbers[1], track2Numbers[1]],
        {
          y: "-100%",
          opacity: 0,
          filter: "blur(4px)",
          duration: 0.5,
          ease: "circ.out",
          stagger: 0.1
        },
        "<0%"
      ).to(
        [track1Numbers[2], track2Numbers[2]],
        {
          y: "0%",
          opacity: 1,
          filter: "blur(0px)",
          duration: 0.75,
          ease: "circ.out",
          stagger: 0.1
        },
        "<25%"
      );
      loaderTl.add(loaderStep1).add(loaderStep2, ">.5").add(loaderStep3, ">.5").to(loaderWrapper, {
        opacity: 0,
        duration: 0.6
      });
    });
  };

  // src/grain.js
  var grainBg = () => {
    const options = {
      animate: true,
      patternWidth: 100,
      patternHeight: 100,
      grainOpacity: 0.05,
      grainDensity: 1,
      grainWidth: 1,
      grainHeight: 1
    };
    grained("#grain", options);
  };

  // src/formTypeSize.js
  var initFormTypeSize = () => {
    const formInputs = document.querySelectorAll(".form_input");
    if (!formInputs.length)
      return;
    formInputs.forEach((input) => {
      const baseFontSize = 17.5;
      const measureSpan = document.createElement("span");
      measureSpan.id = "form-measure-span";
      measureSpan.style.position = "absolute";
      measureSpan.style.visibility = "hidden";
      measureSpan.style.whiteSpace = "nowrap";
      measureSpan.style.fontFamily = window.getComputedStyle(input).fontFamily;
      document.body.appendChild(measureSpan);
      const updateFontSize = () => {
        const textLength = input.value.length;
        if (textLength === 0) {
          gsap.to(input, {
            fontSize: `${baseFontSize}vw`,
            duration: 0.3,
            ease: "power2.out"
          });
          return;
        }
        const inputWidth = input.offsetWidth;
        let minSize = 1;
        let maxSize = baseFontSize;
        let optimalSize = baseFontSize;
        for (let i = 0; i < 15; i++) {
          const testSize = (minSize + maxSize) / 2;
          measureSpan.style.fontSize = `${testSize}vw`;
          measureSpan.textContent = input.value;
          const textWidth = measureSpan.offsetWidth;
          if (textWidth <= inputWidth * 0.98) {
            minSize = testSize;
            optimalSize = testSize;
          } else {
            maxSize = testSize;
          }
        }
        gsap.to(input, {
          fontSize: `${optimalSize}vw`,
          duration: 0.3,
          ease: "power2.out"
        });
      };
      gsap.set(input, { fontSize: `${baseFontSize}vw` });
      input.addEventListener("input", updateFontSize);
      input.addEventListener("paste", () => {
        setTimeout(updateFontSize, 10);
      });
    });
  };

  // src/formCursor.js
  var initFormCursor = () => {
    const formInput = document.querySelector(".form_input");
    if (!formInput)
      return;
    const inputParent = formInput.parentElement;
    inputParent.style.position = "relative";
    const submitWrapper = document.querySelector(".form_submit_wrapper");
    const cursorDiv = document.createElement("div");
    cursorDiv.className = "form_cursor";
    cursorDiv.innerHTML = `
    <svg width="100%" height="100%" viewBox="0 0 44 272" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21.6074 8.48883V263.489" stroke="currentColor"/>
      <path d="M0.107422 0.488831C0.507422 0.574762 14.6074 5.85797 21.6074 8.48883L43.1074 0.488831" stroke="currentColor"/>
      <path d="M0.107422 271.489C0.507422 271.403 14.6074 266.12 21.6074 263.489L43.1074 271.489" stroke="currentColor"/>
    </svg>
  `;
    cursorDiv.style.position = "absolute";
    cursorDiv.style.pointerEvents = "none";
    cursorDiv.style.top = "50%";
    cursorDiv.style.transform = "translate(-50%, -50%)";
    cursorDiv.style.transition = "left 0.05s ease-out";
    cursorDiv.style.height = "80%";
    inputParent.appendChild(cursorDiv);
    formInput.style.caretColor = "transparent";
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const updateCursorPosition = () => {
      requestAnimationFrame(() => {
        const styles = window.getComputedStyle(formInput);
        const fontSize = styles.fontSize;
        const fontFamily = styles.fontFamily;
        const fontWeight = styles.fontWeight;
        ctx.font = `${fontWeight} ${fontSize} ${fontFamily}`;
        const cursorPos = formInput.selectionStart !== null ? formInput.selectionStart : formInput.value.length;
        const textBeforeCursor = formInput.value.substring(0, cursorPos);
        const textWidth = ctx.measureText(textBeforeCursor).width;
        const inputRect = formInput.getBoundingClientRect();
        const parentRect = inputParent.getBoundingClientRect();
        const inputPaddingLeft = parseFloat(styles.paddingLeft) || 0;
        const leftOffset = inputRect.left - parentRect.left + inputPaddingLeft + textWidth;
        cursorDiv.style.left = `${leftOffset}px`;
        console.log("Cursor:", {
          cursorPos,
          text: textBeforeCursor,
          textWidth,
          leftOffset
        });
      });
    };
    let blinkTimeline = gsap.timeline({ repeat: -1 });
    blinkTimeline.to(cursorDiv, { opacity: 0, duration: 0.5, ease: "steps(1)" }).to(cursorDiv, { opacity: 1, duration: 0.5, ease: "steps(1)" });
    formInput.addEventListener("focus", () => {
      cursorDiv.style.opacity = "1";
      blinkTimeline.play();
      updateCursorPosition();
    });
    formInput.addEventListener("blur", () => {
      cursorDiv.style.opacity = "0";
      blinkTimeline.pause();
    });
    formInput.addEventListener("input", () => {
      updateCursorPosition();
      if (submitWrapper) {
        if (formInput.value.length >= 1) {
          gsap.to(submitWrapper, {
            width: "100%",
            duration: 0.3,
            ease: "power2.out"
          });
        } else {
          gsap.to(submitWrapper, {
            width: "",
            duration: 0.3,
            ease: "power2.out"
          });
        }
      }
    });
    formInput.addEventListener("click", updateCursorPosition);
    formInput.addEventListener("keyup", updateCursorPosition);
    formInput.addEventListener("keydown", updateCursorPosition);
    formInput.addEventListener("mouseup", updateCursorPosition);
    formInput.addEventListener("select", updateCursorPosition);
    formInput.addEventListener("selectionchange", updateCursorPosition);
    if (document.activeElement === formInput) {
      cursorDiv.style.opacity = "1";
      blinkTimeline.play();
      updateCursorPosition();
    } else {
      cursorDiv.style.opacity = "0";
      blinkTimeline.pause();
    }
  };

  // src/formValidation.js
  var initFormValidation = () => {
    const formInput = document.querySelector(".form_input");
    const submitWrapper = document.querySelector(".form_submit_wrapper");
    if (!formInput || !submitWrapper)
      return;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    const validateEmail = () => {
      const email = formInput.value.trim();
      const isValid = emailPattern.test(email);
      if (isValid) {
        submitWrapper.classList.add("is-active");
      } else {
        submitWrapper.classList.remove("is-active");
      }
    };
    formInput.addEventListener("input", validateEmail);
    formInput.addEventListener("paste", () => {
      setTimeout(validateEmail, 10);
    });
    validateEmail();
  };

  // src/formSubmit.js
  var initFormSubmit = () => {
    const successMessage = document.querySelector(".form_success");
    if (!successMessage) {
      console.warn("Form success message not found");
      return;
    }
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "attributes" && mutation.attributeName === "style") {
          const displayStyle = window.getComputedStyle(successMessage).display;
          if (displayStyle === "block") {
            console.log("Form submitted! Starting final scroll sequence...");
            handleFormSuccess();
          }
        }
      });
    });
    observer.observe(successMessage, {
      attributes: true,
      attributeFilter: ["style"]
    });
    const handleFormSuccess = () => {
      if (window.scrollImagesAnimation) {
        window.scrollImagesAnimation.destroy();
        window.scrollImagesAnimation = null;
        console.log("\u2705 Initial scroll animation destroyed");
      }
      const initialScrollComponent = document.querySelector(
        ".scroll_images_component"
      );
      if (initialScrollComponent) {
        gsap.to(initialScrollComponent, {
          opacity: 0,
          duration: 0.5,
          onComplete: () => {
            initialScrollComponent.remove();
          }
        });
      }
      setTimeout(() => {
        const finalScrollComponent = document.querySelector(
          ".scroll_images_final"
        );
        if (finalScrollComponent) {
          const formContainer = document.querySelector(".form_container");
          if (formContainer) {
            formContainer.classList.add("is-diff");
          }
          gsap.to(finalScrollComponent, {
            opacity: 1,
            duration: 0.5
          });
          const finalScrollAnimation = initScrollImagesInfinite();
          const introAnimation = finalScrollAnimation.animateToTime(
            6,
            // Target time
            2
            // Duration: 2 seconds for smooth intro
          );
          introAnimation.then(() => {
            finalScrollAnimation.enableScroll();
          });
        }
      }, 600);
    };
  };

  // src/form.js
  var initForm = () => {
    initFormTypeSize();
    initFormCursor();
    initFormValidation();
    initFormSubmit();
  };

  // src/index.js
  window.scrollImagesAnimation = null;
  window.scrollImagesInfiniteAnimation = null;
  window.addEventListener("DOMContentLoaded", async () => {
    grainBg();
    window.scrollImagesAnimation = initScrollImages({
      headingAnimationProgress: [10, 20, 50, 70, 90],
      initialPreloadCount: 5,
      // Preload first 5 assets during loader
      fadeOutStart: 0.95
    });
    window.scrollImagesInfiniteAnimation = initScrollImagesInfinite();
    const loaderPromise = initLoader();
    const initialAssetsPromise = window.scrollImagesAnimation.preloadInitialAssets();
    await Promise.all([loaderPromise, initialAssetsPromise]);
    console.log("\u2713 Loader finished & first 5 assets ready");
    console.log("\u2713 Videos and remaining images already loading in background");
    const introAnimation = window.scrollImagesAnimation.animateToProgress(
      0.03,
      1.5
    );
    introAnimation.then(() => {
      window.scrollImagesAnimation.enableScroll();
      console.log("\u{1F680} Scroll enabled! User can now interact.");
    });
    console.log("\u{1F3AC} ScrollImages initialized and playing intro!");
    initForm();
  });
})();
