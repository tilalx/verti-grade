import { createPocketBase } from '../../utils/pb-server'
import type { RouteScoreRecord } from '../../../types/models'

const OVERVIEW_FIELDS =
    'id,name,color,grade,grade_system,grade_index,anchor_point,type,location,wall,screw_date,average_rating,ratings_count'

export default defineCachedEventHandler(
    () =>
        createPocketBase()
            .collection('averageRating')
            .getFullList<RouteScoreRecord>({
                filter: 'archived = false',
                fields: OVERVIEW_FIELDS,
                requestKey: null,
            }),
    { name: 'public-overview', maxAge: 5, swr: true, getKey: () => 'all' },
)
