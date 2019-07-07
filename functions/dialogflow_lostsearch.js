/* eslint-disable no-param-reassign */

const {
  TooLargeError, getLocation, convertViewPort,
} = require('./location')

const { getColor } = require('./utils')

const { getHeuristicFiltered, getNextSearchColumn, phoneInfo } = require('./phones')

const TYPES = {
  color: {
    // gradation
    ask: '携帯電話の色は何ですか？',
    context: 'search_lost-color',
  },
  date: {
    // gradation
    ask: '拾ったのは何日ですか？',
    context: 'search_lost-date',
  },
  maker: {
    // 01
    ask: '携帯のメーカーはどこですか？',
    context: 'search_lost-maker',
  },
  cover: {
    // 01
    ask: 'カバーはついていますか？',
    context: 'search_lost-cover',
  },
  type: {
    // 01
    ask: 'スマートフォンですか？フィーチャーフォンですか？',
    context: 'search_lost-type',
  },
}

const sayLast = (conv, filtered) => {
  const foo = filtered.map((phone, i) => `${i + 1}個目は${phoneInfo(conv, phone)}`).join()
  conv.ask(`${filtered.length}件マッチしました。${foo}`)
}

const route = (conv, type) => {
  conv.contexts.set(type.context, 1)
  conv.ask(type.ask)
}

const routeColumn = (conv) => {
  const filtered = getHeuristicFiltered(conv)
  if (filtered.length < 3) {
    sayLast(conv, filtered)
    return
  }

  const nextColumn = getNextSearchColumn(conv, filtered)
  if (nextColumn) {
    route(conv, TYPES[nextColumn])
  } else {
    sayLast(conv, filtered)
  }
}

const searchLostCoverAnswer = (conv, cover) => {
  conv.data.cover = cover
  routeColumn(conv)
}

exports.searchLostCoverAnswerYes = conv => searchLostCoverAnswer(conv, true)
exports.searchLostCoverAnswerNo = conv => searchLostCoverAnswer(conv, false)

exports.searchLostTypeAnswer = (conv, params) => {
  const { phone } = params
  if (phone !== 'スマートフォン' && phone !== 'ケータイ') {
    conv.contexts.set(TYPES.type.context, 1)
    conv.ask('スマートフォンかケータイで答えてください。')
    return
  }
  conv.data.type = phone
  routeColumn(conv)
}

exports.searchLostMakerAnswer = (conv, params) => {
  const { maker } = params
  conv.data.maker = maker
  routeColumn(conv)
}

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
    conv.contexts.set(TYPES.date.context, 1)
    conv.ask('期間が長すぎます')
    return
  }

  if (startDate > Date.now()) {
    // 未来になっている場合は自動で1年戻す
    startDate.setFullYear(startDate.getFullYear() - 1)
    endDate.setFullYear(endDate.getFullYear() - 1)
  }

  conv.data.date = { startDate, endDate }
  route(conv, TYPES.color)
}

exports.searchLostColorAnswer = (conv, params) => {
  const { color } = params
  const colorRGB = getColor(color)
  if (!colorRGB) {
    conv.contexts.set(TYPES.color.context, 1)
    conv.ask('色が認識できませんでした。')
    return
  }
  conv.data.color = colorRGB
  routeColumn(conv)
}

exports.searchLostLocationAnswer = async (conv, params) => {
  const query = params.location
  conv.data.remainingCollumns = ['maker', 'cover', 'type']
  try {
    const loc = await getLocation(query)
    if (!loc) {
      conv.contexts.set('search_lost-location', 1)
      conv.ask('場所が見つかりませんでした。')
      return
    }
    const { location, viewport } = loc
    const viewportLens = convertViewPort(viewport)
    conv.data.location = { location, viewportLens }
    route(conv, TYPES.date)
  } catch (e) {
    if (e instanceof TooLargeError) {
      conv.contexts.set('search_lost-location', 1)
      conv.ask('地域が大きすぎます。')
      return
    }
    throw e
  }
}
