//import L10N from 'ember-l10n/services/l10n';

export function initialize(/*application*/) {

  // Configure L10N service options before instantiating
  /*
  L10N.reopen({
      // specify all your available languages generated with gettext.sh
      availableLocales: Ember.computed(function(){
        return {
            'en': this.t('en'),
        };
      }),
      jsonPath: '/custom/path/to/json/files', // provide different location of JSON files
      autoInitialize: false, // no auto detection, triggered only when calling setLocale() manually
      forceLocale: 'de', // skips language detection, only useful if `autoInitialize:true` (= default)
  });
  */

  // Inject the service into your desired object types
  /*
  application.inject('model', 'l10n', 'service:l10n');
  application.inject('route', 'l10n', 'service:l10n');
  application.inject('controller', 'l10n', 'service:l10n');
  application.inject('component', 'l10n', 'service:l10n');
  */
}

export default {
  name: '<%= name %>',
  initialize: initialize
};
