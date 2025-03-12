import React from 'react';
import { Chip } from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  CardGiftcard as GiftIcon,
  Stars as StarsIcon
} from '@mui/icons-material';

/**
 * Restituisce un chip colorato corrispondente alla categoria del premio
 */
export const getCategoryChip = (category: string) => {
  switch (category.toLowerCase()) {
    case 'fisico':
      return (
        <Chip
          icon={<GiftIcon />}
          label="Fisico"
          color="primary"
          size="small"
          sx={{ fontWeight: 'medium' }}
        />
      );
    case 'digitale':
      return (
        <Chip
          icon={<StarsIcon />}
          label="Digitale"
          color="info"
          size="small"
          sx={{ fontWeight: 'medium' }}
        />
      );
    case 'privilegio':
      return (
        <Chip
          icon={<TrophyIcon />}
          label="Privilegio"
          color="warning"
          size="small"
          sx={{ fontWeight: 'medium' }}
        />
      );
    default:
      return (
        <Chip
          label={category}
          color="default"
          size="small"
          sx={{ fontWeight: 'medium' }}
        />
      );
  }
};
