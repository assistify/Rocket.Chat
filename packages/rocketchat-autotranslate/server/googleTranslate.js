/* globals RocketChat */
/**
 * @author Vigneshwaran Odayappan <vickyokrm@gmail.com>
 */
import {AutoTranslate, TranslationProviderRegistry} from './autotranslate';
import _ from 'underscore';

/**
 * Represents google translate class
 * @class
 * @augments AutoTranslate
 */
class GoogleAutoTranslate extends AutoTranslate {
	/**
	 * setup api reference to Google translate to be used as message translation provider.
	 * @constructor
	 */
	constructor() {
		super();
		this.name = 'google-translate';
		this.apiEndPointUrl = 'https://translation.googleapis.com/language/translate/v2';
		// register & de-register itself - afterSaveMessage based on the activeProvider
		RocketChat.settings.get('AutoTranslate_ServiceProvider', (key, value) => {
			if (this.name !== value) {
				this._unRegisterAfterSaveMsgCallBack(this.name);
			} else {
				this._registerAfterSaveMsgCallBack(this.name);
			}
		});
	}

	/**
	 * Returns metadata information about the service provider
	 * @private implements super abstract method.
	 * @returns {object}
	 */
	_getProviderMetadata() {
		return {
			name: this.name,
			displayName: TAPi18n.__('AutoTranslate_Google'),
			settings: this._getSettings()
		};
	}

	/**
	 * Returns necessary settings information about the translation service provider.
	 * @private implements super abstract method.
	 * @returns {object}
	 */
	_getSettings() {
		return {
			apiKey: this.apiKey,
			apiEndPointUrl: this.apiEndPointUrl
		};
	}

	/**
	 * Returns supported languages for translation by the active service provider.
	 * Google Translate api provides the list of supported languages.
	 * @private implements super abstract method.
	 * @param {string} target : user language setting or 'en'
	 * @returns {object} code : value pair
	 */
	_getSupportedLanguages(target) {
		if (this.autoTranslateEnabled && this.apiKey) {
			if (this.supportedLanguages[target]) {
				return this.supportedLanguages[target];
			}
			let result;
			const params = {key: this.apiKey};
			if (target) {
				params.target = target;
			}

			try {
				result = HTTP.get('https://translation.googleapis.com/language/translate/v2/languages', {params});
			} catch (e) {
				if (e.response && e.response.statusCode === 400 && e.response.data && e.response.data.error && e.response.data.error.status === 'INVALID_ARGUMENT') {
					params.target = 'en';
					target = 'en';
					if (!this.supportedLanguages[target]) {
						result = HTTP.get('https://translation.googleapis.com/language/translate/v2/languages', {params});
					}
				}
			} finally {
				if (this.supportedLanguages[target]) {
					return this.supportedLanguages[target];
				} else {
					this.supportedLanguages[target || 'en'] = result && result.data && result.data.data && result.data.data.languages;
					return this.supportedLanguages[target || 'en'];
				}
			}
		}
	}

	/**
	 * Send Request REST API call to the service provider.
	 * Returns translated message for each target language in target languages.
	 * @private
	 * @param {object} targetMessage
	 * @param {object} targetLanguages
	 * @returns {object} translations: Translated messages for each language
	 */
	_sendRequestTranslateMessage(targetMessage, targetLanguages) {
		const translations = {};
		let msgs = targetMessage.msg.split('\n');
		msgs = msgs.map(msg => encodeURIComponent(msg));
		const query = `q=${ msgs.join('&q=') }`;
		const supportedLanguages = this._getSupportedLanguages('en');
		targetLanguages.forEach(language => {
			if (language.indexOf('-') !== -1 && !_.findWhere(supportedLanguages, {language})) {
				language = language.substr(0, 2);
			}
			try {
				const result = HTTP.get(this.apiEndPointUrl, {
					params: {
						key: this.apiKey,
						target: language
					}, query
				});
				if (result.statusCode === 200 && result.data && result.data.data && result.data.data.translations && Array.isArray(result.data.data.translations) && result.data.data.translations.length > 0) {
					const txt = result.data.data.translations.map(translation => translation.translatedText).join('\n');
					translations[language] = this.deTokenize(Object.assign({}, targetMessage, {msg: txt}));
				}
			} catch (e) {
				console.log('Error translating message', e);
			}
		});
		return translations;
	}

	/**
	 * Returns translated message attachment description in target languages.
	 * @private
	 * @param {object} attachment
	 * @param {object} targetLanguages
	 * @returns {object} translated messages for each target language
	 */
	_sendRequestTranslateMessageAttachments(attachment, targetLanguages) {
		const translations = {};
		const query = `q=${ encodeURIComponent(attachment.description || attachment.text) }`;
		const supportedLanguages = this._getSupportedLanguages('en');
		targetLanguages.forEach(language => {
			if (language.indexOf('-') !== -1 && !_.findWhere(supportedLanguages, {language})) {
				language = language.substr(0, 2);
			}
			try {
				const result = HTTP.get(this.apiEndPointUrl, {
					params: {
						key: this.apiKey,
						target: language
					}, query
				});
				if (result.statusCode === 200 && result.data && result.data.data && result.data.data.translations && Array.isArray(result.data.data.translations) && result.data.data.translations.length > 0) {
					translations[language] = result.data.data.translations.map(translation => translation.translatedText).join('\n');
				}
			} catch (e) {
				console.log('Error translating message', e);
			}

		});
		return translations;
	}
}

Meteor.startup(() => {
	TranslationProviderRegistry.registerProvider(new GoogleAutoTranslate());
	RocketChat.AutoTranslate = TranslationProviderRegistry.getActiveServiceProvider();
});
