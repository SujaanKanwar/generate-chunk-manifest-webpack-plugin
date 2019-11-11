const fse = require("fs-extra");
const path = require("path");
const ChunkManifestPlugin = require("./chunk-manifest.plugin");
const chalk = require("chalk");

/**
 * Webpack plugin to be used in the webpack.config.js
 * An instance of this class should be added in the list
 * of plugins
 *
 * This plugin writes asset-manifest.json and asset-inject-manifest.json
 * file which are used by the uploader and dev server plugin.
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

            if (compilation.hooks.htmlWebpackPluginAlterAssetTags) {
                compilation.hooks.htmlWebpackPluginAlterAssetTags.tapAsync(
                    "html-webpack-plugin-alter-asset-tags",
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
                        };

                        htmlPluginData.body.unshift(newTag);

                        callback(null, htmlPluginData);
                    }
                );
            } else {
                GenerateChunkManifestHtmlWebpackPlugin.htmlWebpackPluginWarning();
            }

            if (compilation.hooks.htmlWebpackPluginBeforeHtmlGeneration) {
                compilation.hooks.htmlWebpackPluginBeforeHtmlGeneration.tapAsync(
                    "html-webpack-plugin-before-html-generation",
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
