import React from 'react';
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';

export default function WisdomSelector({ figure, setFigure }) {
  const figures = ['Buddha', 'Jesus', 'Epictetus', 'Vonnegut', 'Laozi', 'Rumi', 'Sagan', 'Twain', "Kooi"];

  return (
    <FormControl fullWidth sx={{ mb: 2 }}>
      <InputLabel>Choose Wisdom Figure</InputLabel>
      <Select value={figure} label="Choose Wisdom Figure" onChange={(e) => setFigure(e.target.value)}>
        {figures.map((name) => (
          <MenuItem key={name} value={name}>{name}</MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
