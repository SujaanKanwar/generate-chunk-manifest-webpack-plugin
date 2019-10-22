const RawSource = require("webpack-sources").RawSource;

/**
 * Webpack plugin to be used in the webpack.config.js
 * An instance of this class should be added in the list
 * of plugins
 *
 * This enables chunks ids to kept in a separate variable
 * than in the same vendor or app file, so that the vendor
 * or app hash id does not change if there is no change in
 * the file but there is a change in the chunk file
 */
class ChunkManifestPlugin {

    /**
     * Creates an instance of this plugin
     *
     * @param {Object} [options] - configurations to used while creating the instance
     * @param {string} [options.filename="manifest.json"] - The name of the manifest file.
     * @param {string} [options.manifestVariable="webpackManifest"] - The name of the manifest variable
     * which will hold the mapping of the chunks.
     */
    constructor(options = {}) {
        this.manifestFilename = options.filename || "manifest.json";
        this.manifestVariable = options.manifestVariable || "webpackManifest";
    }

    /**
     *
     * Webpack compiler invokes apply function once by the  while installing the plugin
     * The apply method is given a reference to the underlying Webpack compiler, which
     * grants access to compiler callbacks.
     *
     * @param {object} compiler - represents the fully configured Webpack environment.
     * Using the compiler object, you may bind callbacks that provide a reference to
     * each new compilation. These compilations provide callbacks for hooking into
     * numerous steps within the build process
     */
    apply(compiler) {
        const manifestFilename = this.manifestFilename;
        const manifestVariable = this.manifestVariable;

        let oldChunkFilename = null;
        let chunkManifest = null;

        const thisCompilationCallback = (compilation) => {
            const mainTemplate = compilation.mainTemplate;

            mainTemplate.hooks.requireEnsure.tap("require-ensure", function (
                source,
                chunk,
                hash
                /*, chunkIdVariableName */
            ) {
                const filename =
                    compilation.outputOptions.chunkFilename ||
                    compilation.outputOptions.filename;
                if (filename) {
                    chunkManifest = [chunk].reduce(function registerChunk(manifest, c) {
                        if (c.id in manifest) return manifest;
                        const hasRuntime =
                            typeof c.hasRuntime === "function" ? c.hasRuntime() : c.entry;
                        if (hasRuntime) {
                            manifest[c.id] = undefined;
                        } else {
                            manifest[c.id] = compilation.mainTemplate.hooks.assetPath.call(
                                filename,
                                {
                                    hash: hash,
                                    chunk: c,
                                }
                            );
                        }
                        return compilation.chunks.reduce(registerChunk, manifest);
                    }, {});
                    oldChunkFilename = compilation.outputOptions.chunkFilename;
                    compilation.outputOptions.chunkFilename = "__CHUNK_MANIFEST__";
                    // mark as asset for emitting
                    compilation.assets[manifestFilename] = new RawSource(
                        JSON.stringify(chunkManifest)
                    );
                    chunk.files.push(manifestFilename);
                }
                return source;
            });
        };

        const compilationCallback = (compilation) => {
            const mainTemplate = compilation.mainTemplate;
            mainTemplate.hooks.requireEnsure.tap("require-ensure", function (
                source,
                chunk,
                hash,
                chunkIdVar
            ) {
                if (oldChunkFilename) {
                    compilation.outputOptions.chunkFilename = oldChunkFilename;
                }

                return source
                    .replace(
                        '"__CHUNK_MANIFEST__"',
                        'window["' + manifestVariable + '"][' + chunkIdVar + "]"
                    )
                    .replace(
                        /* ref(webpack 4) node_modules/webpack/lib/web/JsonpMainTemplatePlugin.js line: 285
                         * In bundled js, above code converted into
                         *
                         * function jsonpScriptSrc(chunkId){return __webpack_require__.p+"static/js/"+({}[chunkId]||chunkId)+".chunk.js"}
                         *
                         * We have written our own manifest file, which has all the chunk references
                         * manifestVariable = {chunkId: "path"}
                         * manifestVariable has been defined in the window.
                         *
                         * O/P
                         * script.src = __webpack_require__.p + window["webpackManifest_PACKAGE"][chunkId];
                         * __webpack_require__.p  // public full path
                         */

                        "jsonpScriptSrc(chunkId)",
                        '__webpack_require__.p + window["' +
                        manifestVariable +
                        '"][' +
                        chunkIdVar +
                        "]"
                    );
            });

        };

        compiler.hooks.thisCompilation.tap("this-compilation", thisCompilationCallback);
        compiler.hooks.compilation.tap("compilation", compilationCallback);

    }
}

module.exports = ChunkManifestPlugin;
