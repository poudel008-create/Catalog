"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.slugify = void 0;
/**
 * Converts an arbitrary label into a URL-safe slug.
 * e.g. "Home & Garden" -> "home-garden"
 */
const slugify = (value) => value
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
exports.slugify = slugify;
