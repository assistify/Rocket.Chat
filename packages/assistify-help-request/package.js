Package.describe({
	name: 'assistify:help-request',
	version: '0.1.0',
	summary: 'Adds heavy-weight threading with integrated AI to Rocket.Chat',
	git: 'http://github.com/assistify/Rocket.Chat',
	// By default, Meteor will default to using README.md for documentation.
	// To avoid submitting documentation, set this field to null.
	documentation: 'README.md'
});

Package.onUse(function(api) {
	api.versionsFrom('1.2.1');
	api.use(['ecmascript', 'underscore', 'coffeescript', 'less@2.5.1']);
	api.use('assistify:ai');
	api.use('rocketchat:lib'); //In order to be able to attach to RocketChat-Global
	api.use('rocketchat:livechat'); //Due to external messages
	api.use('rocketchat:authorization'); //In order to create custom permissions
	api.use(['nimble:restivus', 'rocketchat:api'], 'server');
	api.use('templating', 'client');
	api.use('meteorhacks:inject-initial'); //for provisioning of svg-icons
	//api.use('overture8:wordcloud2');

	api.addFiles('help-request.js', 'server');
	api.addFiles('server/types.js', 'server');
	api.addFiles('server/api.js', 'server');
	api.addFiles('server/routes.js', 'server');
	api.addFiles('config.js', 'server');
	api.addFiles('startup/customRoomTypes.js');
	api.addFiles('startup/rolesAndPermissions.js', 'server');
	api.addFiles('lib/messageTypes/requestClosed.js');
	api.addFiles('lib/messageTypes/threadMessage.js');

	// Libraries
	api.addFiles('server/inject.js', 'server');

	// Models
	api.addFiles('server/models/Users.js', ['server', 'client']);
	api.addFiles('server/models/Rooms.js', ['server', 'client']);
	api.addFiles('server/models/HelpRequests.js', ['server', 'client']);
	api.addFiles('server/models/LivechatExternalMessage.js', ['server', 'client']);
	api.addFiles('server/models/Message.js', ['server', 'client']);

	api.addFiles('server/publications/Rooms.js', 'server');
	api.addFiles('server/publications/HelpRequests.js', 'server');
	api.addFiles('server/publications/Expertise.js', 'server');

	//Methods
	api.addFiles('server/methods/helpRequestByRoomId.js', 'server');
	api.addFiles('server/methods/closeHelpRequest.js', 'server');
	api.addFiles('server/methods/createExpertise.js', 'server');
	api.addFiles('server/methods/createRequestFactory.js', 'server');
	api.addFiles('server/methods/createRequestBase.js', 'server');
	api.addFiles('server/methods/createRequestFromExpertise.js', 'server');
	api.addFiles('server/methods/createRequestFromRoomId.js', 'server');
	api.addFiles('server/methods/requestsList.js', 'server');
	api.addFiles('server/methods/isValidExpertise.js', 'server');
	api.addFiles('server/methods/expertiseList.js', 'server');

	// we have all migrations in one single file
	api.addFiles('server/migrations.js', 'server');

	// Hooks
	api.addFiles('server/hooks/sendMessageToKnowledgeAdapter.js', 'server');

	// UI artifacts which are pre-processed or packaged by the server
	api.addAssets('client/public/icons.svg', 'server');

	///////// Client

	//Templates
	api.addFiles('client/views/tabbar/HelpRequestContext.html', 'client');
	api.addFiles('client/views/tabbar/HelpRequestContext.js', 'client');
	api.addFiles('client/views/tabbar/HelpRequestContextParameter.html', 'client');
	api.addFiles('client/views/tabbar/HelpRequestContextParameter.js', 'client');
	api.addFiles('client/views/tabbar/HelpRequestActions.html', 'client');
	api.addFiles('client/views/tabbar/HelpRequestActions.js', 'client');
	api.addFiles('client/views/creationDialog/AssistifyCreateRequest.html', 'client');
	api.addFiles('client/views/creationDialog/AssistifyCreateRequest.js', 'client');
	api.addFiles('client/views/creationDialog/AssistifyCreateExpertise.html', 'client');
	api.addFiles('client/views/creationDialog/AssistifyCreateExpertise.js', 'client');
	api.addFiles('client/views/creationDialog/AssistifyCreateInputError.html', 'client');
	api.addFiles('client/views/creationDialog/AssistifyWordCloud.html', 'client');
	api.addFiles('client/views/creationDialog/AssistifyWordCloud.js', 'client');
	api.addFiles('client/views/creationDialog/AssistifyCreateRequestAutocomplete.html', 'client');
	api.addFiles('client/views/creationDialog/AssistifyTopicSearchEmpty.html', 'client');
	api.addFiles('client/views/creationDialog/AssistifyTopicSearchEmpty.js', 'client');
	api.addFiles('client/views/sideNav/requests.html', 'client');
	api.addFiles('client/views/sideNav/requests.js', 'client');
	api.addFiles('client/views/sideNav/expertise.html', 'client');
	api.addFiles('client/views/sideNav/expertise.js', 'client');
	api.addFiles('client/views/sideNav/listRequestsFlex.html', 'client');
	api.addFiles('client/views/sideNav/listRequestsFlex.js', 'client');
	api.addFiles('client/views/messageActions/AssistifyMessageAction.js', 'client');

	//Libraries
	api.addFiles('client/lib/collections.js', 'client');

	//Hooks
	api.addFiles('client/hooks/openAiTab.js', 'client');

	//Assets
	api.addAssets('assets/stylesheets/helpRequestContext.less', 'server'); //has to be done on the server, it exposes the completed css to the client
	api.addFiles('client/public/stylesheets/help-request.css', 'client');

	//global UI modifications
	api.addFiles('client/views/tabbar/tabbarConfig.js', 'client');

	//i18n in Rocket.Chat-package (packages/rocketchat-i18n/i18n
});
