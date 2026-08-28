import { HazardFinding } from '../types/inspection';

export const MOCK_FINDING: HazardFinding = {
  id: 'simulated-exposed-cable',
  title: 'Cable eléctrico expuesto',
  hazardType: 'Condición insegura',
  riskCategory: 'Riesgo eléctrico',
  riskLevel: 'Alto',
  description:
    'Se observa un cable eléctrico expuesto en el área inspeccionada. Esta condición puede ocasionar contacto accidental, descarga eléctrica o inicio de incendio.',
  recommendation:
    'Aislar el área, señalizar el peligro y solicitar reparación inmediata por personal eléctrico calificado antes de reanudar actividades cercanas.',
  confidence: 91,
  boundingBox: { x: 0.2, y: 0.28, width: 0.58, height: 0.22 },
};
