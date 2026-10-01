import { use } from 'echarts/core'
import { BarChart, HeatmapChart, LineChart, ScatterChart } from 'echarts/charts'
import {
    AriaComponent,
    DataZoomInsideComponent,
    DataZoomSliderComponent,
    GridComponent,
    LegendPlainComponent,
    MarkLineComponent,
    TooltipComponent,
    VisualMapContinuousComponent,
} from 'echarts/components'
import { SVGRenderer } from 'echarts/renderers'

use([
    BarChart,
    HeatmapChart,
    LineChart,
    ScatterChart,
    AriaComponent,
    DataZoomInsideComponent,
    DataZoomSliderComponent,
    GridComponent,
    LegendPlainComponent,
    MarkLineComponent,
    TooltipComponent,
    VisualMapContinuousComponent,
    SVGRenderer,
])

export { init as initEchart } from 'echarts/core'
