/* eslint-disable no-param-reassign */

const {
  locationScore, TooLargeError,
} = require('./location')

const { getColor, colorScore } = require('./utils')

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
    ask: 'のメーカーはどこですか？',
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
  // route
}

exports.searchLostLocationAnswer = async (conv, params) => {
  const { location } = params
  try {
    const score = await locationScore({ lat: '35.0296014', lng: '135.780722' }, location)
    conv.add(`あなたのスコアは${score}です。`)
    route(conv, TYPES.color)
  } catch (e) {
    if (e instanceof TooLargeError) {
      conv.contexts.set('search_lost-location', 1)
      conv.ask('地域が大きすぎます。')
      return
    }
    throw e
  }
}
