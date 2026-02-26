import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

type Props = {
  size?: number;
  color?: string;
};

export default function DogMarker({ size = 20, color = '#5d6b4a' }: Props) {
  const s = size;
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 8c0-1.1.9-2 2-2 1.1 0 2 .9 2 2v1"
        stroke={color}
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4 15c0-3 2.5-6 6-6h3c3.5 0 6 3 6 6v1a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-1z"
        fill={color}
      />
      <Circle cx="8.5" cy="11.5" r="1" fill="#fff" />
      <Circle cx="15.5" cy="11.5" r="1" fill="#fff" />
    </Svg>
  );
}
