/* eslint-disable @typescript-eslint/no-unused-vars */
// Mac[Safari]: Apple GPU
// Mac[Firefox]1: Intel(R) HD Graphics 400
// Mac[Firefox]2: Intel 945GM
// Mac[WebKit]1: ANGLE (Intel Inc., Intel(R) UHD Graphics 630, OpenGL 4.1)
// Mac[WebKit]2: ANGLE (Intel Inc., Intel Iris OpenGL Engine, OpenGL 4.1)
// Win11[Mozilla]: ANGLE (Unknown, Microsoft Basic Renderer Driver Direct3D11 vs_5_0 ps_5_0)
// Win11[WebKit]: ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)
// Win10-RX570[WebKit]: ANGLE (AMD, Radeon RX 570 Series Direct3D11 vs_5_0 ps_5_0, D3D11)
// Win10-RX570[Firefox]: ANGLE (AMD, Radeon R9 200 Series Direct3D11 vs_5_0 ps_5_0)

type RenderingContext = WebGLRenderingContext | WebGL2RenderingContext

export const NOT_AVAILABLE = 'N\\A'

const ANGLE = 'ANGLE'
const DIRECT_VERSION = 'Direct'
const OPENGL_VERSION = 'Open'

export function getGPU(): string {  
	const canvas = document.createElement('canvas')
	let webgl

	try {
		webgl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as RenderingContext
	}
	catch (e) {
		console.log(e)
		return NOT_AVAILABLE
	}

	if (webgl === null || webgl === undefined) {
		console.error('WebGL is not available in this browser')
		return NOT_AVAILABLE
	}

	const debugInfo = webgl?.getExtension('WEBGL_debug_renderer_info')

	if (debugInfo === null || debugInfo === undefined) {
		console.error('WebGL debug information is not available in this browser')
		return NOT_AVAILABLE
	}

	// Unsafe for Firefox (deprecated)
	const renderer = webgl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
	const vendor = webgl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)

	console.log(renderer)
	console.log(vendor)

	let gpu = parseGpu(renderer)
	if (vendor && !vendor.toLowerCase().includes('google') && !gpu.toLowerCase().includes(vendor.toLowerCase())) {
		gpu = `${vendor.toUpperCaseFirst()} ${gpu}`
	}

	return gpu
}

export function parseGpu(renderer: string): string {

	// unwrap Angle renderer
	if (renderer.startsWith(ANGLE)) {
		renderer = renderer.slice(ANGLE.length + 2, renderer.length - 1)
	}

	renderer = removeGfxApi(renderer, DIRECT_VERSION)
	renderer = removeGfxApi(renderer, OPENGL_VERSION)
	renderer = renderer.replace('(TM)', '') // (TM)
	renderer = renderer.replace(/\(0x([0-9A-Fa-f]){8}\)/, _ => '') // device id

	if (renderer[renderer.length - 1] === ',') {
		renderer = renderer.slice(0, renderer.length - 1)
	}

	const renderers = renderer.split(',')
	if (renderers.length > 1 && renderers[1].includes(renderers[0].trim())) {
		renderer = renderers[1].trim()
	}

	return renderer
}

function removeGfxApi(renderer: string, gfxApi: string): string {
	if (renderer.includes(gfxApi)) {
		renderer = renderer.slice(0, renderer.indexOf(gfxApi))
	}

	return renderer.trimEnd()
}