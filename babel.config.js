module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 'current'
        }
      }
    ],
    '@babel/preset-typescript'
  ],
  plugins: [
    [
      'module-resolver',
      {
        alias: {
          '@middlewares': './src/middlewares',
          '@models': './src/models',
          '@providers': './src/providers',
          '@services': './src/services',
          '@useCases': './src/useCases',
          '@workers': './src/workers',
          '@config': './src/config',
          '@db': './src/db'
        }
      }
    ]
  ],
  ignore: ['**/*.spec.ts']
};
