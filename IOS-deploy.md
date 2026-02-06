# Steps to deploy to Apple App Store

- `npx expo prebuild --platform ios`
- `open ios/TailTrails.xcworkspace`

### Set Signing:
- In the left sidebar, click the blue TailTrails project icon.
- Go to Signing & Capabilities.
- Ensure "Automatically manage signing" is checked and select your Team.
- Tip: If you haven't created an app record yet, go to App Store Connect and create a "New App" with the same bundleIdentifier you used in your app.json.

###Clean previous builds
- `xcodebuild clean -workspace ios/TailTrails.xcworkspace -scheme TailTrails`
```
# Create the Archive
xcodebuild archive \
  -workspace ios/TailTrails.xcworkspace \
  -scheme TailTrails \
  -configuration Release \
  -archivePath ios/build/TailTrails.xcarchive \
  -allowProvisioningUpdates
```
or click `Product > Archive` in Xcode.


### Upload to TestFlight
Once the archive is created, you have two ways to send it to Apple:

- Option A: The "Visual" Way (Recommended for first time)
  - In Xcode, go to Window > Organizer.
  - You will see your new archive. Click Distribute App.
  - Choose App Store Connect -> Upload.
  - Follow the prompts. Xcode will validate your app and upload it.