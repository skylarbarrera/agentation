"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  default: () => index_default,
  isReanimatedPauseStateAvailable: () => isReanimatedPauseStateAvailable,
  reanimatedPausePlugin: () => reanimatedPausePlugin
});
module.exports = __toCommonJS(index_exports);
var RPS = null;
try {
  RPS = require("reanimated-pause-state");
} catch {
}
function isReanimatedPauseStateAvailable() {
  return RPS !== null && typeof RPS.isInstalled === "function" && RPS.isInstalled();
}
function reanimatedPausePlugin() {
  return {
    id: "reanimated-pause-state",
    supportsPause: true,
    isAvailable() {
      return true;
    },
    onPauseChange(paused) {
      if (!RPS) return;
      try {
        if (paused) {
          RPS.pause();
        } else {
          RPS.resume();
        }
      } catch (e) {
        console.warn("[agentation-rps] pause/resume failed:", e);
      }
    },
    getExtras(ctx) {
      if (!RPS) return null;
      try {
        const opts = {
          maxAnimations: 20
        };
        if (ctx.parentComponents?.length) {
          opts.filterComponent = ctx.parentComponents[ctx.parentComponents.length - 1];
        }
        if (ctx.targetFile) {
          opts.filterFile = ctx.targetFile;
        }
        if (ctx.targetLine) {
          opts.filterLine = ctx.targetLine;
          opts.proximityThreshold = 20;
        }
        const markdown = RPS.getSnapshotMarkdown(opts);
        if (!markdown || markdown.toLowerCase().includes("no active animations") || markdown.toLowerCase().includes("no animations")) {
          return null;
        }
        return {
          id: "reanimated",
          markdown
        };
      } catch (e) {
        console.warn("[agentation-rps] getExtras failed:", e);
        return null;
      }
    }
  };
}
var index_default = reanimatedPausePlugin;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  isReanimatedPauseStateAvailable,
  reanimatedPausePlugin
});
