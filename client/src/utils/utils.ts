export function getFittedSize(
  containerWidth: number,
  containerHeight: number,
  aspectRatio: number
): [number, number] {
  let height = containerHeight;
  let width = height * aspectRatio;

  if (width > containerWidth) {
    width = containerWidth;
    height = width / aspectRatio;
  }

  return [width, height];
}
