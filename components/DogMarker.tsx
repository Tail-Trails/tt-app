import React from 'react';
import { Image } from 'expo-image';

const initialSvg = require('../assets/images/map-icon.svg');

type Props = {
  size?: number;
  color?: string;
};

export default function DogMarker({ size = 20 }: Props) {
  const s = size;
  return (
    <Image source={initialSvg} style={{ width: s, height: s }} contentFit="contain" />
  );
}
