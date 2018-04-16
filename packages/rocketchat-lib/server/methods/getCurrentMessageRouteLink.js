Meteor.methods({
	getCurrentMessageRouteLink(messageId) {
		if (Meteor.isServer) {
			const message = RocketChat.models.Messages.findOneById(messageId);

			if (message && message.rid) {
				const room = RocketChat.models.Rooms.findOneById(message.rid);
				return FlowRouter.path(RocketChat.roomTypes.getRouteLink(room.t, room), '', {msg: message._id});
			} else {
				throw new Meteor.Error('invalid message');
			}
		}
	}
});
