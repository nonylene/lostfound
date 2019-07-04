const { DateTime } = require('luxon')
const colors = require('./data/colors.json')

exports.convertE164 = localNumber => `+81${localNumber.substr(1)}`
exports.unconvertE164 = globalNumber => `0${globalNumber.substr(3)}`

exports.denyGuest = (conv) => {
  if (conv.user.verification !== 'VERIFIED') {
    // XXX
    conv.close('ゲストには対応していません。')
    return true
  }
  return false
}

exports.colorScore = (one, two) => {
  // eslint-disable-next-line no-mixed-operators
  const distance = Math.sqrt((one.r - two.r) ** 2 + (one.g - two.g) ** 2 + (one.b - two.b) ** 2)
  const max = 255 * Math.sqrt(3)
  return Math.max(1 - distance / (max / 2), 0)
}

exports.getColor = (name) => {
  if (name in colors) {
    return colors[name]
  }
  const altName = `${name}色`
  if (altName in colors) {
    return colors[altName]
  }
  return null
}

exports.dateToJapanese = date => DateTime.fromJSDate(date).setZone('Asia/Tokyo').toFormat('yyyy年M月d日H時m分')

exports.dateScore = (target, start, end) => {
  const len = end - start
  if (target > end) {
    return Math.max(1 - (target - end) / len, 0)
  }
  if (target < start) {
    return Math.max(1 - (start - target) / len, 0)
  }

  return 1
}
