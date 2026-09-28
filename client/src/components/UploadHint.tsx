import React from 'react';
import { UPLOAD_RULES, type UploadType } from '@client/src/utils/uploadRules';
import { cn } from '@client/src/lib/utils';

interface UploadHintProps {
  type: UploadType;
  className?: string;
}

const UploadHint: React.FC<UploadHintProps> = ({ type, className }) => {
  const rule = UPLOAD_RULES[type];
  return (
    <p className={cn('text-xs text-muted-foreground', className)}>
      {rule.description}
    </p>
  );
};

export default UploadHint;
