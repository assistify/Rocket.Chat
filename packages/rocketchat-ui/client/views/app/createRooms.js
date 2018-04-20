const roomTypesBeforeStandard = function() {
	const orderLow = RocketChat.roomTypes.roomTypesOrder.filter((roomTypeOrder) => roomTypeOrder.identifier === 'c')[0].order;
	return RocketChat.roomTypes.roomTypesOrder.filter(
		(roomTypeOrder) => roomTypeOrder.order < orderLow
	).map(
		(roomTypeOrder) => {
			return RocketChat.roomTypes.roomTypes[roomTypeOrder.identifier];
		}
	).filter((roomType) => roomType.creationTemplate && roomType.canBeCreated());
};

const roomTypesAfterStandard = function() {
	const orderHigh = RocketChat.roomTypes.roomTypesOrder.filter((roomTypeOrder) => roomTypeOrder.identifier === 'd')[0].order;
	return RocketChat.roomTypes.roomTypesOrder.filter(
		(roomTypeOrder) => roomTypeOrder.order > orderHigh
	).map(
		(roomTypeOrder) => {
			return RocketChat.roomTypes.roomTypes[roomTypeOrder.identifier];
		}
	).filter((roomType) => roomType.creationTemplate && roomType.canBeCreated());
};

const standardRoomType = function() {
	if (RocketChat.authz.hasAtLeastOnePermission(['create-c', 'create-p'])) {
		return [{
			creationLabel: 'Create_A_New_Channel',
			creationTemplate: 'createChannel'
		}];
	} else {
		return [];
	}
};

const allTemplatesOrdered = function() {
	return roomTypesBeforeStandard()
		.concat(standardRoomType())
		.concat(roomTypesAfterStandard())
		.map((roomtype) => {
			return {
				label: roomtype.creationLabel,
				template: roomtype.creationTemplate
			};
		});
};

Template.createRooms.helpers({
	tabsNeeded() {
		const instance = Template.instance();
		return !!(instance.data.roomTypesBeforeStandard.length || instance.data.roomTypesAfterStandard.length);
	},

	authorizationsLoaded() {
		return RocketChat.authz.cachedCollection.ready.get();
	}
});

Template.createRooms.onCreated(function() {
	Tracker.autorun(()=> {
		const authLoaded = RocketChat.authz.cachedCollection.ready.get();
		if (authLoaded) {
			// custom room types might verify authorization before they decide to be visible.
			// This is only possible once the authorizations, which are a cached collection, are loaded
			this.data.roomTypesBeforeStandard = roomTypesBeforeStandard();
			this.data.roomTypesAfterStandard = roomTypesAfterStandard();
		}
		this.data.tabs = allTemplatesOrdered();
	});
});
