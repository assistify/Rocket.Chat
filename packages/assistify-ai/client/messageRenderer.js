import { RocketChat } from 'meteor/rocketchat:lib';
import s from 'underscore.string';

/**
 * This function is used as a callback which is executed while rendering the message.
 * @see /packages/rocketchat-ui-message/client/renderMessageBody.js
 * @param {*} message the message object including all properties
 * @augments message.html - the rendered message body
 */
const highlightrecognizedTokens = function(message) {
	const { recognizedTokens } = message;
	if (RocketChat.settings.get('Assistify_AI_Smarti_Inline_Highlighting_Enabled')) {
		const confExcluded = RocketChat.settings.get('Assistify_AI_Smarti_Inline_Highlighting_Excluded_Types');
		const excludedTypes = confExcluded ? new Set(confExcluded.split(',').map((item) => item.trim())) : new Set();

		let { html } = message;
		if (recognizedTokens) {
			recognizedTokens.forEach((term) => {
				if (!excludedTypes.has(term.type)) {
					const regexpFindTerm = `(^|\\b|[\\s.,،'\\\"\\+!?:-])(${ s.escapeRegExp(term.value) })($|\\b|[\\s.,،'\\\"\\+!?:-])`;
					html = html.replace(new RegExp(regexpFindTerm, 'gmi'), '$1<span class="recognized-term"><span class="text">$2</span></span>$3');
				}
			});
		}
		message.html = html;
	}
};

RocketChat.callbacks.add('renderMessage', highlightrecognizedTokens, RocketChat.callbacks.priority.LOW, 'smartiHighlighting');
