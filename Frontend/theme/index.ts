
import { config as defaultConfig } from '@gluestack-ui/config';

export const config = {
  tokens: {
    ...defaultConfig.tokens,
    colors: {
      ...defaultConfig.tokens.colors,
      primary500: '#7B4AE2',
      white: '#ffffff',
      backgroundLight100: '#f0f0f0',
      textDark: '#555555',
    },
    space: {
      ...defaultConfig.tokens.space,
      '1': 4,
      '2': 8,
      '2.5': 10,
      '3': 12,
      '4': 16,
      '5': 20,
      '8': 32,
    },
    fontSizes: {
      ...defaultConfig.tokens.fontSizes,
      sm: 14, 
      md: 16, 
      xl: 24, 
    },
    radii: {
      ...defaultConfig.tokens.radii,
      lg: 10,
    },
    fontWeights: {
      ...defaultConfig.tokens.fontWeights,
      bold: '700',
    },
  },

  components: {

    Input: {
      baseStyle: {
        width: '100%',
        _input: {
          bg: '$backgroundLight100',
          fontSize: '$md',
          padding: '$4',
        },
        borderRadius: '$lg',
      },
    },

    Button: {
      baseStyle: {
        width: '100%',
        backgroundColor: '$primary500',
        padding: '$4',
        borderRadius: '$lg',
        alignItems: 'center',
      },
    },

    ButtonText: {
      baseStyle: {
        color: '$white',
        fontSize: '$md',
        fontWeight: '$bold',
      },
    },

    LinkText: {
      baseStyle: {
        color: '$primary500',
        fontWeight: '$bold',
      },
    },
  },
};