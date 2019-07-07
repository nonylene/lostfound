
const {
  locationScore,
} = require('./location')

const { colorScore, dateScore } = require('./utils')

const PHONES = require('./data/phones.json')

const HEURISTIC_SCORE_THRESHOLD = 2

const applyFilterIfPresent = (conv, phone) => {
  if (conv.data.maker) {
    if (phone.maker !== conv.data.maker) return false
  }
  if (conv.data.cover) {
    if (phone.cover !== conv.data.cover) return false
  }
  if (conv.data.type) {
    if (phone.type !== conv.data.type) return false
  }
  return true
}

exports.phoneInfo = (conv, phone) => {
  const { location, viewportLens } = conv.data.location
  const { startDate, endDate } = conv.data.date
  const colorRGB = conv.data.color
  const locScore = locationScore(phone.location, location, viewportLens)
  const dtScore = dateScore(new Date(phone.date), startDate, endDate)
  const clScore = colorScore(phone.color, colorRGB)
  const bads = []
  if (locScore < 0.6) {
    bads.push('落とした場所')
  }
  if (dtScore < 0.6) {
    bads.push('落とした日時')
  }
  if (clScore < 0.4) {
    bads.push('色')
  }
  if (bads.length > 0) {
    return `${phone.police}にあります。この拾得物は、${bads.join('と')}の一致度が低いです。`
  }
  return `${phone.police}にあります。`
}

exports.getHeuristicFiltered = (conv) => {
  const { location, viewportLens } = conv.data.location
  const { startDate, endDate } = conv.data.date
  const colorRGB = conv.data.color

  return PHONES.filter((phone) => {
    const locScore = locationScore(phone.location, location, viewportLens)
    const dtScore = dateScore(new Date(phone.date), startDate, endDate)
    const clScore = colorScore(phone.color, colorRGB)
    return locScore + dtScore + clScore > HEURISTIC_SCORE_THRESHOLD && applyFilterIfPresent(conv, phone)
  })
}

exports.getNextSearchColumn = (conv, filtered) => {
  const remainings = conv.data.remainingCollumns

  if (remainings.length === 0) {
    return null
  }

  const countTable = {}
  remainings.forEach((remaining) => {
    countTable[remaining] = {}
  })

  filtered.forEach((phone) => {
    remainings.forEach((remaining) => {
      const current = countTable[remaining][phone[remaining]]
      countTable[remaining][phone[remaining]] = current ? current + 1 : 1
    })
  })

  const [nextKey] = Object.entries(countTable).map(([k, v]) => {
    const countSum = Object.values(v).reduce((sum, x) => sum + x)
    const entropySum = Object.values(v).map(_v => -_v / countSum * Math.log10(_v / countSum))
      .reduce((sum, x) => sum + x)
    return [k, entropySum]
  }).reduce(([k1, v1], [k2, v2]) => (v1 > v2 ? [k1, v1] : [k2, v2]))

  // eslint-disable-next-line no-param-reassign
  conv.data.remainingCollumns = remainings.filter(x => x !== nextKey)

  return nextKey
}
