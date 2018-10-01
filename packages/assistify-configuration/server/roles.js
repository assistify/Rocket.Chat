const CONFIGURATION_ROLE_NAME = 'config-expert';
const MANAGER_ROLE_NAME = 'manager';
const USER_ROLE_NAME = 'user';
const GUEST_ROLE_NAME = 'guest';

const assignPermissions = function(role, permissions) {
	permissions.forEach((permission) => RocketChat.models.Permissions.addRole(permission, role));
};

const revokePermissions = function(role, permissions) {
	permissions.forEach((permission) => RocketChat.models.Permissions.removeRole(permission, role));
};

const createConfigurationRole = function() {
	RocketChat.models.Roles.createOrUpdate(CONFIGURATION_ROLE_NAME, 'Users', CONFIGURATION_ROLE_NAME);
	const settingPermissions = [
		'change-setting-Message_AllowSnippeting',
		'change-setting-Message_AllowStarring',
		'change-setting-Message_AllowPinning',
		'change-setting-Markdown_Parser',
		'change-setting-Livechat_AllowedDomainsList',
		'change-setting-Livechat_open_inquiery_show_connecting',
		'change-setting-Livechat_transcript_message',
		'change-setting-Livechat_enable_transcript',
		'change-setting-Livechat_enable_office_hours',
		'change-setting-Livechat_show_queue_list_link',
		'change-setting-Livechat_guest_pool_with_no_agents',
		'change-setting-Livechat_Routing_Method',
		'change-setting-Livechat_history_monitor_type',
		'change-setting-Livechat_webhook_on_close',
		'change-setting-Livechat_secret_token',
		'change-setting-Livechat_webhookUrl',
		'change-setting-Livechat_agent_leave_comment',
		'change-setting-Livechat_agent_leave_action_timeout',
		'change-setting-Livechat_agent_leave_action',
		'change-setting-Livechat_Room_Count',
		'change-setting-Livechat_guest_count',
		'change-setting-Livechat_allow_switching_departments',
		'change-setting-Livechat_registration_form',
		'change-setting-Livechat_offline_success_message',
		'change-setting-Livechat_offline_email',
		'change-setting-Livechat_offline_message',
		'change-setting-Livechat_offline_title_color',
		'change-setting-Livechat_offline_title',
		'change-setting-Livechat_offline_form_unavailable',
		'change-setting-Livechat_validate_offline_email',
		'change-setting-Livechat_display_offline_form',
		'change-setting-Livechat_title_color',
		'change-setting-Livechat_title',
		'change-setting-Livechat_enabled',
		'change-setting-Livechat',
		'change-setting-Katex_Dollar_Syntax',
		'change-setting-Katex_Parenthesis_Syntax',
		'change-setting-Katex_Enabled',
		'change-setting-AutoLinker_Phone',
		'change-setting-AutoLinker_Email',
		'change-setting-AutoLinker_UrlsRegExp',
		'change-setting-AutoLinker_Urls_TLD',
		'change-setting-AutoLinker_Urls_www',
		'change-setting-AutoLinker_Urls_Scheme',
		'change-setting-AutoLinker_StripPrefix',
		'change-setting-AutoLinker',
		'change-setting-IssueLinks_Template',
		'change-setting-IssueLinks_Enabled',
		'change-setting-InternalHubot_ScriptsToLoad',
		'change-setting-InternalHubot_Username',
		'change-setting-InternalHubot_Enabled',
		'change-setting-InternalHubot',
		'change-setting-HexColorPreview_Enabled',
		'change-setting-theme-custom-css',
		'change-setting-theme-color-rc-color-content',
		'change-setting-theme-color-rc-color-primary-lightest',
		'change-setting-theme-color-rc-color-primary-light-medium',
		'change-setting-theme-color-rc-color-primary-light',
		'change-setting-theme-color-rc-color-primary-dark',
		'change-setting-theme-color-rc-color-primary-darkest',
		'change-setting-theme-color-rc-color-primary',
		'change-setting-theme-color-rc-color-button-primary-light',
		'change-setting-theme-color-rc-color-button-primary',
		'change-setting-theme-color-rc-color-success-light',
		'change-setting-theme-color-rc-color-success',
		'change-setting-theme-color-rc-color-alert-light',
		'change-setting-theme-color-rc-color-alert',
		'change-setting-theme-color-rc-color-error-light',
		'change-setting-theme-color-rc-color-error',
		'change-setting-Assets_safari_pinned',
		'change-setting-Assets_tile_310_wide',
		'change-setting-Assets_tile_310_square',
		'change-setting-Assets_tile_150',
		'change-setting-Assets_tile_144',
		'change-setting-Assets_touchicon_180_pre',
		'change-setting-Assets_touchicon_180',
		'change-setting-Assets_favicon_512',
		'change-setting-Assets_favicon_192',
		'change-setting-Assets_favicon_32',
		'change-setting-Assets_favicon_16',
		'change-setting-Assets_favicon',
		'change-setting-Assets_favicon_ico',
		'change-setting-Assets_logo',
		'change-setting-Assets_SvgFavicon_Enable',
		'change-setting-Assets',
		'change-setting-UI_Allow_room_names_with_special_chars',
		'change-setting-UI_Unread_Counter_Style',
		'change-setting-UI_Click_Direct_Message',
		'change-setting-UI_Use_Real_Name',
		'change-setting-UI_Use_Name_Avatar',
		'change-setting-UI_Merge_Channels_Groups',
		'change-setting-UI_DisplayRoles',
		'change-setting-Layout_Global_Announcement',
		'change-setting-Layout_Sidenav_Footer',
		'change-setting-Layout_Home_Body',
		'change-setting-Layout_Home_Title',
		'change-setting-Layout',
		'change-setting-Message_HideType_mute_unmute',
		'change-setting-Message_HideType_au',
		'change-setting-Message_HideType_ru',
		'change-setting-Message_HideType_ul',
		'change-setting-Message_HideType_uj',
		'change-setting-Message_QuoteChainLimit',
		'change-setting-API_EmbedDisabledFor',
		'change-setting-API_EmbedCacheExpirationDays',
		'change-setting-API_Embed',
		'change-setting-Message_GroupingPeriod',
		'change-setting-Message_SetNameToAliasEnabled',
		'change-setting-Message_ShowFormattingTips',
		'change-setting-Message_MaxAll',
		'change-setting-Message_KeepHistory',
		'change-setting-Message_BadWordsFilterList',
		'change-setting-Message_AllowBadWordsFilter',
		'change-setting-Message_ShowDeletedStatus',
		'change-setting-Message_ShowEditedStatus',
		'change-setting-Message_AlwaysSearchRegExp',
		'change-setting-Message_AllowDeleting_BlockDeleteInMinutes',
		'change-setting-Message_AllowDeleting',
		'change-setting-Message_AllowEditing_BlockEditInMinutes',
		'change-setting-Message_AllowEditing',
		'change-setting-Message_Attachments_GroupAttach',
		'change-setting-Message',
		'change-setting-Notifications_Max_Room_Members',
		'change-setting-Mobile_Notifications_Default_Alert',
		'change-setting-Desktop_Notifications_Default_Alert',
		'change-setting-Audio_Notifications_Default_Alert',
		'change-setting-Audio_Notifications_Value',
		'change-setting-Desktop_Notifications_Duration',
		'change-setting-Unread_Count_DM',
		'change-setting-Unread_Count',
		'change-setting-First_Channel_After_Login',
		'change-setting-Favorite_Rooms',
		'change-setting-Language',
		'change-setting-General',
		'change-setting-Accounts',
		'change-setting-Accounts_ManuallyApproveNewUsers',
		'change-setting-Accounts_BlockedUsernameList',
		'change-setting-Accounts_RegistrationForm',
		'change-setting-Accounts_RegistrationForm_SecretURL',
		'change-setting-Accounts_RegistrationForm_LinkReplacementText',
		'change-setting-Accounts_Registration_AuthenticationServices_Enabled',
		'change-setting-Assistify_Deactivate_request_closing_comments',
	];

	assignPermissions(CONFIGURATION_ROLE_NAME,
		settingPermissions.concat([
			'manage-emoji',
			'manage-own-integrations',
			'manage-selected-settings',
			'manage-assets',
		]));

	revokePermissions(CONFIGURATION_ROLE_NAME, [
		'change-setting-Accounts_AllowedDomainsList',
		'change-setting-Accounts_BlockedDomainsList',
		'change-setting-API_EmbedIgnoredHosts',
		'change-setting-Message_MaxAllowedSize',
		'change-setting-Markdown_Parser',
		'change-setting-Accounts_BlockedDomainsList',
		'change-setting-Accounts_Iframe_api_method',
		'change-setting-Accounts_Iframe_api_url',
		'change-setting-Accounts_iframe_url',
		'change-setting-Accounts_iframe_enabled',
		'change-setting-UTF8_Names_Slugify',
		'change-setting-UTF8_Names_Validation',
		'change-setting-Custom_Translations',
		'change-setting-Accounts_EmailVerification',
		'change-setting-Verification_Email',
		'change-setting-Verification_Email_Subject',
		'change-setting-Verification_Customized',
		'change-setting-Forgot_Password_Email',
		'change-setting-Forgot_Password_Email_Subject',
		'change-setting-Forgot_Password_Customized',
		'change-setting-Accounts_UserAddedEmail',
		'change-setting-Accounts_UserAddedEmailSubject',
		'change-setting-Accounts_UserAddedEmail_Customized',
		'change-setting-Accounts_Enrollment_Email',
		'change-setting-Accounts_Enrollment_Email_Subject',
		'change-setting-Accounts_Enrollment_Customized',
		'change-setting-Invitation_HTML',
		'change-setting-Invitation_Subject',
		'change-setting-Invitation_Customized',
		'change-setting-Email_Footer',
		'change-setting-Email_Header',
		'change-setting-Offline_Mention_All_Email',
		'change-setting-Offline_Mention_Email',
		'change-setting-Email',
	]);
};

