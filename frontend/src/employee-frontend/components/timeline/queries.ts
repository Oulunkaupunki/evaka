import FiniteDateRange from 'lib-common/finite-date-range'
import { query } from 'lib-common/query'
import { UUID } from 'lib-common/types'

import { createQueryKeys } from '../../query'

import { getTimeline } from './api'

const queryKeys = createQueryKeys('timeline', {
  byAdult: (personId: UUID) => [personId]
})

export const timelineQuery = query({
  api: (arg: { personId: UUID; range: FiniteDateRange }) =>
    getTimeline(arg.personId, arg.range),
  queryKey: (arg) => queryKeys.byAdult(arg.personId)
})
