/**
 * Created by OliverJaegle on 10.08.2016.
 * Publish Peer-to-peer-specific enhancements to Rocket.Chat models
 *
 */
Meteor.publish('assistify:room', function({rid: roomId}) {
	if (!this.userId) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized'));
	}

	// todo: add permission
	// if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-rooms')) {
	// 	return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {publish: 'livechat:visitorInfo'}));
	// }

	return RocketChat.models.Rooms.findOneById(roomId, {fields: {helpRequestId: 1}});
});


Meteor.publish('assistify:expertise', function() {
	if (!this.userId) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized'));
	}
	return RocketChat.models.Rooms.find({
		fields: {
			_id: 1,
			roomId: 1,
			helpRequestId: 1,
			expertise: 1
		}
	});
});
