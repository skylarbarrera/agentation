/**
 * Markdown Generation Utilities
 * Generates AI-ready markdown from annotations
 *
 * Web API Parity: Supports 4 output detail levels
 * - compact: Minimal - just path + feedback
 * - standard: Default - location, component, feedback
 * - detailed: + parent components, nearby text, search tips
 * - forensic: Everything including full hierarchy, position, timestamps
 */

import type { Annotation, MarkdownOutput, OutputDetailLevel } from '../types';

/**
 * Generate markdown from annotations
 *
 * Creates structured markdown that AI agents can use to find and fix issues
 * Supports 4 detail levels matching web version
 *
 * @param annotations - Array of annotations to convert
 * @param screenName - Current screen name
 * @param detailLevel - Output detail level (default: 'standard')
 * @returns Markdown output object
 *
 * @example
 * ```ts
 * const markdown = generateMarkdown(annotations, 'LoginScreen', 'detailed');
 * Clipboard.setString(markdown.content);
 * ```
 */
export function generateMarkdown(
  annotations: Annotation[],
  screenName: string,
  detailLevel: OutputDetailLevel = 'standard'
): MarkdownOutput {
  const timestamp = Date.now();

  // Sort annotations by Y position (top to bottom)
  const sorted = [...annotations].sort((a, b) => a.y - b.y);

  // Get device/platform info from first annotation (all should be same)
  const firstAnnotation = sorted[0];
  const platform = firstAnnotation?.platform;
  const routeName = firstAnnotation?.routeName;
  const navigationPath = firstAnnotation?.navigationPath;
  const screenDims = firstAnnotation?.screenDimensions;
  const pixelRatio = firstAnnotation?.pixelRatio;

  // Use route name as page title if available, otherwise fall back to screenName
  const pageTitle = routeName || screenName;

  if (annotations.length === 0) {
    return {
      content: `# Page Feedback: ${pageTitle}\n\nNo annotations yet.`,
      count: 0,
      screen: pageTitle,
      timestamp,
    };
  }

  let content = '';

  // Route output based on detail level
  switch (detailLevel) {
    case 'compact':
      content = generateCompactOutput(sorted, pageTitle);
      break;
    case 'detailed':
      content = generateDetailedOutput(sorted, pageTitle, {
        routeName, navigationPath, platform, screenDims, timestamp,
      });
      break;
    case 'forensic':
      content = generateForensicOutput(sorted, pageTitle, {
        routeName, navigationPath, platform, screenDims, pixelRatio, timestamp,
      });
      break;
    case 'standard':
    default:
      content = generateStandardOutput(sorted, pageTitle, {
        routeName, platform, screenDims, timestamp,
      });
      break;
  }

  return {
    content,
    count: annotations.length,
    screen: pageTitle,
    timestamp,
  };
}

// =============================================================================
// Output Format Generators
// =============================================================================

/**
 * Compact output - minimal, just location + feedback
 */
function generateCompactOutput(
  annotations: Annotation[],
  pageTitle: string
): string {
  let content = `## Feedback: ${pageTitle}\n\n`;

  annotations.forEach((annotation, index) => {
    const elementDisplay = annotation.element || 'Component';
    content += `${index + 1}. **${annotation.elementPath}** (${elementDisplay})\n`;
    content += `   ${annotation.comment}\n\n`;
  });

  return content;
}

/**
 * Standard output - location, component, feedback (default)
 */
function generateStandardOutput(
  annotations: Annotation[],
  pageTitle: string,
  context: {
    routeName?: string;
    platform?: string;
    screenDims?: { width: number; height: number };
    timestamp: number;
  }
): string {
  let content = `## Page Feedback: ${pageTitle}\n`;

  // Basic context
  if (context.screenDims) {
    content += `**Screen:** ${context.screenDims.width}x${context.screenDims.height}\n`;
  }
  if (context.platform) {
    content += `**Platform:** ${context.platform}\n`;
  }

  content += `\n`;

  // Annotations
  annotations.forEach((annotation, index) => {
    content += `### ${index + 1}. ${annotation.element || 'Component'}\n`;
    content += `**Location:** \`${annotation.elementPath}\`\n`;

    if (annotation.componentType) {
      content += `**Component:** ${annotation.componentType}\n`;
    }

    if (annotation.boundingBox) {
      content += `**Position:** ${Math.round(annotation.boundingBox.x)}, ${Math.round(annotation.boundingBox.y)} (${Math.round(annotation.boundingBox.width)}x${Math.round(annotation.boundingBox.height)})\n`;
    }

    content += `**Feedback:** ${annotation.comment}\n\n`;
  });

  return content;
}

