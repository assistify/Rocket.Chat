import { RocketChat } from 'meteor/rocketchat:lib';
import s from 'underscore.string';

/**
 * This function is used as a callback which is executed while rendering the message.
 * @see /packages/rocketchat-ui-message/client/renderMessageBody.js
 * @param {*} message the message object including all properties
 * @augments message.html - the rendered message body
 */
const highlightRecognizedTerms = function(message) {
	if (RocketChat.settings.get('Assistify_AI_Smarti_Inline_Highlighting_Enabled')) {
		let { html } = message;
		if (message.recognizedTerms) {
			message.recognizedTerms.forEach((term) => html = html.replace(new RegExp(`(^|\\b|[\\s\\n\\r\\t.,،'\\\"\\+!?:-])(${ s.escapeRegExp(term) })($|\\b|[\\s\\n\\r\\t.,،'\\\"\\+!?:-])(?![^<]*>|[^<>]*<\\/)`, 'gmi'), '$1<span class="recognized-term">$2</span>$3'));
		}
		message.html = html;
	}
};

RocketChat.callbacks.add('renderMessage', highlightRecognizedTerms, RocketChat.callbacks.priority.LOW, 'smartiHighlighting');
