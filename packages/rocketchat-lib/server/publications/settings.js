Meteor.methods({
	'public-settings/get'(updatedAt) {
		this.unblock();
		const records = RocketChat.models.Settings.findNotHiddenPublic().fetch();

		if (updatedAt instanceof Date) {
			return {
				update: records.filter(function(record) {
					return record._updatedAt > updatedAt;
				}),
				remove: RocketChat.models.Settings.trashFindDeletedAfter(updatedAt, {
					hidden: {
						$ne: true,
					},
					public: true,
				}, {
					fields: {
						_id: 1,
						_deletedAt: 1,
					},
				}).fetch(),
			};
		}
		return records;
	},
	'private-settings/get'(updatedAt) {
		if (!Meteor.userId()) {
			return [];
		}
		this.unblock();
		const records = RocketChat.models.Settings.findNotHidden().fetch().filter(function(record) {
			if (RocketChat.authz.hasAtLeastOnePermission(Meteor.userId(), ['view-privileged-setting', 'edit-privileged-setting'])) {
				return record.hidden !== true;
			} else if (RocketChat.authz.hasPermission(Meteor.userId(), 'manage-selected-settings')) {
				return record.hidden !== true && RocketChat.authz.hasPermission(Meteor.userId(), `change-setting-${ record._id }`);
			} else {
				return false;
			}
		});

		if (updatedAt instanceof Date) {
			return {
				update: records.filter(function(record) {
					return record._updatedAt > updatedAt;
				}),
				remove: RocketChat.models.Settings.trashFindDeletedAfter(updatedAt, {
					hidden: {
						$ne: true,
					},
				}, {
					fields: {
						_id: 1,
						_deletedAt: 1,
					},
				}).fetch(),
			};
		}
		return records;
	},
});

RocketChat.models.Settings.on('change', ({ clientAction, id, data }) => {
	switch (clientAction) {
		case 'updated':
		case 'inserted':
			const setting = data || RocketChat.models.Settings.findOneById(id);
			const value = {
				_id: setting._id,
				value: setting.value,
				editor: setting.editor,
				properties: setting.properties,
			};

			if (setting.public === true) {
				RocketChat.Notifications.notifyAllInThisInstance('public-settings-changed', clientAction, value);
			} else {
				RocketChat.Notifications.notifyLoggedInThisInstance('private-settings-changed', clientAction, setting);
			}
			break;

		case 'removed':
			RocketChat.Notifications.notifyLoggedInThisInstance('private-settings-changed', clientAction, { _id: id });
			RocketChat.Notifications.notifyAllInThisInstance('public-settings-changed', clientAction, { _id: id });
			break;
	}
});

RocketChat.Notifications.streamAll.allowRead('private-settings-changed', function() {
	if (this.userId == null) {
		return false;
	}
	return RocketChat.authz.hasAtLeastOnePermission(this.userId, ['view-privileged-setting', 'edit-privileged-setting', 'manage-selected-settings']);
});
