import { GRADE_BANDS } from "../config/constants";
import type { GradeBand } from "../model/types";

export function gradeFor(total: number): GradeBand {
  return GRADE_BANDS.reduce((acc, band) => (total >= band.min ? band : acc), GRADE_BANDS[0]);
}
