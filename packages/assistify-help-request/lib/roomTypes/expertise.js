/* globals openRoom */

import {RoomTypeConfig, RoomTypeRouteConfig, UiTextContext} from 'meteor/rocketchat:lib';

class ExpertiseRoomRoute extends RoomTypeRouteConfig {
	constructor() {
		super({
			name: 'expertise',
			path: '/expertise/:name'
		});
	}

	action(params) {
		return openRoom('e', params.name);
	}
}

export class ExpertiseRoomType extends RoomTypeConfig {
	constructor() {
		super({
			identifier: 'e',
			order: 24,
			template: 'expertise',
			icon: 'lightbulb',
			label: 'Expertises',
			route: new ExpertiseRoomRoute()
		});

		this.creationLabel = 'New_expertise';
		this.creationTemplate = 'AssistifyCreateExpertise';
	}

	findRoom(identifier) {
		const query = {
			t: 'e',
			name: identifier
		};
		return ChatRoom.findOne(query);
	}

	roomName(roomData) {
		return RocketChat.settings.get('UI_Use_Real_Name')?roomData.fname:roomData.name;
		//return roomData.name;
	}

	condition() {
		return RocketChat.authz.hasAllPermission('view-e-room');
	}

	includeInRoomSearch() {
		return true;
	}

	isGroupChat() {
		return true;
	}

	canAddUser() {
		return true;
	}

	userDetailShowAll() {
		return true;
	}

	userDetailShowAdmin() {
		return true;
	}

	preventRenaming() {
		return true; //renaming an expertise will lead to new requests not finding answers to the previously named expertise
	}

	enableMembersListProfile() {
		return true;
	}

	getUiText(context) {
		switch (context) {
			case UiTextContext.HIDE_WARNING:
				return 'Hide_expertise_warning';
			case UiTextContext.LEAVE_WARNING:
				return 'Leave_expertise_warning';
			case UiTextContext.NO_ROOMS_SUBSCRIBED:
				return 'No_expertise_yet';
			default:
				return '';
		}
	}
}

