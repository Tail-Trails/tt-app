BUILD instructions for tt-app
===========================

This document explains how to build Android and iOS binaries locally (without EAS) and how to upload artifacts to GitHub Releases. It also includes notes for Expo-managed projects (prebuild/eject), signing, and example CI snippets for automating Android builds.

Prerequisites
-------------
- Node.js and npm/yarn
- Git
- For Android builds: Java JDK (11 or above), Android SDK, Android Studio (recommended)
- For iOS builds: macOS with Xcode installed (required to produce .ipa for devices)
- If using Expo-managed workflow: `expo-cli`/`npx expo` available (for `expo prebuild`)

If your project is Expo-managed (no `android/` or `ios/` folders), run:

```bash
# generate native projects (only do this if you plan to maintain native builds locally)
npx expo prebuild
```

Android (local build)
----------------------

1. Generate or locate your keystore

If you don't already have a signing keystore, create one (keep it secret):

```bash
keytool -genkeypair -v \
	-keystore keystore.jks \
	-alias tailtrailskey \
	-keyalg RSA \
	-keysize 2048 \
	-validity 10000
```

Place the keystore in a safe directory (for local builds a common place is `android/keystores/keystore.jks`).

2. Configure Gradle signing

Create a `key.properties` file (do NOT commit it to git):

```
storePassword=YOUR_STORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=myappkey
storeFile=android/keystores/keystore.jks
```

3. Build the APK or AAB

From the project root:

```bash
cd android
# APK (easy for sideloading):
./gradlew assembleRelease
# AAB (upload to Google Play):
./gradlew bundleRelease
```

Output paths:
- APK: `android/app/build/outputs/apk/release/app-release.apk`
- AAB: `android/app/build/outputs/bundle/release/app-release.aab`

4. Install or test the APK

Install on a device with `adb`:

```bash
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

Note: Android may block installs from "unknown sources" — testers should enable it.

5. Upload to GitHub Releases (manual)

- Create a Release in your GitHub repo and attach the APK/AAB file.

Or use the GitHub CLI (`gh`) to upload:

```bash
git tag v0.1.0
git push origin v0.1.0
gh release create v0.1.0 ./android/app/build/outputs/apk/release/app-release.apk \
	--title "Preview v0.1.0" --notes "Android preview APK"
```

Android CI (GitHub Actions) snippet
-----------------------------------

Minimal example to build an APK on tag pushes. You must store keystore as a base64-encoded secret (`KEYSTORE_BASE64`) and keystore passwords as `KEYSTORE_PASSWORD` and `KEY_PASSWORD`, and `KEY_ALIAS`.

```yaml
name: Android Build

on:
	push:
		tags:
			- 'v*.*.*'

jobs:
	build:
		runs-on: ubuntu-latest
		steps:
			- uses: actions/checkout@v4
			- name: Set up JDK
				uses: actions/setup-java@v4
				with:
					java-version: '17'
			- name: Restore keystore
				run: |
					echo "$KEYSTORE_BASE64" | base64 -d > android/keystores/keystore.jks
					mkdir -p android
					echo "storePassword=$KEYSTORE_PASSWORD
keyPassword=$KEY_PASSWORD
keyAlias=$KEY_ALIAS
storeFile=android/keystores/keystore.jks" > android/key.properties
				env:
					KEYSTORE_BASE64: ${{ secrets.KEYSTORE_BASE64 }}
					KEYSTORE_PASSWORD: ${{ secrets.KEYSTORE_PASSWORD }}
					KEY_PASSWORD: ${{ secrets.KEY_PASSWORD }}
					KEY_ALIAS: ${{ secrets.KEY_ALIAS }}
			- name: Build release APK
				run: |
					cd android
					./gradlew assembleRelease
			- name: Create GitHub Release and upload APK
				uses: softprops/action-gh-release@v1
				with:
					files: android/app/build/outputs/apk/release/app-release.apk
				env:
					GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

Note: customize paths and gradle tasks if your project differs.

iOS (local build)
------------------

Important: iOS builds require macOS with Xcode. For distribution to real devices, you’ll need an Apple Developer account and provisioning profiles.

1. Prebuild (Expo-managed)

If your project is Expo-managed:

```bash
npx expo prebuild
```

2. Open Xcode and set signing

- Open `ios/YourApp.xcworkspace` in Xcode.
- Select the project target, select your Apple Team, and configure a provisioning profile or let Xcode manage signing.

3. Archive and export (GUI)

- In Xcode: Product -> Archive. Once archived, click Distribute App and choose the desired distribution method (App Store / Ad Hoc / Enterprise / Development).

4. Archive and export (command-line)

Replace `YourApp` and paths with your project’s values.

```bash
cd ios
xcodebuild -workspace YourApp.xcworkspace \
	-scheme YourApp -configuration Release \
	-archivePath ./build/YourApp.xcarchive archive

# export (requires exportOptions.plist describing method)
xcodebuild -exportArchive \
	-archivePath ./build/YourApp.xcarchive \
	-exportOptionsPlist ./exportOptions.plist \
	-exportPath ./build
```

The `./build` directory will contain an `.ipa` or `.app` depending on export options.

Export options example (`exportOptions.plist`) for ad-hoc:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>method</key>
	<string>ad-hoc</string>
	<key>signingStyle</key>
	<string>manual</string>
	<key>provisioningProfiles</key>
	<dict>
		<key>com.yourcompany.yourapp</key>
		<string>Your AdHoc Provisioning Profile Name</string>
	</dict>
</dict>
</plist>
```

5. Distribute iOS builds

- TestFlight (recommended): upload the archive to App Store Connect and invite testers via TestFlight.
- Ad-hoc: collect tester UDIDs, include them in your provisioning profile, sign the ipa and distribute (e.g., upload to a Release). This scales poorly.
- Simulator builds: you can export a `.app` for Simulator (no provisioning) for Mac users only.

Notes and caveats
-----------------
- Keep signing keys, keystores, export options, and passwords out of git. Use environment variables or CI secrets.
- Building iOS for distribution requires an Apple Developer account.
- If you don't want to maintain native projects and CI, EAS Build is a simpler alternative — it manages build infrastructure and credentials for you.

Web build (optional)
--------------------

If your app supports web you can build a static web bundle and host it on GitHub Pages or attach it to a Release.

```bash
npm run build
# or with Expo classic
expo build:web
```

Zip the output (usually `web-build/` or `build/`) and upload it to a Release or serve it via GitHub Pages.

Help and next steps
-------------------
If you want, I can:

- Add a ready-to-use `eas.json` (if you decide to use EAS later).
- Add a GitHub Action workflow for Android builds and Release uploads (requires storing keystore as a secret).
- Add a local `scripts/` helper to generate `key.properties` and run the Gradle commands.

Marking this task complete in the project TODO list once you've confirmed these instructions meet your needs.
