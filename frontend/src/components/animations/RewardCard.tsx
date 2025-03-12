import React from 'react';
import { motion } from 'framer-motion';
import { 
  Card, 
  CardMedia, 
  CardContent, 
  CardActions, 
  Typography, 
  Button, 
  Divider, 
  Box 
} from '@mui/material';
import StarsIcon from '@mui/icons-material/Stars';
import RedeemIcon from '@mui/icons-material/Redeem';
import { RewardTemplate } from '../../services/RewardService';
import HoverAnimation from './HoverAnimation';

interface RewardCardProps {
  reward: RewardTemplate;
  onRedeemClick: (reward: RewardTemplate) => void;
  isRewardAffordable: (points: number) => boolean;
  getCategoryChip: (category: string) => JSX.Element;
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: { type: 'spring', stiffness: 300, damping: 24 }
  },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
};

const RewardCard: React.FC<RewardCardProps> = ({ 
  reward, 
  onRedeemClick, 
  isRewardAffordable,
  getCategoryChip
}) => {
  return (
    <motion.div
      variants={itemVariants}
      layout
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
    >
      <HoverAnimation scale={1.02}>
        <Card sx={{ 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          position: 'relative',
          opacity: isRewardAffordable(reward.pointsCost) ? 1 : 0.7
        }}>
          {reward.imageUrl && (
            <CardMedia
              component="img"
              height="140"
              image={reward.imageUrl}
              alt={reward.title}
            />
          )}
          <CardContent sx={{ flexGrow: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
              <Typography variant="h6" component="h2" gutterBottom>
                {reward.title}
              </Typography>
              {getCategoryChip(reward.category)}
            </Box>
            <Typography color="textSecondary" variant="body2" gutterBottom>
              {reward.description}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
              <StarsIcon sx={{ color: 'warning.main', mr: 0.5 }} />
              <Typography 
                variant="h6" 
                color={isRewardAffordable(reward.pointsCost) ? 'warning.main' : 'text.disabled'}
              >
                {reward.pointsCost} punti
              </Typography>
            </Box>
          </CardContent>
          <Divider />
          <CardActions>
            <Button 
              fullWidth
              variant="contained"
              color="primary"
              startIcon={<RedeemIcon />}
              onClick={() => onRedeemClick(reward)}
              disabled={!isRewardAffordable(reward.pointsCost)}
            >
              Riscatta
            </Button>
          </CardActions>
          {!isRewardAffordable(reward.pointsCost) && (
            <Box 
              sx={{ 
                position: 'absolute',
                top: 10,
                right: 10,
                bgcolor: 'error.main',
                color: 'white',
                px: 1,
                py: 0.5,
                borderRadius: 1,
                fontSize: '0.75rem',
                fontWeight: 'bold'
              }}
            >
              Punti insufficienti
            </Box>
          )}
        </Card>
      </HoverAnimation>
    </motion.div>
  );
};

export default RewardCard;