const createManagerRole = function() {
	RocketChat.models.Roles.createOrUpdate(MANAGER_ROLE_NAME, 'Users', MANAGER_ROLE_NAME);

	const permissions = [
		'add-user-to-any-c-room',
		'archive-room',
		'ban-user',
		'bulk-register-user',
		'create-user',
		'delete-c',
		// 'delete-d',
		'delete-message',
		// 'delete-p',
		'edit-message',
		'edit-other-user-active-status',
		'edit-other-user-info',
		'edit-other-user-password',
		'manage-emoji',
		'manage-own-integrations',
		'manage-selected-settings',
		'mute-user',
		'post-readonly',
		'remove-user',
		'set-moderator',
		'set-owner',
		'set-readonly',
		'set-react-when-readonly',
		'unarchive-room',
		'view-full-other-user-info',
		'view-room-administration',
		'view-user-administration',
	];

	assignPermissions(MANAGER_ROLE_NAME, permissions);
};

const adjustStandardRoles = function() {
	const additionalUserPermissions = [
		'add-user-to-joined-room',
	];

	assignPermissions(USER_ROLE_NAME, additionalUserPermissions);

	const additionalGuestPermissions = [
		'view-outside-room',
	];

	assignPermissions(GUEST_ROLE_NAME, additionalGuestPermissions);

};

Meteor.startup(() => {
	createConfigurationRole();
	createManagerRole();
	adjustStandardRoles();
});
