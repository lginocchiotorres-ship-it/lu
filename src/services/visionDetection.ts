import { MOCK_FINDING } from '../data/mockFinding';
import { HazardFinding } from '../types/inspection';

export type DetectionFrameInput = {
  cameraReady: boolean;
};

/**
 * Placeholder para el futuro modelo de visión por computadora.
 * En esta primera versión devuelve un único hallazgo simulado cuando la inspección está activa.
 */
export function detectHazards(_input: DetectionFrameInput): HazardFinding[] {
  return [MOCK_FINDING];
}
