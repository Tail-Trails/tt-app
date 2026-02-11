const fs = require('fs');
const path = require('path');
const { withDangerousMod } = require('@expo/config-plugins');

/**
 * Expo config plugin to patch the generated iOS Podfile so that
 * @react-native-firebase pods can build without non-modular header errors.
 * This runs during `expo prebuild` and re-applies the workaround each time.
 */
function applyPatchToPodfile(podfilePath) {
  if (!fs.existsSync(podfilePath)) return false;
  let podfile = fs.readFileSync(podfilePath, 'utf8');

  if (podfile.includes('CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES')) {
    // Already patched
    return true;
  }

  const insert = [
    "    # Expo plugin: RNFB non-modular headers workaround (minimal)",
    "    installer.pods_project.targets.each do |target|",
    "      target.build_configurations.each do |config|",
    "        # Allow non-modular includes to avoid header import failures",
    "        config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] ||= 'YES'",
    "      end",
    "    end",
    ''
  ].join('\n');

  const seq = '\n  end\nend\n';
  let newPodfile;
  if (podfile.includes(seq)) {
    newPodfile = podfile.replace(seq, `\n${insert}${seq}`);
  } else {
    // Fallback: append at end
    newPodfile = podfile + '\n' + insert;
  }

  fs.writeFileSync(podfilePath, newPodfile, 'utf8');
  return true;
}

module.exports = function withPatchPodfile(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const podfilePath = path.join(projectRoot, 'ios', 'Podfile');
      try {
        applyPatchToPodfile(podfilePath);
      } catch (e) {
        // Do not fail prebuild; log error
        console.warn('patch-podfile plugin: failed to patch Podfile', e);
      }
      return config;
    },
  ]);
};

module.exports.default = module.exports;
