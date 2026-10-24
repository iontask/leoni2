/**
 * LEONI QualiTrack - Types pour le Benchmark de Performance (20 000 Recrues) - Étape 8
 */

export interface BenchmarkStepResult {
  nomTest: string;
  description: string;
  nombreElements: number;
  tempsEcouleMs: number;
  seuilLimiteMs: number; // Ex: 2000 ms
  conformeSLA: boolean;
  resultatResume: string;
}

export interface BenchmarkReport {
  dateExecution: string;
  totalRecruesTest: number; // 20 000
  tempsTotalGlobalMs: number;
  conformeSLA2Secondes: boolean;
  tests: BenchmarkStepResult[];
  systemInfo: {
    environnement: string;
    indexActifs: string[];
    seuilMaximalExigeMs: number;
  };
}
