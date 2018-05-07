import {registerFieldTemplate} from './renderField';

registerFieldTemplate('roomJoinRequest', 'RoomJoinRequest');


// attach the event at the parent level to avoid duplicate event registration
Template.room.events({
	'click [name="accept"]'(e, t) {
		alert('accept');
	},
	'click [name="reject"]'(e, t) {
		alert('reject');
	}
});



