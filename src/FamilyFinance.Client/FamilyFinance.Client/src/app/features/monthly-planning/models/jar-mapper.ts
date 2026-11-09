import { PredefinedJarKey } from './monthly-plan.model';

export function normalizeJarKey(backendJarType: string): PredefinedJarKey {
  const normalized = backendJarType.toLowerCase();
  switch (normalized) {
    case 'living':
    case 'livingexpenses':
      return 'living';
    case 'food':
      return 'food';
    case 'children':
      return 'children';
    case 'emergency':
    case 'emergencyfund':
      return 'emergency';
    case 'savings':
      return 'savings';
    case 'investment':
      return 'investment';
    case 'travel':
    case 'entertainmentandtravel':
      return 'travel';
    default:
      return 'living';
  }
}

export function toBackendJarType(key: PredefinedJarKey): string {
  switch (key) {
    case 'living':
      return 'livingExpenses';
    case 'food':
      return 'food';
    case 'children':
      return 'children';
    case 'emergency':
      return 'emergencyFund';
    case 'savings':
      return 'savings';
    case 'investment':
      return 'investment';
    case 'travel':
      return 'entertainmentAndTravel';
  }
}

