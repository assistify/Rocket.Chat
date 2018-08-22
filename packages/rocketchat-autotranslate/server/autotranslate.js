/* globals SystemLogger, RocketChat */

import s from 'underscore.string';
import _ from 'underscore';

/**
 * Generic auto translate base implementation.
 * @class
 */
export class AutoTranslate {
	/**
	 * Encapsulate the api key and provider settings.
	 * @constructor
	 */
	constructor() {
		this.languages = [];
		this.supportedLanguages = {};
		this.apiKey = RocketChat.settings.get('AutoTranslate_APIKey');
		this.autoTranslateEnabled = RocketChat.settings.get('AutoTranslate_Enabled');
		RocketChat.settings.get('AutoTranslate_Enabled', (key, value) => {
			this.autoTranslateEnabled = value;
		});
		RocketChat.settings.get('AutoTranslate_APIKey', (key, value) => {
			this.apiKey = value;
		});
	}

	/**
	 * tokenize message
	 * @param {object} message
	 * @return {object} message
	 */
	tokenize(message) {
		if (!message.tokens || !Array.isArray(message.tokens)) {
			message.tokens = [];
		}
		message = this.tokenizeEmojis(message);
		message = this.tokenizeCode(message);
		message = this.tokenizeURLs(message);
		message = this.tokenizeMentions(message);
		return message;
	}

	tokenizeEmojis(message) {
		let count = message.tokens.length;
		message.msg = message.msg.replace(/:[+\w\d]+:/g, function(match) {
			const token = `<i class=notranslate>{${ count++ }}</i>`;
			message.tokens.push({
				token,
				text: match
			});
			return token;
		});

		return message;
	}

	tokenizeURLs(message) {
		let count = message.tokens.length;

		const schemes = RocketChat.settings.get('Markdown_SupportSchemesForLink').split(',').join('|');

		// Support ![alt text](http://image url) and [text](http://link)
		message.msg = message.msg.replace(new RegExp(`(!?\\[)([^\\]]+)(\\]\\((?:${ schemes }):\\/\\/[^\\)]+\\))`, 'gm'), function(match, pre, text, post) {
			const pretoken = `<i class=notranslate>{${ count++ }}</i>`;
			message.tokens.push({
				token: pretoken,
				text: pre
			});

			const posttoken = `<i class=notranslate>{${ count++ }}</i>`;
			message.tokens.push({
				token: posttoken,
				text: post
			});

			return pretoken + text + posttoken;
		});

		// Support <http://link|Text>
		message.msg = message.msg.replace(new RegExp(`((?:<|&lt;)(?:${ schemes }):\\/\\/[^\\|]+\\|)(.+?)(?=>|&gt;)((?:>|&gt;))`, 'gm'), function(match, pre, text, post) {
			const pretoken = `<i class=notranslate>{${ count++ }}</i>`;
			message.tokens.push({
				token: pretoken,
				text: pre
			});

			const posttoken = `<i class=notranslate>{${ count++ }}</i>`;
			message.tokens.push({
				token: posttoken,
				text: post
			});

			return pretoken + text + posttoken;
		});

		return message;
	}

	tokenizeCode(message) {
		let count = message.tokens.length;

		message.html = message.msg;
		message = RocketChat.Markdown.parseMessageNotEscaped(message);
		message.msg = message.html;

		for (const tokenIndex in message.tokens) {
			if (message.tokens.hasOwnProperty(tokenIndex)) {
				const token = message.tokens[tokenIndex].token;
				if (token.indexOf('notranslate') === -1) {
					const newToken = `<i class=notranslate>{${ count++ }}</i>`;
					message.msg = message.msg.replace(token, newToken);
					message.tokens[tokenIndex].token = newToken;
				}
			}
		}

		return message;
	}

	tokenizeMentions(message) {
		let count = message.tokens.length;

		if (message.mentions && message.mentions.length > 0) {
			message.mentions.forEach(mention => {
				message.msg = message.msg.replace(new RegExp(`(@${ mention.username })`, 'gm'), match => {
					const token = `<i class=notranslate>{${ count++ }}</i>`;
					message.tokens.push({
						token,
						text: match
					});
					return token;
				});
			});
		}

		if (message.channels && message.channels.length > 0) {
			message.channels.forEach(channel => {
				message.msg = message.msg.replace(new RegExp(`(#${ channel.name })`, 'gm'), match => {
					const token = `<i class=notranslate>{${ count++ }}</i>`;
					message.tokens.push({
						token,
						text: match
					});
					return token;
				});
			});
		}

		return message;
	}

