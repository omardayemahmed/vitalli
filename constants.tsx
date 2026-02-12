
import React from 'react';
import { TriageLevel } from './types';

export const COLORS = {
  TEAL: 'bg-teal-600',
  BLUE: 'bg-blue-700',
  CORAL: 'bg-orange-400', // Close to coral
  RED: 'bg-red-600',
  ORANGE: 'bg-orange-500',
  GREEN: 'bg-green-600',
};

export const TRIAGE_LABELS = {
  [TriageLevel.RED]: {
    label: 'HIGH RISK',
    sub: 'Critical / Immediate ER',
    color: 'bg-red-100 text-red-700 border-red-200',
    dot: 'bg-red-600'
  },
  [TriageLevel.ORANGE]: {
    label: 'INTERMEDIATE',
    sub: 'Urgent Priority',
    color: 'bg-orange-100 text-orange-700 border-orange-200',
    dot: 'bg-orange-500'
  },
  [TriageLevel.GREEN]: {
    label: 'STABLE',
    sub: 'Standard Queue',
    color: 'bg-green-100 text-green-700 border-green-200',
    dot: 'bg-green-600'
  }
};
