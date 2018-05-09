import {registerFieldTemplate} from './renderField';

registerFieldTemplate('joinRoomRequest', 'JoinRoomRequest');

Template.JoinRoomRequest.helpers({
	takeAction(status) {
		return status === 'pending';
	}
});
