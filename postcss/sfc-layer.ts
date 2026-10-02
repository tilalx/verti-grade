import type { PluginCreator } from 'postcss'

const LAYER_ORDER = 'theme, base, components, utilities'

const sfcLayer: PluginCreator<never> = () => ({
    postcssPlugin: 'sfc-layer',
    Once(root, { AtRule }) {
        if (!/\.vue(\?|$)/.test(root.source?.input.file ?? '')) return
        const layer = new AtRule({ name: 'layer', params: 'components' })
        layer.append(root.nodes)
        root.append(new AtRule({ name: 'layer', params: LAYER_ORDER }), layer)
    },
})
sfcLayer.postcss = true

export default sfcLayer
