/* eslint-disable no-param-reassign */

const {
  locationScore, TooLargeError,
} = require('./location')

const { getColor, colorScore, dateScore } = require('./utils')

const TYPES = {
  color: {
    ask: '携帯電話の色は何ですか？',
    context: 'search_lost-color',
  },
  date: {
    ask: '拾ったのは何日ですか？',
    context: 'search_lost-date',
  },
  maker: {
    ask: '携帯のメーカーはどこですか？',
    context: 'search_lost-maker',
  },
  cover: {
    ask: 'カバーはついていますか？',
    context: 'search_lost-cover',
  },
}


const route = (conv, type) => {
  conv.contexts.set(type.context, 1)
  conv.ask(type.ask)
}

exports.searchLostCoverAnswer = (conv, params) => {
  const { date, datePeriod } = params
  const day = 24 * 60 * 60 * 1000
  let startDate
  let endDate
  if (!datePeriod) {
    const d = new Date(date)
    startDate = new Date(d - 1.5 * day) // 前日一日
    endDate = new Date(d + 1.5 * day) // 当日 + 次の日
  } else {
    startDate = new Date(datePeriod.startDate)
    endDate = new Date(datePeriod.endDate)
  }

  if (endDate - startDate > 7 * day) {
    conv.contexts.set(TYPES.date.context)
    conv.ask('期間が長すぎます')
    return
  }

  if (startDate > Date.now()) {
    // 未来になっている場合は自動で1年戻す
    startDate.setFullYear(startDate.getFullYear() - 1)
    endDate.setFullYear(endDate.getFullYear() - 1)
  }

  const score = dateScore(new Date('2019/06/24'), startDate, endDate)
  conv.add(`あなたのスコアは${score}です。`)
  // route
}

const searchLostCoverAnswer = (conv, cover) => {
  const score = Number(cover === true)
  conv.add(`あなたのスコアは${score}です。`)
  // route
}

exports.searchLostCoverAnswerYes = conv => searchLostCoverAnswer(conv, true)
exports.searchLostCoverAnswerNo = conv => searchLostCoverAnswer(conv, false)


exports.searchLostDateAnswer = (conv, params) => {
  const { date, datePeriod } = params
  const day = 24 * 60 * 60 * 1000
  let startDate
  let endDate
  if (!datePeriod) {
    const d = new Date(date)
    startDate = new Date(d - 1.5 * day) // 前日一日
    endDate = new Date(d + 1.5 * day) // 当日 + 次の日
  } else {
    startDate = new Date(datePeriod.startDate)
    endDate = new Date(datePeriod.endDate)
  }

  if (endDate - startDate > 7 * day) {
    conv.contexts.set(TYPES.date.context)
    conv.ask('期間が長すぎます')
    return
  }

  if (startDate > Date.now()) {
    // 未来になっている場合は自動で1年戻す
    startDate.setFullYear(startDate.getFullYear() - 1)
    endDate.setFullYear(endDate.getFullYear() - 1)
  }

  const score = dateScore(new Date('2019/06/24'), startDate, endDate)
  conv.add(`あなたのスコアは${score}です。`)
  // route
}

exports.searchLostColorAnswer = (conv, params) => {
  const { color } = params
  const colorRGB = getColor(color)
  if (!colorRGB) {
    conv.contexts.set(TYPES.color.context)
    conv.ask('色が認識できませんでした。')
    return
  }
  const score = colorScore(colorRGB, { r: 255, g: 0, b: 0 })
  conv.add(`あなたのスコアは${score}です。`)
  // TODO: route
}

exports.searchLostLocationAnswer = async (conv, params) => {
  route(conv, TYPES.cover)
  return
  const { location } = params
  try {
    const score = await locationScore({ lat: '35.0296014', lng: '135.780722' }, location)
    conv.add(`あなたのスコアは${score}です。`)
    // route(conv, TYPES.date)
  } catch (e) {
    if (e instanceof TooLargeError) {
      conv.contexts.set('search_lost-location', 1)
      conv.ask('地域が大きすぎます。')
    }
    throw e
  }
}
