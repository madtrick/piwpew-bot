const path = require('path')

module.exports = {
  defaultSeverity: 'error',
  extends: [
    'tslint-config-standard',
    'tslint-no-unused-expression-chai'
  ],
  linterOptions: {
    exclude: [
      'bin/**/*',
      'built/**/*'
    ]
  },
  rulesDirectory: [
    path.join(path.dirname(require.resolve('tslint-eslint-rules')), 'dist/rules'),
    path.join(path.dirname(require.resolve('tslint-microsoft-contrib')), './')
  ],
  rules: {
    'mocha-avoid-only': true,
    'typedef': [true, 'call-signature', 'parameter', 'member-variable-declaration'],
    'no-consecutive-blank-lines': [true, 2],
    'brace-style': [
      true,
      '1tbs'
    ],
    'curly': [
      true
    ],
    'array-bracket-spacing': [
      true,
      'never'
    ]
  }
}


