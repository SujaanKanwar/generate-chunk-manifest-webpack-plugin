/* globals describe:false, it:false, expect:false */

import webpack from "webpack";
import HTMLWebpackPlugin from "html-webpack-plugin";
const CleanWebpackPlugin = require("clean-webpack-plugin");
import path from "path";
import fs from "fs-extra";
import merge from "webpack-merge";
import GenerateChunkManifestHtmlWebpackPlugin from "../src";

const distPath = path.resolve(__dirname, "./ui-package/dist");
const chunkManifestPath = path.resolve(distPath, "chunk-manifest.json");

describe("inline-chunks-webpack should fail initialization", () => {
  let commonWebpackConfig;
  beforeEach(() => {
    commonWebpackConfig = {
      entry: path.resolve(
        __dirname,
        "./ui-package/app/index-without-splitting.js"
      ),
      output: {
        path: distPath,
      },
      plugins: [new HTMLWebpackPlugin(), new CleanWebpackPlugin(distPath)],
    };
  });
});

describe("inline-chunks-webpack gets initialized", () => {
  let commonWebpackConfig;
  beforeEach(() => {
    commonWebpackConfig = {
      output: {
        path: distPath,
      },
      plugins: [
        new HTMLWebpackPlugin(),
        new GenerateChunkManifestHtmlWebpackPlugin({
          packageName: "ui-test-package",
        }),
        new CleanWebpackPlugin(distPath),
      ],
    };
  });
  it("without code splitting with development mode", (done) => {
    const webpackOptions = merge(commonWebpackConfig, {
      mode: "development",
      entry: path.resolve(
        __dirname,
        "./ui-package/app/index-without-splitting.js"
      ),
    });
    // Run webpack
    webpack(webpackOptions, (err) => {
      expect(err).toBe(null);
      const chunksInject = fs.readJsonSync(chunkManifestPath);
      expect(chunksInject).not.toHaveProperty("0");
      expect(Object.keys(chunksInject).length).toEqual(0);
      done();
    });
  });

  it("without code splitting with production mode", (done) => {
    const webpackOptions = merge(commonWebpackConfig, {
      mode: "production",
      entry: path.resolve(
        __dirname,
        "./ui-package/app/index-without-splitting.js"
      ),
    });
    // Run webpack
    webpack(webpackOptions, (err) => {
      expect(err).toBe(null);
      const chunksInject = fs.readJsonSync(chunkManifestPath);
      expect(chunksInject).not.toHaveProperty("0");
      expect(Object.keys(chunksInject).length).toEqual(0);
      done();
    });
  });

  it("with code splitting with development mode", (done) => {
    const webpackOptions = merge(commonWebpackConfig, {
      mode: "development",
      entry: path.resolve(
        __dirname,
        "./ui-package/app/index-with-splitting.js"
      ),
    });

    // Run webpack
    webpack(webpackOptions, (err) => {
      expect(err).toBe(null);
      const chunksInject = fs.readJsonSync(chunkManifestPath);
      expect(chunksInject).toHaveProperty("0");
      expect(Object.keys(chunksInject).length).toEqual(1);
      done();
    });
  });

  it("with code splitting with production mode", (done) => {
    const webpackOptions = merge(commonWebpackConfig, {
      mode: "production",
      entry: path.resolve(
        __dirname,
        "./ui-package/app/index-with-splitting.js"
      ),
    });

    // Run webpack
    webpack(webpackOptions, (err) => {
      expect(err).toBe(null);
      const chunksInject = fs.readJsonSync(chunkManifestPath);
      /*
       * in production mode chunk indexing starts with 1 instead of 0
       * */
      expect(chunksInject).toHaveProperty("1");
      expect(Object.keys(chunksInject).length).toEqual(1);
      done();
    });
  });
});