/**
 * Detailed output - + parent components, nearby text, search tips
 */
function generateDetailedOutput(
  annotations: Annotation[],
  pageTitle: string,
  context: {
    routeName?: string;
    navigationPath?: string;
    platform?: string;
    screenDims?: { width: number; height: number };
    timestamp: number;
  }
): string {
  let content = `## Page Feedback: ${pageTitle}\n`;

  // Extended context
  if (context.screenDims) {
    content += `**Screen:** ${context.screenDims.width}x${context.screenDims.height}\n`;
  }
  if (context.routeName) {
    content += `**Route:** ${context.routeName}\n`;
  }
  if (context.navigationPath) {
    content += `**Navigation Path:** ${context.navigationPath}\n`;
  }
  if (context.platform) {
    content += `**Platform:** ${context.platform}\n`;
  }

  content += `\n---\n\n`;

  // Annotations with more detail
  annotations.forEach((annotation, index) => {
    content += `### ${index + 1}. ${annotation.element || 'Component'}\n\n`;
    content += `**Location:** \`${annotation.elementPath}\`\n`;

    if (annotation.componentType) {
      content += `**Component:** ${annotation.componentType}\n`;
    }

    if (annotation.parentComponents && annotation.parentComponents.length > 0) {
      content += `**Parent Components:** ${annotation.parentComponents.join(' > ')}\n`;
    }

    if (annotation.boundingBox) {
      content += `**Bounding box:** x:${Math.round(annotation.boundingBox.x)}, y:${Math.round(annotation.boundingBox.y)}, ${Math.round(annotation.boundingBox.width)}x${Math.round(annotation.boundingBox.height)}px\n`;
    }

    if (annotation.nearbyText) {
      content += `**Nearby text:** "${annotation.nearbyText}"\n`;
    }

    if (annotation.selectedText) {
      content += `**Selected text:** "${annotation.selectedText}"\n`;
    }

    if (annotation.accessibility) {
      content += `**Accessibility:** ${annotation.accessibility}\n`;
    }

    content += `\n**Issue:** ${annotation.comment}\n\n`;
    content += `---\n\n`;
  });

  // Search tips
  content += `**Search tips:** Use the file paths above to find components. `;
  content += `Try \`grep -r "ComponentName"\` or search for the nearby text.\n`;

  return content;
}

/**
 * Forensic output - everything including full hierarchy, timestamps, device info
 */
function generateForensicOutput(
  annotations: Annotation[],
  pageTitle: string,
  context: {
    routeName?: string;
    navigationPath?: string;
    platform?: string;
    screenDims?: { width: number; height: number };
    pixelRatio?: number;
    timestamp: number;
  }
): string {
  let content = `## Page Feedback: ${pageTitle}\n\n`;

  // Full environment info
  content += `**Environment:**\n`;
  if (context.routeName) {
    content += `- Route: ${context.routeName}\n`;
  }
  if (context.navigationPath) {
    content += `- Navigation Path: ${context.navigationPath}\n`;
  }
  if (context.platform) {
    content += `- Platform: ${context.platform}\n`;
  }
  if (context.screenDims) {
    content += `- Screen: ${context.screenDims.width}x${context.screenDims.height}\n`;
  }
  if (context.pixelRatio) {
    content += `- Pixel Ratio: ${context.pixelRatio}\n`;
  }
  content += `- Timestamp: ${new Date(context.timestamp).toISOString()}\n`;

  content += `\n---\n\n`;

  // Full annotation details
  annotations.forEach((annotation, index) => {
    content += `### ${index + 1}. ${annotation.element || 'Component'}\n\n`;

    // Source location with column
    if (annotation.columnNumber) {
      content += `**Source:** ${annotation.elementPath}:${annotation.columnNumber}\n`;
    } else {
      content += `**Source:** ${annotation.elementPath}\n`;
    }

    if (annotation.componentType) {
      content += `**Component Type:** ${annotation.componentType}\n`;
    }

    // Full hierarchy
    if (annotation.fullPath) {
      content += `**Full Hierarchy:** ${annotation.fullPath}\n`;
    } else if (annotation.parentComponents && annotation.parentComponents.length > 0) {
      content += `**Full Hierarchy:** ${annotation.parentComponents.join(' > ')} > ${annotation.element}\n`;
    }

    if (annotation.testID) {
      content += `**TestID:** ${annotation.testID}\n`;
    }

    // Position details
    content += `\n**Position:**\n`;
    if (annotation.boundingBox) {
      content += `- Bounding box: x:${Math.round(annotation.boundingBox.x)}, y:${Math.round(annotation.boundingBox.y)}\n`;
      content += `- Dimensions: ${Math.round(annotation.boundingBox.width)}x${Math.round(annotation.boundingBox.height)}px\n`;
    }
    content += `- Annotation at: ${Math.round(annotation.x)}px, ${Math.round(annotation.y)}px\n`;

    // Text content
    if (annotation.selectedText) {
      content += `\n**Selected text:** "${annotation.selectedText}"\n`;
    }
    if (annotation.nearbyText) {
      content += `**Nearby text:** "${annotation.nearbyText}"\n`;
    }
    if (annotation.nearbyElements) {
      content += `**Nearby elements:** ${annotation.nearbyElements}\n`;
    }

    // Accessibility
    if (annotation.accessibility) {
      content += `**Accessibility:** ${annotation.accessibility}\n`;
    }

    content += `\n**Issue:** ${annotation.comment}\n\n`;
    content += `---\n\n`;
  });

  return content;
}

