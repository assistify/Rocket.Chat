import {registerFieldTemplate} from './renderField';


Template.JoinRoomRequest.helpers({
	takeAction(status) {
		return status === 'pending';
	},
	hasPermission() {
		return RocketChat.authz.hasAtLeastOnePermission('add-user-to-any-p-room');
	}
});

const events = {
	'click [name="accept"]'(e, t) {
		const message = this._arguments[1];
		const status = 'accepted';
		const responder = Meteor.user().name;
		const roomId = t.data._id;
		Meteor.call('addUserToRoom', {rid: roomId, username: message.attachments[0].fields[0].requester}, (err) => {
			if (err) {
				return err;
			}
			Meteor.call('updateJoinRoomStatus', roomId, message, status, responder);
			//Meteor.call('notifyUser', roomId, 'user');
		});
	},
	'click [name="decline"]'(e, t) {
		const message = this._arguments[1];
		const status = 'declined';
		const responder = Meteor.user().name;
		const roomId = t.data._id;
		Meteor.call('updateJoinRoomStatus', roomId, message, status, responder);
		//Meteor.call('notifyUser', roomId, 'user');
	}
};


registerFieldTemplate('joinRoomRequest', 'JoinRoomRequest', events);
