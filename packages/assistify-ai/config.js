/* globals RocketChat */

Meteor.startup(() => {
	const addAISettings = function() {

		this.section('Knowledge_Base', function() {

			this.add('Assistify_AI_Enabled', false, {
				type: 'boolean',
				public: true,
				i18nLabel: 'Enabled'
			});

			this.add('Assistify_AI_Source', '0', {
				type: 'select',
				values: [
					{key: '0', i18nLabel: 'Assistify_AI_Source_Smarti'},
					{key: '1', i18nLabel: 'Assistify_AI_Source_APIAI'}
				],
				public: true,
				i18nLabel: 'Assistify_AI_Source'
			});

			this.add('Assistify_AI_Reload', 'reloadSmarti', {
				type: 'action',
				actionText: 'Reload_Settings'
			});

			this.add('Assistify_AI_Smarti_Base_URL', '', {
				type: 'string',
				public: true,
				i18nLabel: 'Assistify_AI_Smarti_Base_URL',
				i18nDescription: 'Assistify_AI_Smarti_Base_URL_Description'
			});

			let domain = RocketChat.settings.get('Site_Url');
			if (domain) {
				domain = domain
					.replace('https://', '')
					.replace('http://', '');
				while (domain.charAt(domain.length - 1) === '/') {
					domain = domain.substr(0, domain.length - 1);
				}
			}
			this.add('Assistify_AI_Smarti_Domain', domain, {
				type: 'string',
				public: true,
				i18nLabel: 'Assistify_AI_Smarti_Domain',
				i18nDescription: 'Assistify_AI_Smarti_Domain_Description'
			});

			this.add('Assistify_AI_Smarti_Auth_Token', '', {
				type: 'string',
				public: true,
				i18nLabel: 'Assistify_AI_Smarti_Auth_Token',
				i18nDescription: 'Assistify_AI_Smarti_Auth_Token_Description'
			});

			this.add('Assistify_AI_Widget_Posting_Type', '', {
				type: 'select',
				values: [
					{key: 'suggestText', i18nLabel: 'Assistify_AI_Widget_Posting_Type_SuggestText'},
					{key: 'postText', i18nLabel: 'Assistify_AI_Widget_Posting_Type_PostText'},
					{key: 'postRichText', i18nLabel: 'Assistify_AI_Widget_Posting_Type_PostRichText'}
				],
				public: true,
				i18nLabel: 'Assistify_AI_Widget_Posting_Type',
				i18nDescription: 'Assistify_AI_Widget_Posting_Type_Description'
			});

			this.add('Assistify_AI_RocketChat_Webhook_Token', '', {
				type: 'string',
				public: true,
				i18nLabel: 'Assistify_AI_RocketChat_Webhook_Token',
				i18nDescription: 'Assistify_AI_RocketChat_Webhook_Token_Description'
			});

			this.add('Assistify_AI_RocketChat_Callback_URL', '', {
				type: 'string',
				public: true,
				i18nLabel: 'Assistify_AI_RocketChat_Callback_URL',
				i18nDescription: 'Assistify_AI_RocketChat_Callback_URL_Description'
			});

			this.add('Assistify_AI_Resync_Full', 'triggerFullResync', {
				type: 'action',
				i18nLabel: 'Assistify_AI_Resync_Full',
				i18nDescription: 'Assistify_AI_Resync_Full_Description',
				actionText: 'Assistify_AI_Resync_Full_Text'
			});

			this.add('Assistify_AI_Smarti_Widget_i18n', '', {
				type: 'code',
				public: true,
				i18nLabel: 'Assistify_AI_Smarti_Widget_i18n',
				i18nDescription: 'Assistify_AI_Smarti_Widget_i18n_Description'
			});
		});
	};

	// add the setting group if needed or reuse the existing one
	RocketChat.settings.get('Assistify') ?
		RocketChat.settings.get('Assistify', addAISettings) :
		RocketChat.settings.addGroup('Assistify', addAISettings);
});


/* Propagate settings to Chatpal */

const setChatpalUrl = (smartiUrl) => {
	RocketChat.models.Settings.update('CHATPAL_CONFIG', {
		$set:
			{
				'value.baseurl': smartiUrl,
				'value.backendtype': 'onsite'
			}
	});
};

RocketChat.settings.get('Assistify_AI_Smarti_Base_URL', (id, smartiUrl) => {
	const client = RocketChat.models.Settings.findOneNotHiddenById('Assistify_AI_Smarti_Domain');
	if (client) {
		setChatpalUrl(smartiUrl);
	}
});

RocketChat.settings.get('Assistify_AI_Smarti_Auth_Token', (id, smartiAuthToken) => {
	RocketChat.models.Settings.update('CHATPAL_CONFIG', {$set: {'value.headerstring': `X-Auth-Token: ${ smartiAuthToken }`}});
});