/**
 * Format a single annotation as markdown
 *
 * @param annotation - The annotation to format
 * @param index - Annotation number
 * @returns Markdown string
 */
function formatAnnotation(annotation: Annotation, index: number): string {
  let markdown = `### ${index}. ${annotation.element}\n\n`;

  // Location (most important for Claude Code)
  markdown += `**Location:** ${annotation.elementPath}\n`;

  // Component type if available
  if (annotation.componentType) {
    markdown += `**Component:** ${annotation.componentType}\n`;
  }

  // Feedback/comment
  markdown += `**Feedback:** ${annotation.comment}\n`;

  // Optional: Selected text
  if (annotation.selectedText) {
    markdown += `**Selected Text:** "${annotation.selectedText}"\n`;
  }

  // Optional: Accessibility info
  if (annotation.accessibility) {
    markdown += `**Accessibility:** ${annotation.accessibility}\n`;
  }

  // Optional: TestID as fallback
  if (annotation.testID) {
    markdown += `**TestID:** ${annotation.testID}\n`;
  }

  // Optional: Component bounds (for reference)
  if (annotation.boundingBox) {
    markdown += `**Position:** (${Math.round(annotation.boundingBox.x)}, ${Math.round(annotation.boundingBox.y)})\n`;
    markdown += `**Size:** ${Math.round(annotation.boundingBox.width)}x${Math.round(annotation.boundingBox.height)}\n`;
  }

  return markdown;
}

/**
 * Generate simplified markdown (compact format)
 *
 * Alias for generateMarkdown with 'compact' detail level
 *
 * @param annotations - Annotations to convert
 * @param screenName - Screen name
 * @returns Simple markdown string
 */
export function generateSimpleMarkdown(
  annotations: Annotation[],
  screenName: string
): string {
  return generateMarkdown(annotations, screenName, 'compact').content;
}

/**
 * Generate markdown for a single annotation
 *
 * Useful for immediate copy after creating annotation
 *
 * @param annotation - Single annotation
 * @param screenName - Screen name
 * @returns Markdown string
 */
export function generateSingleAnnotationMarkdown(
  annotation: Annotation,
  screenName: string
): string {
  let markdown = `## ${screenName} - ${annotation.element}\n\n`;
  markdown += `**Location:** ${annotation.elementPath}\n`;
  markdown += `**Feedback:** ${annotation.comment}\n`;

  return markdown;
}

/**
 * Validate markdown generation
 *
 * Checks that all required fields are present
 *
 * @param annotation - Annotation to validate
 * @returns true if annotation can be converted to markdown
 */
export function canGenerateMarkdown(annotation: Annotation): boolean {
  return Boolean(
    annotation.elementPath &&
    annotation.comment &&
    annotation.element
  );
}

/**
 * Get markdown statistics
 *
 * Provides info about generated markdown
 *
 * @param annotations - Annotations
 * @returns Statistics object
 */
export function getMarkdownStats(annotations: Annotation[]): {
  total: number;
  withSourcePaths: number;
  withTestIDs: number;
  withAccessibility: number;
  withSelectedText: number;
} {
  return {
    total: annotations.length,
    withSourcePaths: annotations.filter(a => a.sourcePath).length,
    withTestIDs: annotations.filter(a => a.testID).length,
    withAccessibility: annotations.filter(a => a.accessibility).length,
    withSelectedText: annotations.filter(a => a.selectedText).length,
  };
}
