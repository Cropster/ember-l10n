export function initialize(application) {
  // Inject the service into your desired object types
  application.inject('model', 'l10n', 'service:l10n');
  application.inject('route', 'l10n', 'service:l10n');
  application.inject('controller', 'l10n', 'service:l10n');
  application.inject('component', 'l10n', 'service:l10n');

}

export default {
  name: '<%= name %>',
  initialize: initialize
};
