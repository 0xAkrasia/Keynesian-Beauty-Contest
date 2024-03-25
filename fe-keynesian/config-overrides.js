const webpack = require('webpack');

module.exports = function override(config, env) {
  // Ignore the source-map warnings from node_modules
  config.ignoreWarnings = [/Failed to parse source map/];

  // Add the IgnorePlugin configuration to ignore tfhe_bg.wasm
  config.plugins = [
    ...(config.plugins || []),
    new webpack.IgnorePlugin({
      resourceRegExp: /tfhe_bg\.wasm$/,
    }),
  ];

  return config;
};

