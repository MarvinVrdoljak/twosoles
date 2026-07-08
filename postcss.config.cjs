module.exports = {
  plugins: {
    'postcss-import': {},
    '@csstools/postcss-global-data': {
      files: ['./styles/base/media.css'],
    },
    'postcss-custom-media': {},
    'postcss-preset-env': {
      stage: 2,
      // Keep var() dynamic — the polyfill flattens custom properties to static
      // :root values, which breaks runtime theming via [data-theme].
      features: {'cascade-layers': false, 'custom-properties': false},
    },
    'postcss-pxtorem': {
      rootValue: 16,
      propList: ['*'],
      selectorBlackList: ['html', 'body'],
    },
  },
}
