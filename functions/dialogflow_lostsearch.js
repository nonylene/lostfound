/* eslint-disable no-param-reassign */

const {
  locationScore, TooLargeError,
} = require('./location')

exports.searchLostLocation = async (conv, params) => {
  const { location } = params
  try {
    const score = await locationScore({ lat: '35.0296014', lng: '135.780722' }, location)
    conv.ask(`あなたのスコアは${score}です。`)
  } catch (e) {
    if (e instanceof TooLargeError) {
      conv.contexts.set('search_lost-location', 1)
      conv.ask('地域が大きすぎます。')
      return
    }
    throw e
  }
}
