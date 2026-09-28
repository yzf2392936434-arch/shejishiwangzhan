import React from 'react';
import { cn } from '@client/src/lib/utils';

interface WordCountProps {
  current: number;
  max: number;
  label?: string;
  className?: string;
}

const WordCount: React.FC<WordCountProps> = ({ current, max, label, className }) => {
  const ratio = current / max;
  const colorClass =
    ratio > 1
      ? 'text-red-500 font-medium'
      : ratio > 0.8
        ? 'text-amber-600'
        : 'text-muted-foreground';

  return (
    <span
      className={cn('text-xs tabular-nums', colorClass, className)}
      title={label ? `${label}：${current} / ${max}` : undefined}
    >
      {current} / {max}
    </span>
  );
};

export default WordCount;
