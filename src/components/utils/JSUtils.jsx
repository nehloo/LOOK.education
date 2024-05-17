/**
 * @package    look-education
 * @copyright  Copyright Nehloo Interactive LLC
 * @license    https://github.com/look-education/look-education/blob/master/LICENSE
 */

const JSUtils = {

  /*
  |--------------------------------------------------------------------------
  | SlugifyString
  |--------------------------------------------------------------------------
  |
  | Returns a slug for the input string
  |
  */
  SlugifyString: (string) => {
    const a = 'àáäâãåăæąçćčđďèéěėëêęğǵḧìíïîįłḿǹńňñòóöôœøṕŕřßşśšșťțùúüûǘůűūųẃẍÿýźžż·/_,:;'
    const b = 'aaaaaaaaacccddeeeeeeegghiiiiilmnnnnooooooprrsssssttuuuuuuuuuwxyyzzz------'
    const p = new RegExp(a.split('').join('|'), 'g')
    return string.toString().toLowerCase()
      .replace(/\s+/g, '-') // Replace spaces with -
      .replace(p, c => b.charAt(a.indexOf(c))) // Replace special characters
      .replace(/&/g, '-and-') // Replace & with 'and'
      .replace(/[^\w\-]+/g, '') // Remove all non-word characters
      .replace(/\-\-+/g, '-') // Replace multiple - with single -
      .replace(/^-+/, '') // Trim - from start of text
      .replace(/-+$/, '') // Trim - from end of text
  },

  /*
  |--------------------------------------------------------------------------
  | FormatTimestamp
  |--------------------------------------------------------------------------
  |
  | Returns a string with formatted seconds timestamp
  |
  */
  FormatTimestamp(seconds, milliseconds=false) {
    if (!milliseconds) {
      seconds--
    }
    if (seconds < 0) seconds = 0
    var minutes = Math.floor(seconds / 60)
    seconds = seconds % 60
    if (!milliseconds) {
      seconds = Math.ceil(seconds)
    }
    else {
      seconds = seconds.toFixed(3)
    }
    var hours = Math.floor(minutes / 60)
    minutes = Math.ceil(minutes % 60)
    var result = ''
    if (hours > 0) result = hours + ':'
    if (seconds == 60) {
      seconds = 0
      minutes++
    }
    if (minutes >= 0 || hours > 0) {
      if (minutes < 10 && hours > 0) minutes = '0' + minutes
      result = result + minutes + ':'
      if (seconds < 10) seconds = '0' + seconds
    }
    result = result + seconds
    return result
  }

}

export default JSUtils