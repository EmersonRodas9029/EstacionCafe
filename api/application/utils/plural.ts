/** "1 usuario" / "3 usuarios" para mensajes de error legibles. */
export const plural = (count: number, singular: string, pluralForm = `${singular}s`) =>
  `${count} ${count === 1 ? singular : pluralForm}`;
