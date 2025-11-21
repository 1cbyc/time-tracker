import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react';
import { Input, Modal, Space } from 'antd';
import { v4 as uuid } from 'uuid';

import rootStore from '../../../../modules/RootStore';
import ProjectModel from '../../../../modules/projects/models/ProjectModel';
import ChooseColor from './components/ChooseColor';
import ValidationHelper from '../../../../helpers/ValidationHelper';
import ErrorHandler from '../../../../helpers/ErrorHandler';

const { projectStore } = rootStore;

interface ProjectModalProps {
  project?: ProjectModel;
  onClose: () => void;
}

export default observer(function ProjectModal({
  project,
  onClose,
}: ProjectModalProps) {
  const [projectName, setProjectName] = useState<string>('');
  const [color, setColor] = useState<string | undefined>();

  useEffect(() => {
    setProjectName(project?.title || '');
  }, [project]);

  function handleOk() {
    const trimmedName = projectName.trim();

    // Validate project title
    const titleValidation = ValidationHelper.validateProjectTitle(trimmedName);
    if (!titleValidation.valid) {
      ErrorHandler.handleValidationError(titleValidation.errors);
      return;
    }

    // Validate color if provided
    if (color) {
      const colorValidation = ValidationHelper.validateProjectColor(color);
      if (!colorValidation.valid) {
        ErrorHandler.handleValidationError(colorValidation.errors);
        return;
      }
    }

    projectStore.add(
      new ProjectModel({
        key: uuid(),
        title: trimmedName,
        color: color || '',
        children: [],
        expanded: true,
        deletable: true,
        parent: undefined,
      })
    );
    onClose();
  }

  function handleCancel() {
    onClose();
  }

  return (
    <Modal
      title="Create project"
      visible
      onOk={handleOk}
      onCancel={handleCancel}
      okText="Create"
    >
      <Space direction="vertical">
        <Input
          placeholder="Project name..."
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
        />
        <ChooseColor
          activeColor={color}
          onChoose={(color) => setColor(color)}
        />
      </Space>
    </Modal>
  );
});