	deTokenize(message) {
		if (message.tokens && message.tokens.length > 0) {
			for (const {token, text, noHtml} of message.tokens) {
				message.msg = message.msg.replace(token, () => noHtml ? noHtml : text);
			}
		}
		return message.msg;
	}

	/**
	 * Prepares the message that are needs translation.
	 * @public
	 * @param {object} message
	 * @param {object} room
	 * @param {object} targetLanguage
	 * @returns {object} unmodified message object.
	 */
	translateMessage(message, room, targetLanguage) {
		if (this.autoTranslateEnabled && this.apiKey) {
			let targetLanguages;
			if (targetLanguage) {
				targetLanguages = [targetLanguage];
			} else {
				targetLanguages = RocketChat.models.Subscriptions.getAutoTranslateLanguagesByRoomAndNotUser(room._id, message.u && message.u._id);
			}
			if (message.msg) {
				Meteor.defer(() => {
					let targetMessage = Object.assign({}, message);
					targetMessage.html = s.escapeHTML(String(targetMessage.msg));
					targetMessage = this.tokenize(targetMessage);
					const translations = this._sendRequestTranslateMessage(targetMessage, targetLanguages);
					if (!_.isEmpty(translations)) {
						RocketChat.models.Messages.addTranslations(message._id, translations);
					}
				});
			}

			if (message.attachments && message.attachments.length > 0) {
				Meteor.defer(() => {
					for (const index in message.attachments) {
						if (message.attachments.hasOwnProperty(index)) {
							const attachment = message.attachments[index];
							if (attachment.description || attachment.text) {
								const translations = this._sendRequestTranslateMessageAttachments(attachment, targetLanguages);
								if (!_.isEmpty(translations)) {
									RocketChat.models.Messages.addAttachmentTranslations(message._id, index, translations);
								}
							}
						}
					}
				});
			}
		}
		return message;
	}

	/**
	 * Registers afterSaveMessage call back for active service provider
	 * @protected
	 * @param {string} provider
	 */
	_registerAfterSaveMsgCallBack(provider) {
		RocketChat.callbacks.add('afterSaveMessage', this.translateMessage.bind(this), RocketChat.callbacks.priority.MEDIUM, provider);
	}

	/**
	 * De-register afterSaveMessage call back for active service provider
	 * @protected
	 * @param {string} provider
	 */
	_unRegisterAfterSaveMsgCallBack(provider) {
		RocketChat.callbacks.remove('afterSaveMessage', provider);
	}

	/**
	 * Returns metadata information about the service provider
	 * @abstract
	 * @private
	 * @returns {object}
	 */
	_getProviderMetadata() {
		SystemLogger.warn('must be implemented by subclass!', '_getProviderMetadata');
	}


	/**
	 * Returns necessary settings information about the translation service provider.
	 * @abstract
	 * @private
	 * @param {string} target
	 * @returns {object}
	 */
	_getSupportedLanguages(target) {
		SystemLogger.warn('must be implemented by subclass!', '_getSupportedLanguages', target);
	}

	/**
	 * Send Request REST API call to the service provider.
	 * @abstract
	 * @public
	 * @param {object} message
	 * @param {object} targetLanguages
	 * @return {object}
	 */
	_sendRequestTranslateMessage(message, targetLanguages) {
		SystemLogger.warn('must be implemented by subclass!', '_sendRequestTranslateMessage', message, targetLanguages);
	}

	/**
	 * Send Request REST API call to the service provider.
	 * @abstract
	 * @param {object} attachment
	 * @param {object} targetLanguages
	 * @returns {object} translated messages for each target language
	 */
	_sendRequestTranslateMessageAttachments(attachment, targetLanguages) {
		SystemLogger.warn('must be implemented by subclass!', '_sendRequestTranslateMessageAttachments', attachment, targetLanguages);
	}
}

export class TranslationProviderRegistry {
	static registerProvider(provider) {
		//get provider information
		const metadata = provider._getProviderMetadata();
		if (!TranslationProviderRegistry._providers) {
			TranslationProviderRegistry._providers = {};
		}
		TranslationProviderRegistry._providers[metadata.name] = provider;
	}

	static initProviderSettings() {
		RocketChat.settings.get('AutoTranslate_ServiceProvider', (key, value) => {
			TranslationProviderRegistry._activeProvider = value;
		});
	}

	static getActiveServiceProvider() {
		return TranslationProviderRegistry._providers[TranslationProviderRegistry._activeProvider];
	}
}

Meteor.startup(() => {
	TranslationProviderRegistry.initProviderSettings();
});

