/**
 * @fileoverview Component for selecting a wisdom figure to converse with.
 * Provides a dropdown menu of available wisdom figures.
 */

import React from 'react';
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';

/**
 * List of available wisdom figures that users can select from.
 * @constant {Array<string>}
 */
const WISDOM_FIGURES = [
  'Buddha',
  'Jesus',
  'Epictetus',
  'Vonnegut',
  'Laozi',
  'Rumi',
  'Sagan',
  'Twain',
  'Kooi'
];

/**
 * Component that renders a dropdown menu for selecting a wisdom figure.
 * Allows users to choose which historical or fictional figure they want to converse with.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {string} props.figure - Currently selected wisdom figure
 * @param {Function} props.setFigure - Function to update the selected wisdom figure
 * 
 * @example
 * <WisdomSelector 
 *   figure="Buddha"
 *   setFigure={(figure) => setSelectedFigure(figure)}
 * />
 */
export default function WisdomSelector({ figure, setFigure }) {
  return (
    <FormControl fullWidth sx={{ mb: 2 }}>
      <InputLabel>With Whom Would You Like To Speak?</InputLabel>
      <Select 
        value={figure} 
        label="With Whom Would You Like To Converse?" 
        onChange={(e) => setFigure(e.target.value)}
      >
        {WISDOM_FIGURES.map((name) => (
          <MenuItem key={name} value={name}>{name}</MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
