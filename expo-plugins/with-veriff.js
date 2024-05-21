const {
  createGeneratedHeaderComment,
  removeGeneratedContents,
} = require("@expo/config-plugins/build/utils/generateCode");

const gradleMaven = [
  `allprojects {
  repositories {
    maven {
      url 'https://cdn.veriff.me/android/'
    }
  }
}`,
].join("\n");

/** @type {import("@expo/config-plugins").ConfigPlugin} */
const defineConfig = (config) => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require("@expo/config-plugins").withProjectBuildGradle(
    config,
    (config) => {
      if (config.modResults.language === "groovy") {
        config.modResults.contents = appendContents({
          tag: "veriff-import",
          src: config.modResults.contents,
          newSrc: gradleMaven,
          comment: "//",
        }).contents;
      } else {
        throw new Error(
          "Cannot add camera maven gradle because the build.gradle is not groovy",
        );
      }

      return config;
    },
  );
};

// Fork of config-plugins mergeContents, but appends the contents to the end of the file.
/**
 * Appends new contents to a source string if the contents are not already present,
 * and ensures that old generated contents are removed.
 *
 * @param {Object} params - The parameters for the function.
 * @param {string} params.src - The original source string.
 * @param {string} params.newSrc - The new content to append.
 * @param {string} params.tag - A tag to identify the generated content.
 * @param {string} params.comment - A comment to use for marking the generated content.
 * @returns {import("@expo/config-plugins/build/utils/generateCode").MergeResults} The result of the merge operation.
 */
function appendContents({ src, newSrc, tag, comment }) {
  const header = createGeneratedHeaderComment(newSrc, tag, comment);
  if (!src.includes(header)) {
    // Ensure the old generated contents are removed.
    const sanitizedTarget = removeGeneratedContents(src, tag);
    const contentsToAdd = [
      // @something
      header,
      // contents
      newSrc,
      // @end
      `${comment} @generated end ${tag}`,
    ].join("\n");

    return {
      contents: sanitizedTarget ?? src + contentsToAdd,
      didMerge: true,
      didClear: !!sanitizedTarget,
    };
  }
  return { contents: src, didClear: false, didMerge: false };
}

module.exports = defineConfig;
