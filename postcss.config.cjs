module.exports = {
  plugins: {
    'postcss-import': {},
    '@csstools/postcss-global-data': {
      files: ['./styles/base/media.css'],
    },
    'postcss-custom-media': {},
    'postcss-preset-env': {stage: 2, features: {'cascade-layers': false}},
    'postcss-pxtorem': {
      rootValue: 16,
      propList: ['*'],
      selectorBlackList: ['html', 'body'],
    },
  },
}
