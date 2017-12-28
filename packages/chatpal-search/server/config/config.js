Meteor.startup(() => {
	RocketChat.settings.addGroup('Chatpal', function() {
		this.section('CHATPAL_SEARCH', function() {
			this.add('CHATPAL_BASEURL', '', {
				type: 'string',
				public: true,
				i18nLabel: 'CHATPAL_BASEURL',
				i18nDescription: 'CHATPAL_BASEURL_DESCRIPTION'
			});

			this.add('CHATPAL_AUTH_TOKEN', '', {
				type: 'string',
				public: true,
				i18nLabel: 'CHATPAL_AUTH_TOKEN',
				i18nDescription: 'CHATPAL_AUTH_TOKEN_DESCRIPTION'
			});
			this.add('CHATPAL_BASIC_AUTH', '', {
				type: 'string',
				public: true,
				i18nLabel: 'CHATPAL_BASIC_AUTH',
				i18nDescription: 'CHATPAL_BASIC_AUTH_DESCRIPTION'
			});

			this.add('CHATPAL_PAGESIZE', 5, {
				type: 'int',
				public: true,
				i18nLabel: 'CHATPAL_PAGESIZE'
			});

			this.add('CHATPAL_TIME_FORMAT', 'H:mm A', {
				type: 'string',
				public: true,
				i18nLabel: 'CHATPAL_TIME_FORMAT'
			});

			this.add('CHATPAL_DATE_FORMAT', 'MMM Do', {
				type: 'string',
				public: true,
				i18nLabel: 'CHATPAL_DATE_FORMAT'
			});
		});
		this.section('CHATPAL_BOT', function() {
			this.add('CHATPAL_BOT_BASEURL', '', {
				type: 'string',
				public: true,
				i18nLabel: 'CHATPAL_BOT_BASEURL'
			});
		});
	});

	Meteor.defer(function() {
		if (!RocketChat.models.Users.db.findOneById('chatpal')) {
			RocketChat.models.Users.create({
				_id: 'chatpal',
				name: 'Chatpal',
				username: 'chatpal',
				status: 'online',
				statusDefault: 'online',
				utcOffset: 0,
				active: true,
				type: 'bot'
			});

			RocketChat.authz.addUserRoles('chatpal');

			const rs = RocketChatFile.bufferToStream(new Buffer(Assets.getBinary('server/asset/pal.png')));
			const fileStore = FileUpload.getStore('Avatars');
			fileStore.deleteByName('chatpal');

			const file = {
				userId: 'chatpal',
				type: 'image/png'
			};

			Meteor.runAsUser('chatpal', () => {
				fileStore.insert(file, rs, () => {
					return RocketChat.models.Users.setAvatarOrigin('chatpal', 'local');
				});
			});
		}
	});
});

export const Chatpal = {
	models: {},
	service: {}
};
