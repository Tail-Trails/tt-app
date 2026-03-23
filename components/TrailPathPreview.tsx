import React, { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Polyline, Rect } from 'react-native-svg';
import { Coordinate } from '@/types/trail';

interface TrailPathPreviewProps {
  coordinates?: Coordinate[];
  path?: number[][] | null;
  size?: number; // fallback size
  strokeColor?: string;
  strokeWidth?: number;
  backgroundColor?: string;
  style?: any;
}

export default function TrailPathPreview({ coordinates, path, size = 80, strokeColor = '#fff', strokeWidth = 2, backgroundColor = 'rgba(0,0,0,0.06)', style }: TrailPathPreviewProps) {
  const pts = useMemo(() => {
    if (Array.isArray(coordinates) && coordinates.length > 0) {
      return coordinates.map(c => [c.longitude, c.latitude]);
    }
    if (Array.isArray(path) && path.length > 0) {
      return path.map(p => [p[0], p[1]]);
    }
    return [] as number[][];
  }, [coordinates, path]);

  const { pointsAttr, vbW, vbH, pad } = useMemo(() => {
    if (!pts || pts.length === 0) return { pointsAttr: '', vbW: 100, vbH: 100, pad: 8 };

    const lons = pts.map(p => p[0]);
    const lats = pts.map(p => p[1]);
    const minX = Math.min(...lons);
    const maxX = Math.max(...lons);
    const minY = Math.min(...lats);
    const maxY = Math.max(...lats);

    const dx = maxX - minX || 1;
    const dy = maxY - minY || 1;

    const vbW = 100;
    const vbH = 100;
    const pad = 8;
    const innerW = vbW - pad * 2;
    const innerH = vbH - pad * 2;

    const mapped = pts.map(([x, y]) => {
      const mx = ((x - minX) / dx) * innerW + pad;
      const my = ((maxY - y) / dy) * innerH + pad; // invert y
      return `${mx},${my}`;
    });

    return { pointsAttr: mapped.join(' '), vbW, vbH, pad };
  }, [pts]);

  // TODO: don't want to have the gradient have a rounded bottom right edge

  const containerStyle = style ? style : { width: size, height: size };

  return (
    <View style={containerStyle} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox={`0 0 ${vbW} ${vbH}`}>
        <Rect x={0} y={0} width={vbW} height={vbH} rx={10} ry={10} fill={backgroundColor} />
        {pointsAttr ? (
          <Polyline
            points={pointsAttr}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}
      </Svg>
    </View>
  );
}
