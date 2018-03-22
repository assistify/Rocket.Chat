import { CreateRequestFromExpertise } from './createRequestFromExpertise.js';
import { CreateRequestFromRoomId } from './createRequestFromRoomId.js';

export class CreateRequestFactory {
	static getInstance(type, room) {
		if (type === 'e') {
			return new CreateRequestFromExpertise(
				room.requestTitle,
				room.expertise,
				room.openingQuestion,
				room.members,
				room.environment
			);
		} else {
			return new CreateRequestFromRoomId(
				room.parentRoomId,
				room.openingQuestion
			);
		}
	}
}


