const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withFollyHeaderPaths = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.projectRoot, 'ios', 'Podfile');
      let podfileContent = fs.readFileSync(podfilePath, 'utf8');

      // Add the post_install hook
      const postInstallHook = `
post_install do |installer|
  installer.pods_project.targets.each do |target|
    if target.name == 'React-cxxreact'
      target.build_configurations.each do |config|
        config.build_settings['HEADER_SEARCH_PATHS'] ||= '$(inherited)'
        config.build_settings['HEADER_SEARCH_PATHS'] << '"$(PODS_ROOT)/boost"'
        config.build_settings['HEADER_SEARCH_PATHS'] << '"$(PODS_ROOT)/glog"'
        config.build_settings['HEADER_SEARCH_PATHS'] << '"$(PODS_ROOT)/Folly"'
      end
    end
  end
end
`;

      // Ensure the hook is not already added
      if (!podfileContent.includes("config.build_settings['HEADER_SEARCH_PATHS'] << '\"$(PODS_ROOT)/Folly\"'")) {
        podfileContent = podfileContent.replace(
          /post_install do \|installer\|/,
          `post_install do |installer|${postInstallHook.replace('post_install do |installer|', '')}`
        );
         if (!podfileContent.includes('post_install do |installer|')) {
            podfileContent += postInstallHook;
         }
      }

      fs.writeFileSync(podfilePath, podfileContent);
      return config;
    },
  ]);
};

module.exports = withFollyHeaderPaths;
