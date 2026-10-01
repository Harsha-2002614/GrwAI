// Single source of truth for how each "Always honor" preference is
// expressed to two very different downstream consumers:
//
//   • `scenePromptFragment` — concrete visual language appended to the
//     photoreal-scene prompt so the image generator dresses the subject
//     correctly.
//   • `irisConstraint` — behavioral rule injected into the Iris system
//     prompt so the stylist never recommends garments that violate the
//     user's preference (and never re-asks the user to reconfirm).
//
// Both `lib/scene/scenePrompt.ts` and `lib/irisContext.ts` import from
// here. No constraint text may live outside this file.

import type { HonorId } from '@/lib/stores/prefsStore';

export interface HonorConstraint {
  /** Chip label, kept here so UI can render from the same source. */
  label: string;
  /** Appended to the scene prompt when this preference is active. */
  scenePromptFragment: string;
  /** Bullet appended to the Iris system prompt. */
  irisConstraint: string;
}

export const HONOR_CONSTRAINTS: Record<HonorId, HonorConstraint> = {
  hijab_modest: {
    label: 'Hijab / modest',
    scenePromptFragment:
      'Outfit includes a hijab styled cohesively with the look. Full coverage: long sleeves, high neckline, loose silhouette that skims rather than clings. No skin-tight garments, no plunging necklines, no exposed midriff, upper chest, or upper arms.',
    irisConstraint:
      'Only suggest modest garments: long sleeves, high necklines, loose silhouettes, and a hijab option styled with the outfit. Never recommend anything sleeveless, sheer, backless, or skin-tight, and never suggest removing the hijab for a look.',
  },
  saree: {
    label: 'Saree',
    scenePromptFragment:
      'Outfit is a saree draped naturally with authentic pleating and a pallu falling over the shoulder. Blouse fits cleanly; pleats sit centered at the waist. Fabric drape reads as woven cloth, not plastic.',
    irisConstraint:
      'When recommending occasion wear, favor sarees and saree-adjacent silhouettes (draped, pleated, pallu-forward). Speak fluently about blouse cuts, drape styles, and pleat placement — do not translate these to Western equivalents unless the user asks.',
  },
  seated_fit: {
    label: 'Seated / wheelchair fit',
    scenePromptFragment:
      'Subject is seated in a wheelchair. Garments drape naturally for a seated posture — no bunched fabric at the hips, no long back hems pooling behind, no bulky back pockets. Judge hem length and silhouette for a seated position, not a standing one.',
    irisConstraint:
      'Style for seated life. Judge lengths and silhouettes as they appear seated, not standing. Avoid long back hems, bulky back pockets, stiff waistbands that dig when seated, and floor-length hems that catch under wheels. Favor front-length focus, shorter back rises, and soft waistbands.',
  },
  one_handed: {
    label: 'One-handed dressing',
    scenePromptFragment:
      'Garments read as easy to put on with one hand: pull-on styles, wrap fronts, magnetic or large-zip closures, elastic waists. No visible rows of fine buttons, no lace-up backs, no back-zip dresses.',
    irisConstraint:
      'Only suggest garments manageable with one hand: pull-on styles, magnetic or zip closures, elastic waists, wrap fronts. Never suggest fine buttons, back zips, lace-up closures, hook-and-eye rows, or anything requiring two hands to fasten.',
  },
  sensory_friendly: {
    label: 'Sensory-friendly',
    scenePromptFragment:
      'Soft, unstructured fabrics with a fluid drape. No visible stiff seams, no rigid waistbands, no scratchy trims, no visible tags. Neckline and cuffs sit soft against the body.',
    irisConstraint:
      'Favor soft, tagless, seam-flat garments in fluid fabrics (jersey, tencel, brushed cotton). Avoid stiff denim waistbands, wool next-to-skin, sequins, scratchy lace, and anything with prominent internal tags or bulky seams.',
  },
};
