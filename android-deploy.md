`eas build --platform android --local`
`eas build --platform android --profile production --local`
`keytool -list -v -keystore credentials/tailtrails.jks -alias tailtrails-alias`
`adb logcat`
`adb logcat | grep -i "FATAL"`

PROCESS:
`npx expo prebuild --clean`
`cd android && ./gradlew assembleRelease` for APK
- found in `/android/app/build/outputs/apk/release/app-release.apk`
`cd android && ./gradlew bundleRelease`  for AAB
- found in `/android/app/build/outputs/bundle/release/app-release.aab`