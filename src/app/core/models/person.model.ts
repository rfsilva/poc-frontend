export interface Person {
  id?: string; // UUID
  name: string;
  email: string;
  address?: string;
  phoneNumber?: string;
  cpf?: string;
  formattedCpf?: string;
  nationality?: string;
  nationalityName?: string;
  nationalityFlag?: string;
  passport?: string;
  gender?: string;
  genderDisplay?: string;
}

export interface Country {
  code: string;
  name: string;
  flag: string;
}

export const COUNTRIES: Country[] = [
  { code: 'BRA', name: 'Brasil', flag: '🇧🇷' },
  { code: 'USA', name: 'Estados Unidos', flag: '🇺🇸' },
  { code: 'GBR', name: 'Reino Unido', flag: '🇬🇧' },
  { code: 'FRA', name: 'França', flag: '🇫🇷' },
  { code: 'DEU', name: 'Alemanha', flag: '🇩🇪' },
  { code: 'ESP', name: 'Espanha', flag: '🇪🇸' },
  { code: 'JPN', name: 'Japão', flag: '🇯🇵' },
  { code: 'CHN', name: 'China', flag: '🇨🇳' },
  { code: 'IND', name: 'Índia', flag: '🇮🇳' },
  { code: 'CAN', name: 'Canadá', flag: '🇨🇦' },
  { code: 'AUS', name: 'Austrália', flag: '🇦🇺' },
  { code: 'RUS', name: 'Rússia', flag: '🇷🇺' },
  { code: 'ARG', name: 'Argentina', flag: '🇦🇷' },
];

export const GENDERS = [
  { value: 'M', display: 'Masculino' },
  { value: 'F', display: 'Feminino' }
];