import Ember from 'ember';
import layout from '../templates/get-text';

/**
 * A simple helper component to include dynamic parts - mostly link-to helper - within gettext message ids.
 *
 * ```html
 * {{#get-text message=(t "My translation with {{dynamicLink 'optional link text'}} and {{staticLink}}") as |text placeholder|}}
 *  {{!-- You can omit the if helper if you have only one dynamic part --}}
 *  {{~#if (eq placeholder 'myLink')}}
 *    {{~#link-to 'my-route'}}
 *      {{~text}} {{!-- will render 'optional link text' so that it's contained in PO file! --}}
 *    {{~/link-to~}}
 *  {{~/if~}}
 *  {{~#if (eq placeholder 'staticLink')}}
 *    <a href="http://www.google.com">Google</a>
 *  {{~/if~}}
 * {{/get-text}}
 * ```
 *
 * @namespace Component
 * @class GetText
 * @extends Ember.Component
 * @public
 */
export default Ember.Component.extend({

  layout,

  // -------------------------------------------------------------------------
  // Attributes

  /**
   * The message id string, which should use one of the gettext
   * translations method as subexpression when being passed in!
   *
   * @attribute message
   * @type {String}
   * @public
   */
  message: '',

  /**
   * Whether parsed strings should be escaped with three curly brackets
   * or not. This should be set to true if your message contains HTML.
   *
   * @attribute escapeText
   * @type {String}
   * @public
   */
  escapeText: false,

  // -------------------------------------------------------------------------
  // Properties

  /**
   * Collection of all message parts splitted
   * into normal text pieces and all
   * placeholders from message id.
   *
   * @property messageParts
   * @type {Array}
   * @public
   */
  messageParts: null, // lazy initialized!

  // -------------------------------------------------------------------------
  // Methods

  /**
   * Parses message id and splits it
   * up into corresponding parts.
   *
   * @method didReceiveAttrs
   * @return {Void}
   * @public
   */
  didReceiveAttrs() {
    this._super(...arguments);

    if (!this.attrs.hasOwnProperty('message')) {
      console.error('get-text.js: You need to provide a "message" attribute containing a gettext message!');
      return;
    }

    let { message } = this.attrs;
    if (Ember.typeOf(message) !== 'string') {
      try {
        message = message.toString();
      } catch (e) {
        console.error('get-text.js: "messag" must be either a string or an object implementing toString() method!');
        return;
      }
    }

    let parts = [];
    let pattern = /{{\s*(\w+)(?:\s*(?:'|")([\w\s]*)(?:'|"))?\s*}}/;

    let result;
    let text = message;
    while (result = pattern.exec(text)) {
      let split = text.split(result[0]);

      // 1) normal text
      parts.push({
        isPlaceholder: false,
        text: split[0]
      });

      // 2) placeholder
      parts.push({
        isPlaceholder: true,
        name: result[1],
        text: result[2]
      });

      // set remainder
      text = split[1];
    }

    // add last part if any
    if (!Ember.isEmpty(text)) {
      parts.push({
        isPlaceholder: false,
        text
      });
    }

    // provide parts for template
    this.set('messageParts', parts);
  }

});
