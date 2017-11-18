/* global SystemLogger */
function onSpotlighStartHandler(item) {
	SystemLogger.debug('onSpotlightStart', item.text);
}

function onSpotlighEndHandler(item) {
	SystemLogger.debug('onSpotlightEnd', item.text);
	if (item.result && item.result.rooms) {
		const conversations = Meteor.call('findInSmarti', item.text, item.accessibleRooms);
		item.result.rooms = item.result.rooms.concat(conversations);
	}
}

// RocketChat Callback register
RocketChat.callbacks.add('onSpotlightStart', onSpotlighStartHandler, RocketChat.callbacks.priority.LOW, 'assistify.onSpotlightStart');
RocketChat.callbacks.add('onSpotlightEnd', onSpotlighEndHandler, RocketChat.callbacks.priority.LOW, 'assistify.onSpotlightEnd');
