import { useColorScheme } from 'nativewind';

// Paleta por tema. O DARK reproduz exatamente os valores que já estavam
// cravados nas telas (zero regressão). O LIGHT é o equivalente claro.
// Os tons de cinza foram colapsados em poucos tokens (text/dim/faint).
export interface ThemeColors {
  bg: string; // fundo da página
  surface: string; // card / elevado
  surfaceAlt: string; // fundo de modal / barra
  inputBg: string; // fundo de input
  border: string;
  text: string;
  textDim: string; // secundário
  textFaint: string; // terciário / placeholder forte
  accent: string; // azul de marca
  accentSoft: string; // azul mais claro (texto sobre fundo azulado)
  accentBg: string; // fundo azulado (chips ativos, caixas info)
  success: string; // verde (retomar / concluído)
  successSoft: string;
  warn: string; // âmbar (notas)
  danger: string; // vermelho (sair / descartar)
  dangerBg: string;
  tabBar: string;
  tabBorder: string;
}

export const dark: ThemeColors = {
  bg: '#0f0f0f',
  surface: '#1a1a1a',
  surfaceAlt: '#111111',
  inputBg: '#222222',
  border: '#2a2a2a',
  text: '#ffffff',
  textDim: '#888888',
  textFaint: '#555555',
  accent: '#4f9cf9',
  accentSoft: '#9fc8ea',
  accentBg: '#15202b',
  success: '#2d7a3a',
  successSoft: '#6fcf8e',
  warn: '#e0a93f',
  danger: '#ff6b6b',
  dangerBg: '#2a1515',
  tabBar: '#111111',
  tabBorder: '#222222',
};

export const light: ThemeColors = {
  bg: '#f5f6f8',
  surface: '#ffffff',
  surfaceAlt: '#ffffff',
  inputBg: '#eef0f3',
  border: '#dcdee3',
  text: '#11181c',
  textDim: '#5a6470',
  textFaint: '#9aa3ad',
  accent: '#2f6fd0',
  accentSoft: '#2f6fd0',
  accentBg: '#e8f0fb',
  success: '#2d7a3a',
  successSoft: '#2d7a3a',
  warn: '#a8730a',
  danger: '#cc2b2b',
  dangerBg: '#fbe9e9',
  tabBar: '#ffffff',
  tabBorder: '#e3e5ea',
};

/** Hook reativo: retorna a paleta do tema ativo (reage ao colorScheme). */
export function useColors(): ThemeColors {
  const { colorScheme } = useColorScheme();
  return colorScheme === 'light' ? light : dark;
}
