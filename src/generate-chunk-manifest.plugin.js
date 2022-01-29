const fse = require("fs-extra");
const path = require("path");
const ChunkManifestPlugin = require("./chunk-manifest.plugin");
const chalk = require("chalk");

/**
 * Webpack plugin to be used in the webpack.config.js
 * An instance of this class should be added in the list
 * of plugins
 *
 * This plugin writes chunk-manifest.json and injects a reference to it into
 * index.html. This enables chunks ids to kept in a separate variable than in
 * the same vendor or app file, so that the vendor or app hash id does not
 * change if there is no change in the file but there is a change in the chunk
 * file
 *
 * @type {module.GenerateChunkManifestHtmlWebpackPlugin}
 */
module.exports = class GenerateChunkManifestHtmlWebpackPlugin {

    /**
     *
     * @param {Object} [options] - configurations to used while creating the instance
     * @param {string} [options.packageName] - Unique identifier for window object
     * @param {string} [options.filename="manifest.json"] - The name of the manifest file.
     * @param {string} [options.chunkManifestVariable="webpackChunkManifest"] - Variable used in
     * html-webpack-plugin template.
     *
     */
    constructor(options = {}) {
        const packageName = options.packageName || "PACKAGE";
        this.manifestVariable = `webpackManifest_${packageName}`;
        this.manifestFilename = options.filename || "manifest.json";
        this.chunkManifestVariable = options.chunkManifestVariable || "webpackChunkManifest";
        this.plugins = [
            new ChunkManifestPlugin({
                filename: this.manifestFilename,
                manifestVariable: this.manifestVariable,
            }),
        ];
    }

    /**
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
        this.applyDependencyPlugins(compiler);

        const {manifestFilename, manifestVariable, chunkManifestVariable} = this;

        compiler.hooks.compilation.tap("compilation", (compilation) => {
            const hooks = this.getHtmlWebpackPluginHooks(compiler, compilation);
            const addAssetTagsHook = hooks.alterAssetTags;
            const writeManifestFileHook = hooks.beforeAssetTagGeneration;

            if (addAssetTagsHook) {
                addAssetTagsHook.tapAsync(
                    "GenerateChunkManifestHtmlWebpackPlugin-add-asset-tags",
                    (htmlPluginData, callback) => {
                        const asset = compilation.assets[manifestFilename];
                        const json = (asset && asset.source()) || JSON.stringify({});
                        const newTag = {
                            tagName: "script",
                            closeTag: true,
                            attributes: {
                                type: "text/javascript",
                            },
                            innerHTML: `window["${manifestVariable}"]=${json}`,
                            voidTag: false,
                            meta: {
                                plugin: "generate-chunk-manifest-webpack-plugin",
                            }
                        };

                        htmlPluginData.assetTags.scripts.unshift(newTag);

                        callback(null, htmlPluginData);
                    }
                );
            } else {
                GenerateChunkManifestHtmlWebpackPlugin.htmlWebpackPluginWarning();
            }

            if (writeManifestFileHook) {
                writeManifestFileHook.tapAsync(
                    "GenerateChunkManifestHtmlWebpackPlugin-write-manifest-file",
                    (htmlPluginData, callback) => {
                        const asset = compilation.assets[manifestFilename];

                        const json = (asset && asset.source()) || JSON.stringify({});
                        htmlPluginData.assets[
                            chunkManifestVariable
                            ] = `<script type="text/javascript">window["${manifestVariable}"]=${json}</script>`;
                        const outputFile = path.resolve(
                            compilation.options.output.path,
                            "chunk-manifest.json"
                        );
                        fse.outputFileSync(outputFile, json);
                        callback(null, htmlPluginData);
                    }
                );
            } else {
                GenerateChunkManifestHtmlWebpackPlugin.htmlWebpackPluginWarning();
            }
        });
    }

    /**
     * This method apply all the plugins before running itself
     *
     * @param {object} compiler - represents the fully configured Webpack environment.
     * Using the compiler object, you may bind callbacks that provide a reference to
     * each new compilation. These compilations provide callbacks for hooking into
     * numerous steps within the build process
     */
    applyDependencyPlugins(compiler) {
        this.plugins.forEach((plugin) => plugin.apply.call(plugin, compiler));
    }

      /**
     * Returns the hooks for the current compilation
     *
     * @param {object} compiler - represents the fully configured Webpack environment.
     * @param {object} compilation - the current compilation.
     */
    getHtmlWebpackPluginHooks(compiler, compilation) {
        // Must use the same HtmlWebpackPlugin class the compiler uses or hooks won't
        // be executed. See https://github.com/jantimon/html-webpack-plugin/issues/1091
        const [HtmlWebpackPlugin] = compiler.options.plugins
            .filter((plugin) => plugin.constructor.name === "HtmlWebpackPlugin")
            .map((plugin) => plugin.constructor);
        return HtmlWebpackPlugin?.getHooks(compilation);
    }

    /**
     * This method will console log the warning message missing or mis-configured HTMLWebpackPlugin
     * */
    static htmlWebpackPluginWarning() {
        console.log(
            chalk.redBright(
                `HTMLWebpackPlugin not found!! Make sure
                        HTMLWebpackPlugin come before GenerateChunkManifestHtmlWebpackPlugin
                        in Webpack config plugin list. 
                        https://github.com/jharris4/html-webpack-tags-plugin/issues/25`
            )
        );
    }
};
