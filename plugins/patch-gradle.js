const { withAppBuildGradle } = require('@expo/config-plugins');

module.exports = (config) => {
  return withAppBuildGradle(config, (config) => {
    const buildGradle = config.modResults.contents;
    
    const signingLogic = `
/**
 * Injected by patch-gradle plugin
 * Safely creates or retrieves the release signing config.
 */
androidComponents {
    finalizeDsl { extension ->
        def keystorePropertiesFile = rootProject.file('../credentials/keystore.properties')
        def keystoreProperties = new Properties()

        if (keystorePropertiesFile.exists()) {
            keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
            
            // Safely find or create the 'release' signing config
            def releaseConfig = extension.signingConfigs.findByName("release")
            if (releaseConfig == null) {
                releaseConfig = extension.signingConfigs.create("release")
            }

            releaseConfig.storeFile = rootProject.file(keystoreProperties['storeFile'])
            releaseConfig.storePassword = keystoreProperties['storePassword']
            releaseConfig.keyAlias = keystoreProperties['keyAlias']
            releaseConfig.keyPassword = keystoreProperties['keyPassword']
            
            // Assign it to the release build type
            def releaseBuildType = extension.buildTypes.findByName("release")
            if (releaseBuildType != null) {
                releaseBuildType.signingConfig = releaseConfig
                println "SUCCESS: Production keystore settings finalized."
            }
        } else {
            println "WARNING: Keystore properties not found at \${keystorePropertiesFile.absolutePath}"
        }
    }
}
`;

    if (!buildGradle.includes('androidComponents {')) {
        config.modResults.contents = buildGradle + signingLogic;
    }
    return config;
  });
};