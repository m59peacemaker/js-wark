import path from 'path'
import resolve from '@rollup/plugin-node-resolve'
import del from 'rollup-plugin-delete'
import { terser } from 'rollup-plugin-terser'
import pkg from './package.json'

const extensions = [ '.js' ]

export default {
	input: 'src/index.js',
	output: [
		{
			format: 'esm',
			dir: path.dirname(pkg.module),
			preserveModules: true,
			sourcemap: false
		},
		{
			format: 'cjs',
			file: pkg.main,
			sourcemap: false
		},
		{
			name: pkg['umd:name'] || pkg.name,
			format: 'umd',
			file: pkg.unpkg,
			sourcemap: false,
			plugins: [
				terser()
			]
		}
	],
	external: [
		...Object.keys(pkg.dependencies || {}),
		...Object.keys(pkg.peerDependencies || {})
	],
	plugins: [
		del ({
			targets: [
				'dist/esm/*'
			]
		}),
		resolve({ extensions })
	]
}
