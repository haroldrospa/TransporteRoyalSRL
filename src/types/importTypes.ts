
import { Region } from './conduces';

export type Laboratorio = 'LAM' | 'Fersuaz' | 'Taapharmaceutica' | 'Innovacion Quimica';

export type ImportFormatType = 'asignados' | 'sin_asignar';

export interface ImportFormValues {
  fechaSalida: string;
  region: Region;
  laboratorio: Laboratorio;
  formatType?: ImportFormatType;
}

