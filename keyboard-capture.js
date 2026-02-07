// keyboard/keyboard-capture.js

import { bufferChar } from "./keyboard-buffer.js";

export function initKeyboardCapture(inputElement) {
  inputElement.addEventListener("input", (e) => {
    const value = e.target.value;

    // نأخذ آخر رمز فقط (يدعم الإيموجي)
    const chars = Array.from(value);
    const lastChar = chars[chars.length - 1];

    if (!lastChar) return;

    bufferChar(lastChar);
  });
}
