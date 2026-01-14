/**
 * APCA (Advanced Perceptual Contrast Algorithm) Implementation
 * PRD 0052: WCAG 3.0 Perceptual Contrast for Accessibility
 * 
 * Based on: https://github.com/Myndex/SAPC-APCA
 * APCA provides more accurate contrast perception than WCAG 2.1 luminance ratios
 */

import { wcagLuminance, formatHex } from "culori";

// APCA Constants (from official specification)
const normBG = 0.56;
const normTXT = 0.57;
const revTXT = 0.62;
const revBG = 0.65;

const blkThrs = 0.022;
const blkClmp = 1.414;
const scaleBoW = 1.14;
const scaleWoB = 1.14;
const loBoWoffset = 0.027;
const loWoBoffset = 0.027;
const deltaYmin = 0.0005;
const loClip = 0.1;

/**
 * Calculate APCA contrast value between text and background colors
 * @param {string} textColor - CSS color string for text
 * @param {string} backgroundColor - CSS color string for background
 * @returns {number} APCA contrast value (can be positive or negative)
 */
export function calculateAPCA(textColor, backgroundColor) {
  // Get Y (relative luminance) values using WCAG luminance
  const Ytxt = wcagLuminance(textColor);
  const Ybg = wcagLuminance(backgroundColor);
  
  if (Ytxt === null || Ybg === null) {
    throw new Error("Invalid color format");
  }
  
  // Soft clamp for low values
  let Yclamp = 0;
  if (Ybg > Ytxt) {
    // Light background
    Yclamp = (Ybg ** normBG - Ytxt ** normTXT) * scaleBoW;
  } else {
    // Dark background
    Yclamp = (Ybg ** revBG - Ytxt ** revTXT) * scaleWoB;
  }
  
  // Clamp very low contrasts to zero
  if (Math.abs(Yclamp) < deltaYmin) {
    return 0;
  }
  
  // Soft clamp and offset
  let outputContrast;
  if (Yclamp > 0) {
    outputContrast = Yclamp - loBoWoffset;
  } else {
    outputContrast = Yclamp + loWoBoffset;
  }
  
  // Hard clip at minimum
  if (Math.abs(outputContrast) < loClip) {
    return 0;
  }
  
  // Scale to 0-108+ range
  return outputContrast * 100;
}

/**
 * Get APCA compliance level for a contrast value
 * @param {number} apcaValue - APCA contrast value
 * @returns {object} Compliance information
 */
export function getAPCACompliance(apcaValue) {
  const absValue = Math.abs(apcaValue);
  
  // APCA levels (approximate WCAG 3.0 draft thresholds)
  if (absValue >= 90) {
    return {
      level: "AAA",
      pass: true,
      description: "Excellent - Suitable for all text sizes and weights",
    };
  } else if (absValue >= 75) {
    return {
      level: "AA",
      pass: true,
      description: "Good - Suitable for body text (16px+)",
    };
  } else if (absValue >= 60) {
    return {
      level: "Large",
      pass: true,
      description: "Acceptable for large text (24px+) or bold text (18.66px+)",
    };
  } else if (absValue >= 45) {
    return {
      level: "Non-text",
      pass: true,
      description: "Minimum for non-text elements (icons, borders)",
    };
  } else {
    return {
      level: "Fail",
      pass: false,
      description: "Insufficient contrast - Does not meet accessibility standards",
    };
  }
}

/**
 * Calculate WCAG 2.1 contrast ratio (for comparison)
 * @param {string} textColor - CSS color string for text
 * @param {string} backgroundColor - CSS color string for background
 * @returns {number} Contrast ratio (1-21)
 */
export function calculateWCAG21Contrast(textColor, backgroundColor) {
  const L1 = wcagLuminance(textColor);
  const L2 = wcagLuminance(backgroundColor);
  
  if (L1 === null || L2 === null) {
    throw new Error("Invalid color format");
  }
  
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Get WCAG 2.1 compliance level
 * @param {number} contrastRatio - Contrast ratio value
 * @param {string} textSize - 'normal' or 'large'
 * @returns {object} Compliance information
 */
export function getWCAG21Compliance(contrastRatio, textSize = "normal") {
  if (textSize === "large") {
    if (contrastRatio >= 4.5) {
      return { level: "AAA", pass: true, description: "Enhanced contrast for large text" };
    } else if (contrastRatio >= 3) {
      return { level: "AA", pass: true, description: "Minimum contrast for large text" };
    }
  } else {
    if (contrastRatio >= 7) {
      return { level: "AAA", pass: true, description: "Enhanced contrast for normal text" };
    } else if (contrastRatio >= 4.5) {
      return { level: "AA", pass: true, description: "Minimum contrast for normal text" };
    }
  }
  
  return { level: "Fail", pass: false, description: "Insufficient contrast" };
}

/**
 * Check both WCAG 2.1 and APCA contrast for a color pair
 * @param {string} textColor - Text color
 * @param {string} backgroundColor - Background color
 * @param {string} textSize - 'normal' or 'large'
 * @returns {object} Combined contrast analysis
 */
export function analyzeContrast(textColor, backgroundColor, textSize = "normal") {
  try {
    const wcag21 = calculateWCAG21Contrast(textColor, backgroundColor);
    const apca = calculateAPCA(textColor, backgroundColor);
    
    return {
      wcag21: {
        ratio: wcag21,
        compliance: getWCAG21Compliance(wcag21, textSize),
      },
      apca: {
        value: apca,
        compliance: getAPCACompliance(apca),
      },
      recommended: apca < 0 ? "dark-on-light" : "light-on-dark",
    };
  } catch (error) {
    return {
      error: error.message,
      wcag21: null,
      apca: null,
    };
  }
}

export default {
  calculateAPCA,
  getAPCACompliance,
  calculateWCAG21Contrast,
  getWCAG21Compliance,
  analyzeContrast,
};
