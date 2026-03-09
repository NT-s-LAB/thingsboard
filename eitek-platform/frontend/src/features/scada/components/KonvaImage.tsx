'use client';

import React from 'react';
import { Image as KImage, Rect, Text, Group } from 'react-konva';
import useImage from 'use-image';

interface KonvaImageProps {
  src: string;
  x?: number;
  y?: number;
  width: number;
  height: number;
}

/**
 * Konva Image wrapper using use-image hook (the standard react-konva approach).
 * Shows loading placeholder or error indicator while the image is being fetched.
 */
export const KonvaImage: React.FC<KonvaImageProps> = ({ src, x = 0, y = 0, width, height }) => {
  const [image, status] = useImage(src);

  if (status === 'failed') {
    return (
      <Group x={x} y={y}>
        <Rect width={width} height={height} fill="#FEE2E2" stroke="#EF4444" strokeWidth={1} cornerRadius={4} />
        <Text text="⚠ Image" width={width} height={height} align="center" verticalAlign="middle" fontSize={10} fill="#EF4444" />
      </Group>
    );
  }

  if (status === 'loading' || !image) {
    return (
      <Group x={x} y={y}>
        <Rect width={width} height={height} fill="#F3F4F6" stroke="#D1D5DB" strokeWidth={1} dash={[4, 4]} cornerRadius={4} />
        <Text text="Loading..." width={width} height={height} align="center" verticalAlign="middle" fontSize={10} fill="#9CA3AF" />
      </Group>
    );
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  return <KImage {...{ image, x, y, width, height } as any} />;
};
