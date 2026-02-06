var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});

// src/index.ts
var RPS = null;
try {
  RPS = __require("reanimated-pause-state");
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
export {
  index_default as default,
  isReanimatedPauseStateAvailable,
  reanimatedPausePlugin
};
