import { Paper, type PaperProps } from '@mantine/core';
import { forwardRef, memo } from 'react';
import styles from './Card.module.scss';

export interface CardProps extends PaperProps {
  children?: React.ReactNode;
}

const CardImpl = forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, children, ...rest },
  ref,
) {
  return (
    <Paper ref={ref} className={`${styles.card} ${className ?? ''}`} {...rest}>
      {children}
    </Paper>
  );
});

export const Card = memo(CardImpl);
