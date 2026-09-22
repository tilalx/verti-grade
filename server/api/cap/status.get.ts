import { eventHandler } from 'h3'
import { capSecret } from '../../utils/cap'

export default eventHandler(() => ({ enabled: !!capSecret() }))
