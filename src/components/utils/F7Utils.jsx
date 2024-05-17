/**
 * @package    look-education
 * @copyright  Copyright Nehloo Interactive LLC
 * @license    https://github.com/look-education/look-education/blob/master/LICENSE
 */

const F7Utils = {

  SetDocumentTitle: (title) => {
    document.title = title ? (title + ' | LOOK.education') : 'LOOK.education';
    return true;
  },

  FocusPromptInput: (_this) => {
    try {
      _this.$$('.dialog-input').focus();
    } catch(e) {}
  },

  /*
  |--------------------------------------------------------------------------
  | IsLargeScreen
  |--------------------------------------------------------------------------
  |
  | Returns true if device is a desktop/laptop or large screen device
  |
  */
  IsLargeScreen: (app) => {
    return app.device.desktop;
  },

  GetChipIconTextFromTarget: (eventCurrentTarget) => {
    try {
      return eventCurrentTarget.firstChild.firstChild.textContent;
    } catch(e) {}
  },

  SetChipIconTextForTarget: (eventCurrentTarget, newIcon) => {
    try {
      eventCurrentTarget.firstChild.firstChild.textContent = newIcon;
    } catch(e) {}
  }

}

export default F7Utils