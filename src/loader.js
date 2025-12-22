export const initLoader = (assetsReadyPromise) => {
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

  return new Promise(async (resolve) => {
    const loaderTl = gsap.timeline({
      delay: 0.5,
    });

    const loaderStep1 = gsap.timeline();

    loaderStep1
      .to(numsWrapper, {
        x: loaderWrapper.scrollWidth / 5,
        duration: 0.7,
        ease: "circ.out",
      })
      .to(
        numsTrack1,
        {
          width: "auto",
        },
        0
      )
      .to(
        [track1Numbers[0], track2Numbers[0]],
        {
          y: "0%",
          opacity: 1,
          filter: "blur(0px)",
          duration: 0.75,
          ease: "circ.out",
          stagger: 0.1,
        },
        "<25%"
      )
      .to(
        track2Zero,
        {
          y: "-100%",
          opacity: 0,
          filter: "blur(4px)",
          duration: 0.5,
          ease: "circ.out",
        },
        "<0%"
      );

    const loaderStep2 = gsap.timeline();

    loaderStep2
      .to(numsWrapper, {
        x: loaderWrapper.scrollWidth / 1.75,
        duration: 1.4,
        ease: "circ.out",
      })
      .to(
        [track1Numbers[0], track2Numbers[0]],
        {
          y: "-100%",
          opacity: 0,
          filter: "blur(4px)",
          duration: 0.5,
          ease: "circ.out",
          stagger: 0.1,
        },
        "<0%"
      )
      .to(
        [track1Numbers[1], track2Numbers[1]],
        {
          y: "0%",
          opacity: 1,
          filter: "blur(0px)",
          duration: 0.75,
          ease: "circ.out",
          stagger: 0.1,
        },
        "<0%"
      );

    const loaderStep3 = gsap.timeline();

    loaderStep3
      .to(numsWrapper, {
        x: () => loaderWrapper.scrollWidth - numsWrapper.scrollWidth,
        duration: 0.8,
        ease: "circ.out",
      })
      .to(
        [track1Numbers[1], track2Numbers[1]],
        {
          y: "-100%",
          opacity: 0,
          filter: "blur(4px)",
          duration: 0.5,
          ease: "circ.out",
          stagger: 0.1,
        },
        "<0%"
      )
      .to(
        [track1Numbers[2], track2Numbers[2]],
        {
          y: "0%",
          opacity: 1,
          filter: "blur(0px)",
          duration: 0.75,
          ease: "circ.out",
          stagger: 0.1,
        },
        "<25%"
      );

    loaderTl.add(loaderStep1).add(loaderStep2, ">.5").add(loaderStep3, ">.5");

    // Wait for loader animation to reach 99%, then wait for assets
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
