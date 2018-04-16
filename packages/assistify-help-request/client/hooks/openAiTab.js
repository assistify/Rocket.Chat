/**
 * Makes the knowledge base panel open on opening a room in which it is active
 * (a request, an expertise or a livechat)
 */
RocketChat.callbacks.add('enter-room', function(subscription) {
	if (Meteor.isCordova) {
		return; //looks awkward on mobile if panel is opened by default
	}

	if (subscription) { //no subscription: if a user joins a room without being subscribed to it, e. g. in live chat
		const roomOpened = RocketChat.models.Rooms.findOne({_id: subscription.rid});

		// open the context-bar (fka. tabbar) if not opened already
		if ((roomOpened.t === 'r' || roomOpened.t === 'l') && $('.contextual-bar').length === 0) {
			$('.tab-button-icon--lightbulb').click();
		}
	}
});
