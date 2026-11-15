// Team code → flag emoji, for badges and chips.
export const TEAM_FLAGS: Record<string, string> = {
  IND: '🇮🇳',
  AUS: '🇦🇺',
  ENG: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  NZ: '🇳🇿',
  PAK: '🇵🇰',
  SA: '🇿🇦',
  SL: '🇱🇰',
  WI: '🌴',
};
export const flag = (team: string) => TEAM_FLAGS[team] ?? '🏏';

export const LANGUAGES = ['English', 'Hindi', 'Tamil', 'Telugu', 'Bengali', 'Marathi'];
