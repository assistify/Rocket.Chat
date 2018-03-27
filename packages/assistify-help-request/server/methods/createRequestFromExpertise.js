import { CreateRequestBase } from './createRequestBase';
import { CreateRequestFactory } from './createRequestFactory';
import { RocketChat } from 'meteor/rocketchat:lib';
export class CreateRequestFromExpertise extends CreateRequestBase {
	constructor(requestTitle, expertise, openingQuestion, members, environment) {
		super(openingQuestion);
		this._expertise = expertise;
		this._members = members;
		this._environment = environment;
		this._requestTitle = requestTitle;
	}

	static getExperts(expertise) {
		const expertiseRoom = RocketChat.models.Rooms.findOneByName(expertise);
		if (expertiseRoom) {
			return expertiseRoom.usernames;
		} else {
			return []; // even if there are no experts in the room, this is valid. A bot could notify later on about this flaw
		}
	}

	create() {
		if (this._expertise && !this._requestTitle) {
			this.name = `${ this._expertise }-${ CreateRequestBase.getNextId(this._expertise) }`;
		} else if (this._expertise && this._requestTitle) {
			this.name = `${ this._requestTitle }`;
		}
		if (this._expertise) {
			this._members = CreateRequestFromExpertise.getExperts(this._expertise);
		}
		const roomCreateResult = RocketChat.createRoom('r', this.name, Meteor.user() && Meteor.user().username, this._members, false, {expertise: this._expertise});
		if (this._requestTitle) {
			RocketChat.saveRoomTopic(roomCreateResult.rid, this._expertise, Meteor.user());
		}
		this._createNotifications(roomCreateResult.rid, this._members.concat([Meteor.user().username]));
		const room = RocketChat.models.Rooms.findOneById(roomCreateResult.rid);
		if (this._openingQuestion) {
			this._postMessage(room, Meteor.user(), this._openingQuestion);
		}
		const helpRequestId = RocketChat.models.HelpRequests.createForSupportArea(this._expertise, roomCreateResult.rid, '', this._environment);
		//propagate help-id to room in order to identify it as a "helped" room
		RocketChat.models.Rooms.addHelpRequestInfo(room, helpRequestId);
		return roomCreateResult;
	}
}

Meteor.methods({
	createRequestFromExpertise(requestTitle, expertise, openingQuestion, members, environment) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {method: 'createRequestFromExpertise'});
		}
		const config = {
			requestTitle,
			expertise,
			openingQuestion,
			members,
			environment
		};
		return CreateRequestFactory.getInstance('e', config).create();
	}
});
