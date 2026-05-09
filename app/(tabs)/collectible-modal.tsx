import React from 'react';
import { View, Modal, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components';
import Medal3D from '@/components/Medal3D';
import { Image } from 'expo-image';
import { ArrowLeft } from 'lucide-react-native';
import styles from './collectible.styles';
import { theme } from '@/constants/colors';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

type CollectibleItem = {
    name: string;
    description?: string;
    preview_url?: string;
    image_url?: string;
};

type Props = {
    visible: boolean;
    onClose: () => void;
    selectedIndex: number | null;
    collectibles: CollectibleItem[];
    collectibleSvgs: (string | null)[];
};

export default function CollectibleModal({ visible, onClose, selectedIndex, collectibles, collectibleSvgs }: Props) {
    if (!visible) return null;

    const item = selectedIndex !== null ? collectibles[selectedIndex] : null;
    const candidate = item?.image_url || (selectedIndex !== null ? collectibleSvgs[selectedIndex] : null);

    const isModel = (u: string | null | undefined) => !!u && /\.(gltf?|glb)(?:$|\?|#)/i.test(u);
    const modelUrl = isModel(candidate) ? String(candidate) : null;

    //   console.log("CollectibleModal - item:", item);
    console.log("CollectibleModal - candidate:", candidate);

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
            <GestureHandlerRootView style={{ flex: 1 }}>
                <SafeAreaView style={{ flex: 1, backgroundColor: '#000', paddingTop: 24 }}>
                    <View style={{ padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <TouchableOpacity style={styles.backButton} onPress={onClose}>
                            <ArrowLeft size={20} color={theme.accentPrimary} />
                        </TouchableOpacity>
                        <View />
                    </View>

                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        {modelUrl ? (
                            <View style={{ width: '100%', height: '80%', justifyContent: 'center', alignItems: 'center' }}>
                                <Medal3D fileUrl={modelUrl} />
                                <View style={{ marginTop: 18, paddingHorizontal: 20 }}>
                                    <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', textAlign: 'center' }}>{item?.name}</Text>
                                    {item?.description ? (
                                        <Text style={{ color: '#ddd', textAlign: 'center', marginTop: 8 }}>{item.description}</Text>
                                    ) : null}
                                </View>
                            </View>
                        ) : candidate ? (
                            // Not a model URL — render image preview instead
                            <View style={{ width: '100%', height: '80%', justifyContent: 'center', alignItems: 'center' }}>
                                <Image
                                    source={{ uri: String(candidate) }}
                                    style={{ width: '80%', height: '60%', borderRadius: 12 }}
                                    contentFit="cover"
                                    cachePolicy="memory-disk"
                                />
                                <View style={{ marginTop: 18, paddingHorizontal: 20 }}>
                                    <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', textAlign: 'center' }}>{item?.name}</Text>
                                    {item?.description ? (
                                        <Text style={{ color: '#ddd', textAlign: 'center', marginTop: 8 }}>{item.description}</Text>
                                    ) : null}
                                </View>
                            </View>
                        ) : (
                            <View />
                        )}
                    </View>
                </SafeAreaView>
            </GestureHandlerRootView>
        </Modal>
    );
}