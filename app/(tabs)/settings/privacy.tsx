import React from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { Text } from '@/components';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import privacyStyles from './privacy.styles';
import { ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import theme from '@/constants/colors';

export default function PrivacyScreen() {
	const insets = useSafeAreaInsets();
	const router = useRouter();

	return (
		<View style={[privacyStyles.container, { paddingTop: insets.top + 16, paddingLeft: 16, paddingRight: 16 }]}> 
			<View style={privacyStyles.header}>
				<TouchableOpacity style={privacyStyles.backButton} onPress={() => router.push('/settings')}>
					<ArrowLeft size={20} color={theme.accentPrimary} />
				</TouchableOpacity>
				<View style={{ width: 40 }} />
			</View>
			<ScrollView contentContainerStyle={privacyStyles.content}>
				<Text style={privacyStyles.title}>Tail Trails: Privacy & Data Policy</Text>
				<Text style={privacyStyles.updated}>Last updated: March 2026</Text>

				<Text style={privacyStyles.paragraph}>
					Your privacy matters to us. This policy explains what personal data Tail Trails collects, how we use it, and your rights under the General Data Protection Regulation (GDPR).
				</Text>

				<Text style={privacyStyles.heading}>Who we are</Text>
				<Text style={privacyStyles.paragraph}>
					Tail Trails is operated by Nicholas Madge, acting as data controller. For any privacy-related questions or requests, contact us at {" "}
					<Text style={privacyStyles.link}>contact@tailtrails.club</Text>.
				</Text>

				<Text style={privacyStyles.heading}>What data we collect</Text>
				<Text style={privacyStyles.paragraph}>
					We collect the following personal data when you use Tail Trails:
				</Text>
				<View style={privacyStyles.list}>
					<Text style={privacyStyles.listItem}>• Name and email address (account creation)</Text>
					<Text style={privacyStyles.listItem}>• Location and GPS data (trail discovery and recommendations)</Text>
					<Text style={privacyStyles.listItem}>• Dog profile information, including breed, age, and health or behavioural needs</Text>
					<Text style={privacyStyles.listItem}>• Photos and other content you choose to upload</Text>
				</View>

				<Text style={privacyStyles.heading}>Why we collect it and our legal basis</Text>
				<View style={privacyStyles.list}>
					<Text style={privacyStyles.listItem}>• We process your name, email, location, dog profile, and uploaded content because it is necessary to deliver the Tail Trails service to you (contractual necessity, Article 6(1)(b) GDPR).</Text>
					<Text style={privacyStyles.listItem}>• We use anonymised analytics data via Google Firebase to understand how the app is used and improve it. This is processed only with your consent (consent, Article 6(1)(a) GDPR), which you can withdraw at any time in the app settings.</Text>
				</View>

				<Text style={privacyStyles.heading}>Third parties</Text>
				<Text style={privacyStyles.paragraph}>We use Google Firebase solely for anonymised app analytics. We do not sell, rent, or share your personal data with any other third parties.</Text>

				<Text style={privacyStyles.heading}>Where your data is stored</Text>
				<Text style={privacyStyles.paragraph}>All data is stored and processed within the European Union. We do not transfer your personal data outside the EU/EEA.</Text>

				<Text style={privacyStyles.heading}>How long we keep your data</Text>
				<Text style={privacyStyles.paragraph}>We retain your personal data for as long as your account is active. If you delete your account, your data will be permanently removed within 30 days.</Text>

				<Text style={privacyStyles.heading}>Your rights</Text>
				<Text style={privacyStyles.paragraph}>As a user in the EU, you have the right to:</Text>
				<View style={privacyStyles.list}>
					<Text style={privacyStyles.listItem}>• Access the personal data we hold about you</Text>
					<Text style={privacyStyles.listItem}>• Delete your data ("right to be forgotten")</Text>
					<Text style={privacyStyles.listItem}>• Portability — receive a copy of your data in a portable format</Text>
					<Text style={privacyStyles.listItem}>• Withdraw consent for analytics processing at any time</Text>
				</View>

				<Text style={privacyStyles.paragraph}>To exercise any of these rights, contact us at {" "}<Text style={privacyStyles.link}>contact@tailtrails.club</Text>. We will respond within 30 days.</Text>

				<Text style={privacyStyles.heading}>Changes to this policy</Text>
				<Text style={privacyStyles.paragraph}>We may update this policy from time to time. We will notify you of any significant changes via the app or by email.</Text>
			</ScrollView>
		</View>
	);
}

