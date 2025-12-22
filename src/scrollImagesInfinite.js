const mod = (n, m) => ((n % m) + m) % m;

export const initScrollImagesInfinite = (config = {}) => {
  const defaultConfig = {
    componentSelector: ".scroll_images_final",
    scrollSensitivity: {
      wheel: 1000,
      touch: 200,
    },
  };

  const cfg = { ...defaultConfig, ...config };

  let incr = 0;
  let zIndex = 0;
  let newIndex = 0;
  const settings = { delta: 0 };
  let isScrollEnabled = false;

  const scrollImagesComponent = document.querySelector(cfg.componentSelector);

  if (!scrollImagesComponent) {
    return;
  }

  const realImages = scrollImagesComponent.querySelectorAll(
    ".scroll_images_wrapper .scroll_image"
  );

  if (!realImages.length) {
    return;
  }

  const medias = [];
  scrollImagesComponent
    .querySelectorAll(".scroll_images_media img")
    .forEach((img) => {
      medias.push(img.getAttribute("src"));
    });

  if (!medias.length) {
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
    },
  });

  const tl = gsap.timeline({
    paused: true,
  });

  tl.to(realImages, {
    scale: 2.005,
    ease: "expo.inOut",
    duration: 8,
    stagger: {
      each: 1,
      repeat: -1,
      onRepeat() {
        const el = this.targets()[0];
        const movingForward = settings.delta >= 0;

        zIndex += movingForward ? 1 : -1;

        el.style.zIndex = movingForward
          ? zIndex
          : zIndex - (realImages.length - 1);

        const referenceEl = movingForward
          ? el.previousElementSibling || realImages[realImages.length - 1]
          : el.nextElementSibling || realImages[0];

        newIndex = mod(
          parseInt(referenceEl.getAttribute("data-index")) +
            (movingForward ? 1 : -1),
          medias.length
        );

        el.setAttribute("data-index", newIndex);
        el.setAttribute("src", medias[newIndex]);
      },
    },
  }).time(incr);

  Observer.create({
    target: window,
    type: "wheel,touch",
    onChange: (e) => {
      if (!isScrollEnabled) return;

      const isTouchEvent = e.event.type === "touchmove";
      const divider = isTouchEvent ? 300 : 1000;

      const delta = isTouchEvent ? -e.deltaY : e.deltaY;
      deltaTo(delta / divider);
    },
    onStop: () => {
      if (!isScrollEnabled) return;
      deltaTo(0);
    },
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
