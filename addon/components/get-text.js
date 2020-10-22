import { isEmpty } from '@ember/utils';
import Component from '@glimmer/component';

/**
 * A simple helper component to include dynamic parts - mostly link-to helper - within gettext message ids.
 *
 * ```html
 * <GetText @message={{t "My translation with {{dynamicLink 'optional link text'}} and {{staticLink}}"}} as |text placeholder|>
 *  {{!-- You can omit the if helper if you have only one dynamic part --}}
 *  {{~#if (eq placeholder 'myLink')}}
 *    {{~#link-to 'my-route'}}
 *      {{~text}} {{!-- will render 'optional link text' so that it's contained in PO file! --}}
 *    {{~/link-to~}}
 *  {{~/if~}}
 *  {{~#if (eq placeholder 'staticLink')}}
 *    <a href="http://www.google.com">Google</a>
 *  {{~/if~}}
 * </GetText>
 * ```
 *
 * @namespace Component
 * @class GetText
 * @extends Ember.Component
 * @public
 */
export default class GetTextComponent extends Component {
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
  message;

  /**
   * Whether parsed strings should be unescaped with three curly brackets
   * or not. This should be set to true if your message contains any HTML.
   * Be sure to use this option only in combination with safe strings and
   * don't make use of it when dealing with user generated inputs (XSS)!
   *
   * @attribute unescapeText
   * @type {String}
   * @default: false
   * @public
   */
  unescapeText;

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
  get messageParts() {
    let { message } = this.args;

    if (!message) {
      // eslint-disable-next-line no-console
      console.error(
        '<GetText>: You have to provide a @message containing a gettext message!'
      );
      return [];
    }

    if (typeof message !== 'string') {
      try {
        message = message.toString();
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(
          '<GetText>: @message must be either a string or an object implementing toString() method!'
        );
        return [];
      }
    }

    let parts = [];
    let regex = /{{\s*(\w+)(?:\s*(?:'|")([^'"]*)(?:'|"))?\s*}}/;

    let result;
    let text = message;
    while ((result = regex.exec(text))) {
      let split = text.split(result[0]);

      // 1) normal text
      parts.push({
        isPlaceholder: false,
        text: split[0],
      });

      // 2) placeholder
      parts.push({
        isPlaceholder: true,
        name: result[1],
        text: result[2],
      });

      // set remainder
      text = split[1];
    }

    // add last part if any
    if (!isEmpty(text)) {
      parts.push({
        isPlaceholder: false,
        text,
      });
    }

    return parts;
  }
}
