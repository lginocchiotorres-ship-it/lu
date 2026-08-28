export type HazardFinding = {
  id: string;
  title: string;
  hazardType: string;
  riskCategory: string;
  riskLevel: 'Bajo' | 'Medio' | 'Alto' | 'Crítico';
  description: string;
  recommendation: string;
  confidence: number;
  boundingBox: { x: number; y: number; width: number; height: number };
  capturedPhotoUri?: string;
};
