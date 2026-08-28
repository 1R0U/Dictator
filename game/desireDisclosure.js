const AXIS_KEY = String.raw`(?:domination|egoism|innovation|prestige|madness)`;
const JAPANESE_AXIS = '(?:支配|我欲|変革|威信|狂気)';
const INTERNAL_STAGE = String.raw`(?:very[- ]high|very[- ]low|high|neutral|low|非常に高い|非常に低い|高水準|低水準|中立)`;
const INTERNAL_VALUE = String.raw`(?:(?:100|[1-9]?\d)(?:\.\d+)?\s*(?:点|%|％)?)`;
const DISCLOSURE_VALUE = `(?:${INTERNAL_STAGE}|${INTERNAL_VALUE})`;

const METER_CLAUSE_PATTERN = /欲望メーター[^。\n！？]*/gi;
const ENGLISH_DISCLOSURE_PATTERN = new RegExp(
  String.raw`\b${AXIS_KEY}\b\s*(?:[:：=]|is)?\s*${DISCLOSURE_VALUE}`,
  'gi',
);
const ENGLISH_AXIS_PATTERN = new RegExp(String.raw`\b${AXIS_KEY}\b`, 'gi');
const JAPANESE_DISCLOSURE_PATTERN = new RegExp(
  `${JAPANESE_AXIS}\\s*(?:[:：=]|は|が)?\\s*${DISCLOSURE_VALUE}`,
  'g',
);

/**
 * Remove explicit desire-meter disclosures from generated story text while
 * preserving unrelated in-world numbers such as population and case counts.
 */
function redactDesireDisclosure(text) {
  if (typeof text !== 'string' || !text) return '';

  return text
    .replace(METER_CLAUSE_PATTERN, '内部指標は非公開です')
    .replace(ENGLISH_DISCLOSURE_PATTERN, '内部指標は非公開')
    .replace(ENGLISH_AXIS_PATTERN, '内部指標')
    .replace(JAPANESE_DISCLOSURE_PATTERN, '内部指標は非公開');
}

module.exports = { redactDesireDisclosure };
