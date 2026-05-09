import React from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import CollectibleModal from './collectible-modal';
import { useAccount } from '@/context/AccountContext';

export default function CollectibleDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const index = typeof params.index === 'string' ? Number(params.index) : undefined;
  const { collectibles, collectibleSvgs } = useAccount();

  return (
    <CollectibleModal
      visible={true}
      onClose={() => router.push('/collectible')}
      selectedIndex={typeof index === 'number' ? index : null}
      collectibles={collectibles}
      collectibleSvgs={collectibleSvgs}
    />
  );
}
