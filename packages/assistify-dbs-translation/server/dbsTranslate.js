/**
 * @author Vigneshwaran Odayappan <vickyokrm@gmail.com>
 */

import {TranslationProviderRegistry, AutoTranslate} from 'meteor/rocketchat:autotranslate';
import {RocketChat} from 'meteor/rocketchat:lib';
import {SystemLogger} from 'meteor/rocketchat:logger';
import _ from 'underscore';

const cld = Npm.require('cld'); // import the local package dependencies

/**
 * Intergrate DBS translation service
 * @class
 * @augments AutoTranslate
 */
class DBSAutoTranslate extends AutoTranslate {
	/**
	 * setup api reference to dbs translation service provider to be used for translation.
	 * @constructor
	 */
	constructor() {
		super();
		this.name = 'dbs-translate';
		// get the service provider url from settings.
		RocketChat.settings.get('AutoTranslate_ServiceProviderURL', (key, value) => {
			this.apiEndPointUrl = value;
		});
		// self register & de-register callback - afterSaveMessage based on the activeProvider
		RocketChat.settings.get('AutoTranslate_ServiceProvider', (key, value) => {
			if (this.name === value) {
				this._registerAfterSaveMsgCallBack(this.name);
			} else {
				this._unRegisterAfterSaveMsgCallBack(this.name);
			}
		});
	}

	/**
	 * Returns metadata information about the service provide
	 * @private implements super abstract method.
	 * @return {object}
	 */
	_getProviderMetadata() {
		return {
			name: this.name,
			displayName: TAPi18n.__('AutoTranslate_DBS'),
			settings: this._getSettings()
		};
	}

	/**
	 * Returns necessary settings information about the translation service provider.
	 * @private implements super abstract method.
	 * @return {object}
	 */
	_getSettings() {
		return {
			apiKey: this.apiKey,
			apiEndPointUrl: this.apiEndPointUrl
		};
	}

	/**
	 * Returns supported languages for translation by the active service provider.
	 * @private implements super abstract method.
	 * @param {string} target
	 * @returns {object} code : value pair
	 */
	_getSupportedLanguages(target) {
		if (this.autoTranslateEnabled && this.apiKey) {
			if (this.supportedLanguages[target]) {
				return this.supportedLanguages[target];
			}
			return this.supportedLanguages[target] = [
				{
					'language': 'de',
					'name': TAPi18n.__('German', {lng: target})
				},
				{
					'language': 'en',
					'name': TAPi18n.__('English', {lng: target})
				},
				{
					'language': 'fr',
					'name': TAPi18n.__('French', {lng: target})
				},
				{
					'language': 'es',
					'name': TAPi18n.__('Spanish', {lng: target})
				},
				{
					'language': 'it',
					'name': TAPi18n.__('Italian', {lng: target})
				},
				{
					'language': 'nl',
					'name': TAPi18n.__('Dutch', {lng: target})
				},
				{
					'language': 'pl',
					'name': TAPi18n.__('Polish', {lng: target})
				},
				{
					'language': 'ro',
					'name': TAPi18n.__('Romanian', {lng: target})
				},
				{
					'language': 'sk',
					'name': TAPi18n.__('Slovak', {lng: target})
				},
				{
					'language': 'ja',
					'name': TAPi18n.__('Japanese', {lng: target})
				},
				{
					'language': 'zh',
					'name': TAPi18n.__('Chinese', {lng: target})
				}
			];
		}
	}

	/**
	 * Send Request REST API call to the service provider.
	 * Returns translated message for each target language in target languages.
	 * @private
	 * @param {object} message
	 * @param {object} targetLanguages
	 * @returns {object} translations: Translated messages for each language
	 */
	_sendRequestTranslateMessage(message, targetLanguages) {
		const translations = {};
		const msgs = message.msg.split('\n');
		const query = msgs.join();
		let sourceLanguage;
		/**
		 * Service provider do not handle the text language detection automatically rather it requires the source language to be specified
		 * explicitly. To automate this language detection process we used the cld language detector.
		 * When the language detector fails, it falls back into the user language.
		 */
		cld.detect(query, (err, result) => {
			if (result) {
				result.languages.map((language) => {
					sourceLanguage = language.code;
				});
				const supportedLanguages = this._getSupportedLanguages('en');
				targetLanguages.forEach(language => {
					if (language.indexOf('-') !== -1 && !_.findWhere(supportedLanguages, {language})) {
						language = language.substr(0, 2);
					}
					const result = Meteor.call('assistify.translate', 'POST', `${ this.apiEndPointUrl }/translate`, {
						params: {
							key: this.apiKey
						}, data: {
							text: query,
							to: language,
							from: sourceLanguage
						}
					});
					translations[language] = this.deTokenize(Object.assign({}, message, {msg: result}));
				});
			} else {
				SystemLogger.log('Text language could not be determined', err.message);
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
		const query = attachment.description || attachment.text;
		let sourceLanguage;
		/**
		 * Service provider do not handle the text language detection automatically rather it requires the source language to be specified
		 * explicitly. To automate this language detection process we used the cld language detector.
		 * When the language detector fails, it falls back into the user language.
		 */
		cld.detect(query, (err, result) => {
			if (result) {
				result.languages.map((language) => {
					sourceLanguage = language.code || RocketChat.settings.get('Language'); // fallback to user language.
				});
				const supportedLanguages = this._getSupportedLanguages('en');
				targetLanguages.forEach(language => {
					if (language.indexOf('-') !== -1 && !_.findWhere(supportedLanguages, {language})) {
						language = language.substr(0, 2);
					}
					translations[language] = Meteor.call('assistify.translate', 'POST', `${ this.apiEndPointUrl }/translate`, {
						params: {
							key: this.apiKey
						}, data: {
							text: query,
							to: language,
							from: sourceLanguage
						}
					});
				});
			} else {
				SystemLogger.log('Text language could not be determined', err.message);
			}
		});
		return translations;
	}
}


Meteor.startup(() => {
	TranslationProviderRegistry.registerProvider(new DBSAutoTranslate());
	RocketChat.AutoTranslate = TranslationProviderRegistry.getActiveServiceProvider();
});
