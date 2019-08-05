export default class TypescriptTestClass {
  l10n = L10n;

  greet(message: string) {
    return this.l10n.t('test content {{message}}', { message });
  }
}

const L10n = {
  t(message: string, placeholder: object) {
    return message;
  }
};
