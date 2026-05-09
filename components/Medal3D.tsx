import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import {
    FilamentScene,
    FilamentView,
    Model,
    Camera,
    DefaultLight,
    useCameraManipulator,
} from 'react-native-filament';

function MedalInner({ fileUrl }: { fileUrl: string }) {
    // 1. Setup the manipulator with a clear home position
    const cameraManipulator = useCameraManipulator({
        orbitHomePosition: [0, 0, 4], // 4 units back on Z axis
        targetPosition: [0, 0, 0],    // Looking at the center
    });

    const modelSource = useMemo(() => ({ uri: fileUrl }), [fileUrl]);

    if (!cameraManipulator) return null;

    return (
        <FilamentView
            style={styles.flex}
            // In Reanimated 4 / Filament 1.9, the view needs the manipulator 
            // reference to pipe raw touch events to the C++ engine.
            // @ts-ignore
            manipulator={cameraManipulator}
        >
            <DefaultLight />
            <Model
                source={modelSource as any}
                transformToUnitCube
                // Rotation prop is removed to prevent state overrides
            />
            <Camera
                // The Camera must also know about the manipulator to update its matrix
                // @ts-ignore
                manipulator={cameraManipulator}
                zoom={1.2}
            />
        </FilamentView>
    );
}

export default function Medal3D({ fileUrl, width = 240, height = 440 }: any) {
    return (
        <View 
          style={{ width, height, backgroundColor: 'transparent' }} 
          // 'auto' ensures this specific container captures touches
          pointerEvents="auto"
        >
            <FilamentScene>
                <MedalInner fileUrl={fileUrl} />
            </FilamentScene>
        </View>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1 },
});