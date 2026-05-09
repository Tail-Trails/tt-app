import React, { useCallback, useMemo, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import {
    FilamentScene,
    FilamentView,
    Model,
    Camera,
    DefaultLight,
    useFilamentContext,
    useModel,
    Light,
} from 'react-native-filament';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

function MedalInner({ fileUrl }: { fileUrl: string }) {
    // 1. Load the model using the hook to get access to the rootEntity
    const model = useModel({ uri: fileUrl });
    const { transformManager } = useFilamentContext();

    const rootEntity = model.state === "loaded" ? model.rootEntity : undefined;

    // Apply a slight initial lean-back so the medal faces the camera slightly tilted.
    useEffect(() => {
        if (rootEntity != null && transformManager != null) {
            // Rotate around X axis by ~-0.4 radians (~-23 degrees) to lean back slightly.
            transformManager.setEntityRotation(rootEntity, -0.4, [1, 0, 0], true);
        }
    }, [rootEntity, transformManager]);

    // 2. Manual Rotation Logic via TransformManager
    const panGesture = useMemo(() =>
        Gesture.Pan()
            .onUpdate((event) => {
                'worklet';
                if (rootEntity != null && transformManager != null) {
                    // Sensitivity constant
                    const sensitivity = 0.005;

                    // Rotate around Y axis based on horizontal drag (translationX)
                    transformManager.setEntityRotation(
                        rootEntity,
                        event.velocityX * sensitivity * -0.01, // Use velocity for smoother flick or translationX for direct link
                        [0, 1, 0],
                        true // 'true' multiplies with current transform (incremental)
                    );

                    // Rotate around X axis based on vertical drag (translationY)
                    transformManager.setEntityRotation(
                        rootEntity,
                        event.velocityY * sensitivity * 0.01,
                        [1, 0, 0],
                        true
                    );
                }
            }),
        [rootEntity, transformManager]
    );

    const renderCallback = useCallback(() => {
        'worklet';
        // You can still add a tiny auto-spin here if you want!
        if (rootEntity != null && transformManager != null) {
            transformManager.setEntityRotation(rootEntity, 0.005, [0, 1, 0], true);
        }
    }, [rootEntity, transformManager]);

    return (
        <GestureDetector gesture={panGesture}>
            <View style={styles.flex}>
                <FilamentView
                    style={styles.flex}
                    renderCallback={renderCallback}
                >
                    <Light
                        type="directional"
                        colorKelvin={5500} // Neutral white light
                        intensity={200000} // Increase this number until it looks right (standard sun is ~100,000)
                        direction={[0, -1, -1]} // Coming from top-front
                    />
                    {/* <DefaultLight /> */}
                    {/* BE AWARE: we don't need to render the model here because it's handled by the useModel hook */}
                    {/* Note: We use the model.state check to ensure we don't render nothing */}
                    {/* {model.state === 'loaded' && (
                        <Model
                            source={{ uri: fileUrl } as any}
                            transformToUnitCube
                        />
                    )} */}
                    <Camera {...({ initialPosition: [0, 0, 4] } as any)} />
                </FilamentView>
            </View>
        </GestureDetector>
    );
}

export default function Medal3D({ fileUrl, width = 340, height = 440 }: any) {
    return (
        <View style={{ width, height }} pointerEvents="auto">
            <FilamentScene>
                <MedalInner fileUrl={fileUrl} />
            </FilamentScene>
        </View>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1 },
});