import React from 'react';

import GenericModal from '../../../../../components/GenericModal';
import ChannelDesertionTable from '../../ChannelDesertionTable';
import { useTranslation } from '../../../../../contexts/TranslationContext';

export const StepOne = ({
	rooms,
	lastOwnerRooms,
	// params,
	// onChangeParams,
	onToggleAllRooms,
	onChangeRoomSelection,
	onConfirm,
	onCancel,
	selectedRooms,
}) => {
	const t = useTranslation();

	return <GenericModal
		variant='warning'
		title={t('Teams_leave')}
		onConfirm={onConfirm}
		onCancel={onCancel}
		onClose={onCancel}
		confirmText={t('Continue')}
	>
		{t('Teams_leave_channels')}
		<ChannelDesertionTable
			lastOwnerWarning={t('Teams_channels_last_owner_leave_channel_warning')}
			onToggleAllRooms={onToggleAllRooms}
			lastOwnerRooms={lastOwnerRooms}
			rooms={rooms}
			params={{}}
			onChangeParams={() => {}}
			onChangeRoomSelection={onChangeRoomSelection}
			selectedRooms={selectedRooms}
		/>
	</GenericModal>;
};

export default StepOne;
