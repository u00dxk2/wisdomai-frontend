import React, { useMemo } from 'react';
import { Box, Chip, Typography, useMediaQuery, Paper, Fade } from '@mui/material';
import { useTheme } from '@mui/material/styles';

// Conversation starters for each wisdom figure
const STARTERS = {
  Buddha: [
    "I'm overwhelmed by work—how can I find calm in the chaos?",
    "Why do my cravings keep derailing my goals?",
    "Teach me a simple practice to let go of anger today."
  ],
  Epictetus: [
    "What part of this situation is truly under my control right now?",
    "How do I toughen up against everyday annoyances?",
    "Show me how to turn this setback into strength."
  ],
  Laozi: [
    "How can I stop forcing outcomes and just flow?",
    "What does 'doing less, accomplishing more' look like for my busy life?",
    "Guide me to harmony when people around me feel combative."
  ],
  Jesus: [
    "How do I genuinely love someone who frustrates me?",
    "Help me choose compassion over judgment in this conflict.",
    "What's a small act of kindness I can offer today?"
  ],
  Rumi: [
    "Point me toward the 'doorway within' when I feel lost.",
    "How do I turn heartbreak into a deeper love of life?",
    "Invite me to dance with uncertainty instead of fearing it."
  ],
  Sagan: [
    "Remind me why my problems are tiny yet meaningful in the cosmic perspective.",
    "How can I stay curious when routine feels dull?",
    "Help me communicate science to friends who tune out."
  ],
  Twain: [
    "How do I keep my sense of humor when life gets absurd?",
    "Give me courage to speak the uncomfortable truth—without getting fired.",
    "What's your trick for turning everyday blunders into good stories?"
  ],
  Vonnegut: [
    "Show me how to stay kind in a world that feels like dystopian satire.",
    "Is my career path just 'so it goes,' or can I rewrite it?",
    "Help me find meaning when life seems like a dark joke."
  ],
  Kooi: [
    "How can I integrate mindfulness into my busy daily routine?",
    "What's your approach to balancing scientific thinking with spiritual experience?",
    "Help me reconnect with nature in my technology-filled life."
  ]
};

// Color mapping for each wisdom figure
const FIGURE_COLORS = {
  Buddha: {
    light: '#e3f2fd',
    medium: '#bbdefb',
    dark: '#64b5f6'
  },
  Epictetus: {
    light: '#f3e5f5',
    medium: '#e1bee7',
    dark: '#ba68c8'
  },
  Laozi: {
    light: '#e8f5e9',
    medium: '#c8e6c9',
    dark: '#81c784'
  },
  Jesus: {
    light: '#fff8e1',
    medium: '#ffecb3',
    dark: '#ffd54f'
  },
  Rumi: {
    light: '#fce4ec',
    medium: '#f8bbd0',
    dark: '#f06292'
  },
  Sagan: {
    light: '#e0f7fa',
    medium: '#b2ebf2',
    dark: '#4dd0e1'
  },
  Twain: {
    light: '#fffde7',
    medium: '#fff9c4',
    dark: '#ffee58'
  },
  Vonnegut: {
    light: '#f1f8e9',
    medium: '#dcedc8',
    dark: '#aed581'
  },
  Kooi: {
    light: '#efebe9',
    medium: '#d7ccc8',
    dark: '#a1887f'
  }
};

// Get colors for a figure with fallback to default
const getColors = (figure) => {
  return FIGURE_COLORS[figure] || {
    light: '#f0f7ff',
    medium: '#daeaff',
    dark: '#90caf9'
  };
};

/**
 * Component that renders conversation starter chips for the selected wisdom figure
 * 
 * @component
 * @param {Object} props - Component props
 * @param {string} props.selectedFigure - Currently selected wisdom figure
 * @param {Function} props.onSelectStarter - Function to handle when a starter is selected
 * @param {boolean} props.disabled - Whether the starters should be disabled
 */
const ConversationStarters = ({ selectedFigure, onSelectStarter, disabled }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Memoize colors to prevent unnecessary re-renders
  const colors = useMemo(() => 
    getColors(selectedFigure || 'Buddha'), [selectedFigure]);

  // Memoize starter items to prevent unnecessary re-renders
  const starterItems = useMemo(() => {
    if (!selectedFigure || !STARTERS[selectedFigure]) return [];
    
    return STARTERS[selectedFigure].map((starter, index) => (
      <StarterChip
        key={`${selectedFigure}-starter-${index}`}
        starter={starter}
        onSelect={onSelectStarter}
        disabled={disabled}
        colors={colors}
        isMobile={isMobile}
      />
    ));
  }, [selectedFigure, onSelectStarter, disabled, colors, isMobile]);
  
  // If no figure is selected or the figure doesn't have starters, return null
  if (!selectedFigure || !STARTERS[selectedFigure]) {
    return null;
  }

  return (
    <Fade in={!!selectedFigure} timeout={500}>
      <Paper 
        elevation={0} 
        sx={{ 
          mb: 2,
          p: 2,
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          borderRadius: 2,
          border: `1px solid ${colors.medium}`
        }}
      >
        <Typography 
          variant="subtitle2" 
          sx={{ 
            mb: 1.5, 
            color: 'text.primary',
            fontWeight: 500,
            fontSize: '0.9rem',
            borderBottom: `1px solid ${colors.medium}`,
            paddingBottom: 1
          }}
        >
          Try asking {selectedFigure}:
        </Typography>
        
        <Box sx={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          gap: 1.5,
          flexWrap: 'wrap'
        }}>
          {starterItems}
        </Box>
      </Paper>
    </Fade>
  );
};

// Memoized starter chip component to prevent re-renders
const StarterChip = React.memo(({ starter, onSelect, disabled, colors, isMobile }) => {
  return (
    <Chip
      label={starter}
      onClick={() => onSelect(starter)}
      disabled={disabled}
      sx={{
        px: 1.5,
        py: 3,
        height: 'auto',
        '& .MuiChip-label': {
          whiteSpace: 'normal',
          textAlign: 'left',
          lineHeight: '1.5',
          py: 0.7,
          px: 0.5,
          fontWeight: 400
        },
        backgroundColor: colors.light,
        borderColor: colors.medium,
        color: 'text.primary',
        border: `1px solid ${colors.medium}`,
        transition: 'all 0.15s ease',
        '&:hover': {
          backgroundColor: colors.medium,
          transform: 'translateY(-2px)',
          boxShadow: '0 3px 8px rgba(0,0,0,0.08)'
        },
        '&:active': {
          transform: 'translateY(0px)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)'
        },
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.7 : 1,
        width: isMobile ? '100%' : 'auto',
        minWidth: isMobile ? 'auto' : '180px',
        maxWidth: isMobile ? 'auto' : '220px',
        flexGrow: isMobile ? 0 : 1,
        borderRadius: '16px'
      }}
    />
  );
});

export default React.memo(ConversationStarters); 