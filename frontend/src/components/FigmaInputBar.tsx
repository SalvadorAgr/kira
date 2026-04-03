import windowSvg from '../../../window (2).svg?raw';

const NODE_X = 18;
const NODE_Y = 601;
const NODE_WIDTH = 400;
const NODE_HEIGHT = 33;

export const FigmaInputBar = () => {
  const croppedSvg = windowSvg
    .replace(/width="500"/, `width="${NODE_WIDTH}"`)
    .replace(/height="650"/, `height="${NODE_HEIGHT}"`)
    .replace(/viewBox="0 0 500 650"/, `viewBox="${NODE_X} ${NODE_Y} ${NODE_WIDTH} ${NODE_HEIGHT}"`);

  return (
    <div
      className="relative block h-[33px] w-[400px] overflow-hidden no-drag"
      aria-label="Figma input bar"
      dangerouslySetInnerHTML={{ __html: croppedSvg }}
    />
  );
};
