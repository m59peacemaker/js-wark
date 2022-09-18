import rollup_config from './rollup.config.js'
import { builtinModules } from 'module'
import resolve from '@rollup/plugin-node-resolve'
import pkg from './package.json'

export default {
	...rollup_config,
	input: '-',
	output: {
		name: 'tests',
		format: 'esm',
		sourcemap: 'inline'
	},
	treeshake: false,
	external: [
		...builtinModules,
		...Object.keys(pkg.dependencies || {}),
		...Object.keys(pkg.devDependencies || {}),
		...Object.keys(pkg.peerDependencies || {})
	],
	plugins: [
		resolve()
	]
}
