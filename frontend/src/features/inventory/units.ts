import type { UnitMeasurement } from '@/api/generated/model/unitMeasurement'

/** Abreviatura en español de cada unidad de medida de la API. */
export const UNIT_LABEL: Record<UnitMeasurement, string> = {
  g: 'g',
  kg: 'kg',
  l: 'L',
  ml: 'ml',
  oz: 'oz',
  lb: 'lb',
  unit: 'ud.',
  tbsp: 'cda.',
  tsp: 'cdta.',
  cup: 'taza',
  piece: 'pieza',
}
