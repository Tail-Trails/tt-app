
import React from 'react';
import { Text, View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

import { Stack } from 'expo-router';
import TrailMap from '@/components/TrailMap';

import { Clock, MapPin, Navigation, ArrowLeft, TrendingUp } from 'lucide-react-native';
import colors from '@/constants/colors';

import { formatDistance, formatDuration } from '@/utils/distance';
import { useRouter } from 'expo-router';

const DEMO_TRAIL = {
  id: 'demo-trail',
  name: 'Scenic Coastal Walk',
  distance: 5210,
  duration: 3600,
  
  coordinates: [
    { latitude: 50.81999932593175, longitude: -0.1443926504884132 },
    { latitude: 50.81982005377856, longitude: -0.14389605957015306 },
    { latitude: 50.8195735534442, longitude: -0.14290287773496857 },
    { latitude: 50.81976403108945, longitude: -0.14245949298612004 },
    { latitude: 50.819651985510006, longitude: -0.1415904588798469 },
    { latitude: 50.819360665744455, longitude: -0.141129338740825 },
    { latitude: 50.81955114425804, longitude: -0.14054407087405707 },
    { latitude: 50.8194278935438, longitude: -0.1397814491065219 },
    { latitude: 50.819282233189426, longitude: -0.1389301503892284 },
    { latitude: 50.819696803774036, longitude: -0.13903656272921694 },
    { latitude: 50.81999932593175, longitude: -0.13919618123853184 },
    { latitude: 50.82010016621547, longitude: -0.13853997181101363 },
    { latitude: 50.82041389015009, longitude: -0.138220734792327 },
    { latitude: 50.82055954697452, longitude: -0.13852223642078343 },
    { latitude: 50.82086206354296, longitude: -0.13829167635185513 },
  ],
  city: 'Brighton',
  country: 'UK',
  difficulty: 'Easy',
  pace: '11:32',
  maxElevation: 45,
};

export default function DemoTrailScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Demo Trail',
          headerShown: false,
        }} 
      />
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.title}>{DEMO_TRAIL.name}</Text>
            <View style={styles.locationRow}>
              <MapPin size={16} color="#fff" />
              <Text style={styles.locationText}>{DEMO_TRAIL.city}, {DEMO_TRAIL.country}</Text>
            </View>
          </View>
        </View>

        <View style={styles.mapContainer}>
          <TrailMap
            coordinates={DEMO_TRAIL.coordinates}
            style={styles.map}
            scrollEnabled={true}
            zoomEnabled={true}
          />
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Navigation size={20} color={colors.primary} />
            <Text style={styles.statValue}>{formatDistance(DEMO_TRAIL.distance)}</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>
          <View style={styles.statItem}>
            <Clock size={20} color={colors.primary} />
            <Text style={styles.statValue}>{formatDuration(DEMO_TRAIL.duration)}</Text>
            <Text style={styles.statLabel}>Time</Text>
          </View>
          <View style={styles.statItem}>
            <TrendingUp size={20} color={colors.primary} />
            <Text style={styles.statValue}>{DEMO_TRAIL.maxElevation}m</Text>
            <Text style={styles.statLabel}>Elevation</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About this trail</Text>
          <Text style={styles.description}>
            This is a beautiful coastal walk along the Brighton seafront. 
            Perfect for a morning stroll with your dog. The path is paved and 
            offers stunning views of the English Channel.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    height: 200,
    backgroundColor: colors.primary,
    justifyContent: 'flex-end',
    padding: 20,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
  },
  headerContent: {
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    color: '#fff',
    marginLeft: 5,
    fontSize: 16,
  },
  mapContainer: {
    height: 300,
    width: '100%',
  },
  map: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
  backgroundColor: colors.surface,
  borderBottomWidth: 1,
  borderBottomColor: colors.border,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 5,
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666',
  },
});
