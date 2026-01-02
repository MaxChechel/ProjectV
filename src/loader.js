export const initLoader = (assetsReadyPromise) => {
  const loaderWrapper = document.querySelector(".loader_wrapper");
  const numsWrapper = document.querySelector(".loader_nums_wrap");
  const loaderNumber = document.querySelector(".loader_num"); // Single number element

  return new Promise(async (resolve) => {
    const loaderTl = gsap.timeline({
      delay: 0.5,
    });

    // Step 1: Animate to 23
    const loaderStep1 = gsap.timeline();
    loaderStep1
      .to(loaderNumber, {
        opacity: 0,
        duration: 0.5,
        ease: "power2.inOut",
        onComplete: () => {
          loaderNumber.textContent = "23";
          // Move wrapper instantly while number is invisible
          gsap.set(numsWrapper, { x: loaderWrapper.scrollWidth / 8 });
        },
      })
      .to(
        loaderNumber,
        {
          opacity: 1,
          duration: 0.6,
          ease: "power2.inOut",
        },
        ">"
      );

    // Step 2: Animate to 59
    const loaderStep2 = gsap.timeline();
    loaderStep2
      .to(loaderNumber, {
        opacity: 0,
        duration: 0.5,
        ease: "power2.inOut",
        onComplete: () => {
          loaderNumber.textContent = "59";
          // Move wrapper instantly while number is invisible
          gsap.set(numsWrapper, { x: loaderWrapper.scrollWidth / 3 });
        },
      })
      .to(
        loaderNumber,
        {
          opacity: 1,
          duration: 0.6,
          ease: "power2.inOut",
        },
        ">"
      );

    // Step 3: Animate to 83
    const loaderStep3 = gsap.timeline();
    loaderStep3
      .to(loaderNumber, {
        opacity: 0,
        duration: 0.5,
        ease: "power2.inOut",
        onComplete: () => {
          loaderNumber.textContent = "83";
          // Move wrapper instantly while number is invisible
          gsap.set(numsWrapper, { x: loaderWrapper.scrollWidth / 2 });
        },
      })
      .to(
        loaderNumber,
        {
          opacity: 1,
          duration: 0.6,
          ease: "power2.inOut",
        },
        ">"
      );

    // Step 4: Animate to 97
    const loaderStep4 = gsap.timeline();
    loaderStep4
      .to(loaderNumber, {
        opacity: 0,
        duration: 0.5,
        ease: "power2.inOut",
        onComplete: () => {
          loaderNumber.textContent = "97";
          // Move wrapper instantly while number is invisible
          gsap.set(numsWrapper, {
            x: loaderWrapper.scrollWidth - numsWrapper.scrollWidth,
          });
        },
      })
      .to(
        loaderNumber,
        {
          opacity: 1,
          duration: 0.6,
          ease: "power2.inOut",
        },
        ">"
      );

    loaderTl
      .add(loaderStep1)
      .add(loaderStep2, ">.3")
      .add(loaderStep3, ">.3")
      .add(loaderStep4, ">.3");

    // Wait for loader animation to reach 97%, then wait for assets
    await loaderTl.then();

    // Now wait for assets to be ready before fading out
    if (assetsReadyPromise) {
      await assetsReadyPromise;
    }

    // Finally fade out the loader
    await gsap.to(loaderWrapper, {
      opacity: 0,
      duration: 0.6,
    });

    resolve();
  });
};
