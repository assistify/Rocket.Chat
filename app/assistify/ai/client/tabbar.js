
import { Tracker } from 'meteor/tracker';

import { settings } from '../../../settings/client';
import { addAction, deleteAction } from '../../../../client/views/room/lib/Toolbox';

Tracker.autorun(() => {
	const enabled = settings.get('Assistify_AI_Enabled');
	if (enabled) {
		addAction('assistify-ai', {
			groups: ['channel', 'group', 'live'],
			id: 'assistify-ai',
			i18nTitle: 'Knowledge_Base',
			icon: 'book',
			template: 'AssistifySmarti',
			order: -1,
		});
	} else {
		try {
			deleteAction('assistify-ai');
		} catch (err) {
			// may not exist, not an issue
		}
	}
});
