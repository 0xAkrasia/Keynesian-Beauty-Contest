module.exports = function override(config, env) {
   // Ignore the source-map warnings from node_modules
   config.ignoreWarnings = [/Failed to parse source map/];

   return config;
 };
