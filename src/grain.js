export const grainBg = () => {
  const options = {
    animate: true,
    patternWidth: 100,
    patternHeight: 100,
    grainOpacity: 0.05,
    grainDensity: 1,
    grainWidth: 1,
    grainHeight: 1,
  };

  grained("#grain", options);
};
