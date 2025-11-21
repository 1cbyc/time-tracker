import React, { KeyboardEvent, useCallback, useState } from 'react';
import { Input } from 'antd';
import { observer } from 'mobx-react';
import { v4 as uuid } from 'uuid';

import rootStore from '../../../modules/RootStore';
import TaskModel from '../../../modules/tasks/models/TaskModel';
import ValidationHelper from '../../../helpers/ValidationHelper';
import ErrorHandler from '../../../helpers/ErrorHandler';

interface Props {
  className?: string;
}

export default observer(function TaskInput({ className }: Props) {
  const [text, setText] = useState('');

  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      // Hotkey: Enter
      if (event.key === 'Enter') {
        const trimmedText = text.trim();
        
        // Validate task title
        const validation = ValidationHelper.validateTaskTitle(trimmedText);
        if (!validation.valid) {
          ErrorHandler.handleValidationError(validation.errors);
          return;
        }

        const { tasksStore, projectStore } = rootStore;
        tasksStore.add(
          new TaskModel({
            key: uuid(),
            title: trimmedText,
            projectId: projectStore.activeProject,
            active: false,
            time: [],
            checked: false,
            children: [],
            datesInProgress: [],
            details: [],
            parent: undefined, // Add into root
            expanded: true,
          })
        );
        setText('');
      }
    },
    [text]
  );

  const handleChange = useCallback((e: any) => setText(e.target.value), []);

  return (
    <Input
      className={className}
      placeholder="Create task..."
      onKeyPress={handleKeyPress}
      value={text}
      onChange={handleChange}
    />
  );
});
