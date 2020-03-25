const nodeResolve = require('@rollup/plugin-node-resolve')
const commonjs = require('@rollup/plugin-commonjs')

module.exports = {
	input: '-',
	output: {
		name: 'test',
		format: 'iife',
		sourcemap: 'inline'
	},
	treeshake: false,
	plugins: [ nodeResolve({ browser: true }), commonjs() ]
}
