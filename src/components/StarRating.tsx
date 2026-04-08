/**
 * StarRating — thin wrapper around MUI Rating for consistent usage across the app.
 */
import Rating from '@mui/material/Rating';

interface StarRatingProps {
  value: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = { sm: 'small', md: 'medium', lg: 'large' } as const;

export default function StarRating({
  value,
  onChange,
  readonly = false,
  size = 'md',
}: StarRatingProps) {
  return (
    <Rating
      value={value}
      precision={readonly ? 0.5 : 1}
      readOnly={readonly}
      size={sizeMap[size]}
      onChange={readonly ? undefined : (_, v) => onChange?.(v ?? 1)}
    />
  );
}
