/**
 * Knowledge Base Routes
 *
 * Plan matching, medication lookup, ICD-10 suggestions.
 * NO PHI — these endpoints serve only reference data from neuro-plans.
 * Auth required (to prevent unauthorized data access) but not audited as PHI.
 */

import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { getKnowledgeService } from "@services/knowledge/service.js";

const router = Router();

/**
 * GET /api/knowledge/plans?diagnosis=...&icd10=...&keywords=...
 * Search for matching clinical plans.
 */
router.get("/plans", requireAuth, async (req, res, next) => {
  try {
    const knowledge = getKnowledgeService();
    const results = await knowledge.matchPlans({
      diagnosisText: req.query.diagnosis as string | undefined,
      icd10Code: req.query.icd10 as string | undefined,
      keywords: req.query.keywords
        ? (req.query.keywords as string).split(",")
        : undefined,
    });
    res.json({ data: results });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/knowledge/medications/:name
 * Look up a medication by name.
 */
router.get("/medications/:name", requireAuth, async (req, res, next) => {
  try {
    const knowledge = getKnowledgeService();
    const nameParam = Array.isArray(req.params.name) ? req.params.name[0]! : req.params.name as string;
    const result = await knowledge.lookupMedication(nameParam);
    if (!result) {
      res.status(404).json({
        error: { code: "404", message: "Medication not found" },
      });
      return;
    }
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/knowledge/medications/validate-dose
 * Validate a medication dose against recommended ranges.
 */
router.post(
  "/medications/validate-dose",
  requireAuth,
  async (req, res, next) => {
    try {
      const { medicationName, mentionedDose, indication } = req.body;
      if (!medicationName || !mentionedDose) {
        res.status(400).json({
          error: {
            code: "400",
            message: "medicationName and mentionedDose are required",
          },
        });
        return;
      }
      const knowledge = getKnowledgeService();
      const result = await knowledge.validateDose(
        medicationName,
        mentionedDose,
        indication,
      );
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /api/knowledge/icd10
 * Get ICD-10 suggestions from assessment text.
 */
router.post("/icd10", requireAuth, async (req, res, next) => {
  try {
    const { assessmentText } = req.body;
    if (!assessmentText) {
      res.status(400).json({
        error: { code: "400", message: "assessmentText is required" },
      });
      return;
    }
    const knowledge = getKnowledgeService();
    const results = await knowledge.suggestIcd10(assessmentText);
    res.json({ data: results });
  } catch (err) {
    next(err);
  }
});

export default router;
