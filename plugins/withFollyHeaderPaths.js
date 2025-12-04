const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

// This is the Ruby code we want to inject into the post_install block
const codeToInject = `
  installer.pods_project.targets.each do |target|
    if target.name == 'React-cxxreact'
      target.build_configurations.each do |config|
        config.build_settings['HEADER_SEARCH_PATHS'] ||= ['$(inherited)']
        config.build_settings['HEADER_SEARCH_PATHS'] << '"$(PODS_ROOT)/boost"'
        config.build_settings['HEADER_SEARCH_PATHS'] << '"$(PODS_ROOT)/glog"'
        config.build_settings['HEADER_SEARCH_PATHS'] << '"$(PODS_ROOT)/Folly"'
      end
    end
  end
`;

const withFollyHeaderPaths = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.projectRoot, 'ios', 'Podfile');
      let podfileContent = fs.readFileSync(podfilePath, 'utf8');

      // A unique string to check if we've already injected the code
      const checkString = "config.build_settings['HEADER_SEARCH_PATHS'] << '\"$(PODS_ROOT)/Folly\"'";

      if (podfileContent.includes(checkString)) {
        // Already patched, no changes needed
        return config;
      }

      if (podfileContent.includes('post_install do |installer|')) {
        // If the block exists, inject our code after the first line.
        podfileContent = podfileContent.replace(
          'post_install do |installer|',
          `post_install do |installer|${codeToInject}`
        );
      } else {
        // If the block doesn't exist for some reason, add the whole thing.
        podfileContent += `\npost_install do |installer|${codeToInject}\nend\n`;
      }

      fs.writeFileSync(podfilePath, podfileContent);
      return config;
    },
  ]);
};

module.exports = withFollyHeaderPaths;
