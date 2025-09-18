export interface Person {
  id?: string; // Alterado de number para string para suportar UUID
  name: string;
  birthDate: string;
  email: string;
  address?: string;
  phoneNumber?: string;
}