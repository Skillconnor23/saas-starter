import type { GeckoLevel } from './questions';

export interface LevelInfo {
  name: string;
  fullName: string;
  description: string;
  recommendedClass: string;
}

export const GEKO_LEVEL_INFO: Record<GeckoLevel, LevelInfo> = {
  G: {
    name: 'Groundwork',
    fullName: 'G – Groundwork',
    description:
      'You are building the foundations of English. Focus on basic vocabulary, simple sentences, and everyday phrases. This level helps you get comfortable with the basics before moving forward.',
    recommendedClass: 'Gecko Groundwork (G) — For beginners starting their English journey',
  },
  E: {
    name: 'Essentials',
    fullName: 'E – Essentials',
    description:
      'You have a solid base and are ready to expand. At this level, you work on essential grammar, common expressions, and building confidence in simple conversations.',
    recommendedClass: 'Gecko Essentials (E) — Build core grammar and vocabulary',
  },
  C: {
    name: 'Conversational',
    fullName: 'C – Conversational',
    description:
      'You can hold everyday conversations and express ideas. This level focuses on fluency, natural expressions, and discussing familiar topics with ease.',
    recommendedClass: 'Gecko Conversational (C) — Speak with confidence',
  },
  K: {
    name: 'Knowledge',
    fullName: 'K – Knowledge',
    description:
      'You have strong conversational skills and are ready for more complex topics. This level develops accuracy, richer vocabulary, and the ability to discuss abstract ideas.',
    recommendedClass: 'Gecko Knowledge (K) — Advanced vocabulary and nuance',
  },
  O: {
    name: 'Opportunity',
    fullName: 'O – Opportunity',
    description:
      'You are ready to use English in professional, academic, or creative contexts. This level refines fluency and precision so you can communicate effectively in demanding situations.',
    recommendedClass: 'Gecko Opportunity (O) — Master-level communication',
  },
};
